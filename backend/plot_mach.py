from flask import Flask, request, jsonify, send_file, Response
import bb84
import bb84_simulation as Simu
from flask_cors import CORS
import io
import numpy as np
import matplotlib.pyplot as plt

app = Flask(__name__)
CORS(app)

@app.route('/bb84', methods=['POST'])
def run_bb84_endpoint():
    try:
        payload = request.json
        app.logger.debug("Received payload from frontend: %s", payload)

        n_bits = payload.get('bitCount', 100)
        is_eve_mode = payload.get('isEveMode', False)

        # Extract only simulation parameters
        setup_params = {k: v for k, v in payload.items()
                        if k not in ('bitCount', 'isEveMode', 'isNoEveMode')}
        app.logger.debug("Parameters for setup: %s", setup_params)

        # Choose simulation function based on mode
        if is_eve_mode:
            results = bb84.bb84_Eve(n_bits=n_bits, params=bb84.setup_parameters(setup_params))
        else:
            results = bb84.bb84_no_Eve(n_bits=n_bits, params=bb84.setup_parameters(setup_params))

        # Unpack results including Eve's data
        (alice_bits, bob_bits, alice_bases, bob_bases,
         eve_bits, eve_bases, sifted_key, qber, matching_count) = results

        response_data = {
            "alice_bits": alice_bits,
            "bob_bits": bob_bits,
            "alice_bases": alice_bases,
            "bob_bases": bob_bases,
            "eve_bits": eve_bits,
            "eve_bases": eve_bases,
            "sifted_key": sifted_key,
            "quantum_bit_error_rate": qber,
            "matching_bases_count": matching_count
        }

        app.logger.debug("Sending response: %s", response_data)
        return jsonify(response_data)

    except Exception as e:
        app.logger.error("Error during BB84 simulation: %s", e)
        return jsonify({"error": str(e)}), 400

# New endpoint: return circuit SVG with Bob's measurements
@app.route('/bb84_circuit', methods=['POST'])
def bb84_circuit_endpoint():
    try:
        payload = request.json
        app.logger.debug("Received payload for circuit: %s", payload)
        n_bits = payload.get('bitCount', 100)

        # Extract only parameters for setup
        setup_params = {k: v for k, v in payload.items()
                        if k not in ('bitCount', 'isEveMode', 'isNoEveMode')}

        # Simulate BB84 (no Eve)
        alice_bits, bob_bits, alice_bases, bob_bases, _, _, _, qber, _ = \
            bb84.bb84_no_Eve(n_bits=n_bits, params=bb84.setup_parameters(setup_params))

        # Generate SVG string of the circuit with measurements
        svg = bb84.plot_circuit_svg(alice_bits, alice_bases, bob_bases, bob_bits)
        return Response(svg, mimetype='image/svg+xml')

    except Exception as e:
        app.logger.error("Error generating circuit SVG: %s", e)
        return jsonify({"error": str(e)}), 400

@app.route('/bb84_simu', methods=['POST'])
def bb84_simulation():
    data = request.get_json()
    if data.get("protocol") == "BB84":
        print("bb84")
    if data.get("protocol") == "E91":
        print("e91")

    losses_enable = data["losses"]
    perturbations_enable = data["perturbations"]
    eavesdropping_enable = data["eavesdropping"]
    sopUncertainty_enable = data["sopUncertainty"]

    source_generation_rate = float(data["sourceRate"]) * 1e6
    source_efficiency = float(data["sourceEfficiency"])
    fiber_length = float(data["fiberLength"])
    fiber_loss = float(data["fiberLoss"])
    detector_efficiency = float(data["detectorEfficiency"])
    perturbProb = float(data["perturbProb"])
    sopDeviation = float(data["sopDeviation"])
    cross_check_fraction = float(data["qberFraction"]) / 100

    params = {
        "losses": losses_enable,
        "perturbations": perturbations_enable,
        "eavesdropping": eavesdropping_enable,
        "sopUncertainty": sopUncertainty_enable,
        "sourceRate": float(data["sourceRate"]) * 72.6e6,
        "sourceEfficiency": source_efficiency,
        "fiberLength": fiber_length,
        "fiberLoss": fiber_loss,
        "detectorEfficiency": detector_efficiency,
        "perturbProb": perturbProb,
        "sopDeviation": sopDeviation,
        "qberFraction": cross_check_fraction
    }
    n_bits = int(data.get("qubits", 0))
    alice_bits, bob_bits, alice_bases, bob_bases, sifted_key, qber, matching_bases_count = \
        Simu.bb84(n_bits, losses_enable, perturbations_enable, sopUncertainty_enable,
                  eavesdropping_enable, params)

    bob_bits_len = len([b for b in bob_bits if b is not None])
    ce = Simu.combined_efficiency_cal(source_efficiency, fiber_length,
                                       detector_efficiency, fiber_loss)
    key_length = Simu.key_length_cal(50, ce, cross_check_fraction)
    key_rate = Simu.key_rate_cal(source_generation_rate, ce,
                                 cross_check_fraction)

    return jsonify({
        "keyLength": key_length,
        "keyRate": key_rate,
        "qber": qber * 100,
        "sValue": None,
        "combinedEfficiency": ce
    })

@app.route('/plot_simulation', methods=['POST'])
def plot_simulation():
    source_generation_rate = 72.6e6
    source_efficiency = 0.058
    fiber_length = 20
    fiber_loss = 0.2
    detector_efficiency = 0.6
    perturb_probability = 0.01
    sop_mean_deviation = 0.05
    cross_check_fraction = 0.1
    n_bits = 100000

    params = {
        "sourceRate": 72.6e6,
        "sourceEfficiency": 0.7,
        "fiberLength": 20,
        "fiberLoss": 0.2,
        "detectorEfficiency": 0.6,
        "perturbProb": 0.01,
        "sopDeviation": 0.05,
        "qberFraction": 0.1
    }

    data = request.json
    name_x = data['name_x']
    name_y = data['name_y']
    start = data['start_value_x']
    end = data['end_value_x']
    point = data['point']

    step = (end - start) / point
    xs, ces, kls, krs, sbrs, ers, qbers = [], [], [], [], [], [], []

    for i in range(point):
        x = start + step * i
        xs.append(x)
        # ... loop logic unchanged ...

    fig, ax = plt.subplots()
    ax.plot(xs, {
        "Combined Efficiency": ces,
        "Key Length": kls,
        "Key Rate": krs,
        "Sifted Bit Rate": sbrs,
        "Error Rate": ers,
        "QBER": qbers
    }[name_y], marker='o', linestyle='--')
    ax.set_xlabel(name_x)
    ax.set_ylabel(name_y + (" (%)" if name_y in ["Error Rate", "QBER"] else ""))
    ax.set_title('BB84 Simulation')
    ax.grid(True)

    buf = io.BytesIO()
    plt.savefig(buf, format='png')
    buf.seek(0)
    plt.close()
    return send_file(buf, mimetype='image/png')

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000, debug=True)

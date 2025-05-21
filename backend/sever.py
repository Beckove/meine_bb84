from flask import Flask, request, jsonify, send_file
import bb84
import bb84_fso as Simu
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



@app.route('/bb84_simu', methods=['POST'])
def bb84_simulation():
    data = request.get_json()
    # print('Received:', data)  # Debug log
    if(data["protocol"] == "BB84"):
        print("bb84")
    if(data["protocol"] == "E91"):
        print("e91")

    losses_enable = data["losses"]
    perturbations_enable = data["perturbations"]
    eavesdropping_enable = data["eavesdropping"]
    sopUncertainty_enable = False


    params = {
        "losses": data["losses"],
        "perturbations": data["perturbations"],
        "eavesdropping": data["eavesdropping"],
        "sopUncertainty": False,
        "sourceRate": None,  # MHz -> Hz
        "sourceEfficiency": None,
        "fiberLength": None,
        "fiberLoss": None,
        "L": float(data["FSO Length"]) * 1000    ,
        "detectorEfficiency": float(data["detectorEfficiency"])/100,
        "perturbProb": float(data["perturbProb"])/100,
        "sopDeviation": 0,
        "qberFraction": float(data["qberFraction"]) / 100
    }

    n_bits = int(data["qubits"])
    alice_bits, bob_bits, alice_bases, bob_bases, sifted_key, qber, matching_bases_count=Simu.bb84(n_bits, losses_enable, perturbations_enable, sopUncertainty_enable, eavesdropping_enable, params)

    # Đếm số bit của Bob (tính `None` như 0)
    bob_bits_len = len([b for b in bob_bits if b is not None])  # Số bit thực sự của Bob
    total_bob_bits = len(bob_bits)  # Tổng số bits của Bob (bao gồm cả None)
    # ce = bb84.combined_efficiency_cal(source_efficiency, fiber_length, detector_efficiency, fiber_loss)
    # key_length = bb84.key_length_cal(50, ce, cross_check_fraction)
    # key_rate = bb84.key_rate_cal(source_generation_rate, ce, cross_check_fraction)
    siftedkey = len(sifted_key)
    # siftedkey_rate = siftedkey * source_generation_rate
    print(siftedkey)
    print("--==============================================================--")
    return jsonify({
        "siftedkey": siftedkey,
        # "siftedkeyrate": key_rate,
        "qber": qber*100,
        "sValue": None,
        "combinedEfficiency": None
    })
@app.route('/plot_simulation', methods=['POST'])
def plot_simulation():

    params = {
        "sourceRate": 72.6e6,  # 1 MHz - tốc độ khá thấp để mô phỏng đơn giản
        "sourceEfficiency": 0.7,  # 70% - một nguồn tốt, nhưng không hoàn hảo
        "detectorEfficiency": 0.6,  # 60% - realistic for SNSPD or APD
        "perturbProb": 0.01,  # 1% - giả định có chút nhiễu
        "sopDeviation": 0.05,  # nhỏ - mô phỏng lệch phân cực nhẹ
        "qberFraction":0.2,  # 10% bit mở ra để tính QBER
        "muy": 0,
        "sigma": 0.5,
        "L": 1000,
    }

    data = request.json
    name_x = data['name_x']
    name_y = data['name_y']
    start = data['start_value_x']
    end = data['end_value_x']
    point = data['point']

    step = (end - start) / point
    Qber = []
    xs = []
    kr = []
    sk = []
    for i in range(point):
        if name_x == 'C2n':
            x = pow(10,-start) + ((pow(10,-end) - pow(10,-start))/point) * i
            xs.append(x)
            params["C2n"] = x
        else:
            x = start + step * i
            xs.append(x)
            if name_x == 'Detection Efficiency':
                detector_efficiency = x/100
                params["detectorEfficiency"] = x/100
            elif name_x == 'Length':
                fiber_length = x
                params["L"] = x
                params["qberFraction"] = 1
            elif name_x == 'Source Efficiency':
                source_efficiency = x/100
                params["sourceEfficiency"] = x/100
            elif name_x == 'Sop Mean Deviation':
                params["sopDeviation"] = x
            elif name_x == 'Perturb Probability':
                params["perturbProb"] = x/100

        print(f"step {i+1} ")
        n_bits = 100000
        alice_bits, bob_bits, alice_bases, bob_bases, sifted_key, qber, matching_bases_count = Simu.bb84(n_bits,
                                                                                                         True,
                                                                                                         True,
                                                                                                         False,
                                                                                                         False,
                                                                                                         params)
        key_rate = len(sifted_key) * (1-qber) * (1-0.8)
        kr.append(key_rate)
        Qber.append(qber * 100)
        sk.append(len(sifted_key))
    y = Qber
    if name_y == "Sifted Key":
        y = sk
        name_y = "Sifted Key (Bit)"
    elif name_y == "QBER":
        y = Qber
        name_y = "QBER (%)"
    if name_x == "Length": name_x = "Length (m)"
    elif name_x == 'Sop Mean Deviation':
        name_x = "Sop Mean Deviation (rad)"
    elif name_x == 'Perturb Probability':
        name_x = "Perturb Probability (%)"
    fig, ax = plt.subplots()
    ax.plot(xs, y, marker='o', linestyle='--', color='blue')
    ax.set_xlabel(name_x)
    ax.set_ylabel(name_y)
    ax.set_title('BB84 Simulation')
    ax.grid(True)
    ax.legend()

    buf = io.BytesIO()
    plt.savefig(buf, format='png')
    buf.seek(0)
    plt.close()
    return send_file(buf, mimetype='image/png')

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000, debug=True)

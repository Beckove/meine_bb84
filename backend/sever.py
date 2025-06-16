from flask import Flask, request, jsonify, send_file, Response
from flask_cors import CORS
import io
import numpy as np
import matplotlib.pyplot as plt
from qiskit import QuantumCircuit, transpile
from qiskit_aer import Aer
import bb84
import bb84_fso as Simu

app = Flask(__name__)
CORS(app)

from bb84 import setup_parameters

def build_full_circuit(alice_bits, alice_bases, bob_bases, perturbProbability, eve_bases=None):
    n = len(alice_bits)
    qc = QuantumCircuit(n, n)

    for i in range(n):
        if alice_bases[i] == 0:
            if alice_bits[i] == 1:
                qc.x(i)
        else:
            if alice_bits[i] == 0:
                qc.h(i)
            else:
                qc.x(i)
                qc.h(i)

    qc.barrier()

    if eve_bases is not None and any(eve_bases):
        for i in range(n):
            if eve_bases[i] == 1:
                qc.h(i)
        qc.barrier()

    for i in range(n):
        if np.random.rand() < perturbProbability:
            theta = np.random.uniform(0, np.pi)
            qc.ry(theta, i)

    for i in range(n):
        if bob_bases[i] == 1:
            qc.h(i)

    qc.barrier()

    for i in range(n):
        qc.measure(i, i)

    return qc


@app.route('/bb84', methods=['POST'])
def bb84_api():
    data = request.get_json()
    try:
        n_bits = int(data.get('bitCount', 100))
        isEveMode = data.get('isEveMode', False)

        params = {k: v for k, v in data.items() if k not in ('bitCount', 'isEveMode', 'isNoEveMode')}

        if isEveMode:
            alice_bits, bob_bits, alice_bases, bob_bases, eve_bits, eve_bases, sifted_key, qber, matching = \
                bb84.bb84_Eve(n_bits=n_bits, params=setup_parameters(params))
        else:
            alice_bits, bob_bits, alice_bases, bob_bases, _, _, sifted_key, qber, matching = \
                bb84.bb84_no_Eve(n_bits=n_bits, params=setup_parameters(params))
            eve_bits = [0] * n_bits
            eve_bases = [0] * n_bits

        return jsonify({
            'alice_bits': alice_bits,
            'bob_bits': bob_bits,
            'eve_bits': eve_bits,
            'alice_bases': alice_bases,
            'bob_bases': bob_bases,
            'eve_bases': eve_bases,
            'sifted_key': sifted_key,
            'matching_bases_count': matching,
            'quantum_bit_error_rate': qber
        })

    except Exception as e:
        app.logger.error(f"BB84 API error: {e}")
        return jsonify({'error': str(e)}), 400


@app.route('/bb84_circuit', methods=['POST'])
def bb84_circuit():
    data = request.get_json()
    try:
        mein_num = 20
        alice_bits = data['alice_bits'][:mein_num]
        alice_bases = data['alice_bases'][:mein_num]
        bob_bases = data['bob_bases'][:mein_num]
        perturbProbability = float(data.get('perturbProbability', 0))

        eve_bases = data.get('eve_bases', None)
        if eve_bases is not None:
            eve_bases = eve_bases[:mein_num]

        qc = build_full_circuit(
            alice_bits,
            alice_bases,
            bob_bases,
            perturbProbability,
            eve_bases=eve_bases
        )

        qc_clean = QuantumCircuit(qc.num_qubits, qc.num_clbits)
        for instr, qargs, cargs in qc.data:
            qc_clean.append(instr, qargs, cargs)

        fig = qc_clean.draw(
            output='mpl',
            cregbundle=True,
            initial_state=False,
            idle_wires=False,
            fold=100,
            vertical_compression='medium'
        )

        buf = io.BytesIO()
        fig.savefig(buf, format='svg', bbox_inches='tight')
        buf.seek(0)
        return Response(buf.getvalue(), mimetype='image/svg+xml')

    except KeyError as e:
        return jsonify({'error': f"Missing field in JSON: {e}"}), 400
    except Exception as e:
        app.logger.error(f"BB84 circuit error: {e}")
        return jsonify({'error': str(e)}), 400


@app.route('/bb84_simu', methods=['POST'])
def bb84_simu():
    data = request.get_json()
    try:
        losses       = bool(data.get('losses', False))
        perturb      = bool(data.get('perturbations', False))
        eaves        = bool(data.get('eavesdropping', False))
        sop_uncert   = bool(data.get('sopUncertainty', False))
        sr  = float(data.get('sourceRate', 72.6e6))
        se  = float(data.get('sourceEfficiency', 0.9))
        fl  = float(data.get('fiberLength', 100))
        loss= float(data.get('fiberLoss', 0.2))
        de  = float(data.get('detectorEfficiency', 0.6))
        pp  = float(data.get('perturbProb', 0.01))
        sd  = float(data.get('sopDeviation', 0.05))
        frac= float(data.get('qberFraction', 0.1))
        n   = int(data.get('qubits', 1000))

        params = {
            'losses': losses,
            'perturbations': perturb,
            'eavesdropping': eaves,
            'sopUncertainty': sop_uncert,
            'sourceRate': sr,
            'sourceEfficiency': se,
            'fiberLength': fl,
            'fiberLoss': loss,
            'detectorEfficiency': de,
            'perturbProb': pp,
            'sopDeviation': sd,
            'qberFraction': frac
        }

        alice_bits, bob_bits, *_res = Simu.bb84(n, losses, perturb, sop_uncert, eaves, params)
        ce       = Simu.combined_efficiency_cal(se, fl, de, loss)
        key_len  = Simu.key_length_cal(50, ce, frac)
        key_rate = Simu.key_rate_cal(sr, ce, frac)
        qber_val = _res[1] * 100

        return jsonify({
            'keyLength': key_len,
            'keyRate': key_rate,
            'qber': qber_val,
            'combinedEfficiency': ce
        })

    except Exception as e:
        app.logger.error(f"BB84 simu error: {e}")
        return jsonify({'error': str(e)}), 400


@app.route('/plot_simulation', methods=['POST'])
def plot_simulation():
    try:
        data = request.get_json()
        name_x = data['name_x']
        name_y = data['name_y']
        start = data['start_value_x']
        end = data['end_value_x']
        point = data['point']

        step = (end - start) / point
        Qber, xs, kr, sk = [], [], [], []
        params = {
            "sourceRate": 72.6e6,
            "sourceEfficiency": 0.7,
            "detectorEfficiency": 0.6,
            "perturbProb": 0.01,
            "sopDeviation": 0.05,
            "qberFraction": 0.2,
            "muy": 0,
            "sigma": 0.5,
            "L": 1000
        }

        for i in range(point + 1):
            if name_x == 'C2n':
                x = pow(10, -start) + ((pow(10, -end) - pow(10, -start)) / point) * i
            else:
                x = end if i == point else start + step * i

            xs.append(x)

            if name_x == 'Detection Efficiency':
                params["detectorEfficiency"] = x / 100
            elif name_x == 'Length':
                params["L"] = x * 1000
                params["qberFraction"] = 1
            elif name_x == 'Source Efficiency':
                params["sourceEfficiency"] = x / 100
            elif name_x == 'Sop Mean Deviation':
                params["sopDeviation"] = x
            elif name_x == 'Perturb Probability':
                params["perturbProb"] = x / 100

            n_bits = 100000
            alice_bits, bob_bits, alice_bases, bob_bases, sifted_key, qber, matching_bases_count = Simu.bb84(
                n_bits, True, True, False, False, params)
            key_rate = len(sifted_key) * (1 - qber) * (1 - 0.8)
            kr.append(key_rate)
            Qber.append(qber * 100)
            sk.append(len(sifted_key) / 1000)

        y = Qber
        if name_y == "Sifted Key":
            y = sk
            name_y = "Sifted Key (KBit)"
        elif name_y == "QBER":
            y = Qber
            name_y = "QBER (%)"

        if name_x == "Length":
            name_x = "FSO Length (km)"
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
        ax.set_xlim(start, end)

        buf = io.BytesIO()
        plt.savefig(buf, format='png')
        buf.seek(0)
        plt.close(fig)
        return send_file(buf, mimetype='image/png')

    except Exception as e:
        app.logger.error(f"Plot simulation error: {e}")
        return jsonify({'error': str(e)}), 400


if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000, debug=True)

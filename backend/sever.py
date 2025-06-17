from flask import Flask, request, jsonify, send_file, Response
from flask_cors import CORS
import io
import numpy as np
import matplotlib.pyplot as plt
from qiskit import QuantumCircuit, transpile
from qiskit_aer import Aer
import bb84
import bb84_fso as Simu
from formular import *

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

    # Lấy và xử lý dữ liệu đầu vào an toàn
    params = {
        'R':       float(data['R'])      if data.get('R')      not in [None, ''] else 1e9,
        's':       float(data['s'])      if data.get('s')      not in [None, ''] else 0.5,
        'p':       float(data['p'])      if data.get('p')      not in [None, ''] else 0.75,
        'f':       float(data['f'])      if data.get('f')      not in [None, ''] else 1.0,
        'd':       float(data['d'])      if data.get('d')      not in [None, ''] else 0.5,
        'p_dark':  float(data['p_dark']) if data.get('p_dark') not in [None, ''] else 1e-4,
        'P_AP':    float(data['P_AP'])   if data.get('P_AP')   not in [None, ''] else 0.02,
        'e_0':     float(data['e_0'])    if data.get('e_0')    not in [None, ''] else 0.5,
        'e_pol':   float(data['e_pol'])  if data.get('e_pol')  not in [None, ''] else 0.01,
        'n_s':     float(data['n_s'])    if data.get('n_s')    not in [None, ''] else 0.3,
        'n_d':     float(data['n_d'])    if data.get('n_d')    not in [None, ''] else 0.09,
        'zenith':  float(data['zenith']) if data.get('zenith') not in [None, ''] else 0.0,
        'tau': float(data['tau_zen']) if data.get('tau_zen') not in [None, ''] else 0.0,

    }

    # Tính QBER và SKR
    qber_val = simulation_QBer(
         params
    )

    skr_val = simulation_SKR(
      params
    )
    print(f"skr{skr_val}")
    print(f"qber{qber_val}")
    # Trả về kết quả
    return jsonify({
        'qber': qber_val * 100,
        'siftedkey': skr_val
    })


@app.route('/plot_simulation', methods=['POST'])
def plot_simulation():
    try:
        data = request.get_json()
        name_x = data['name_x']              # e.g. "Zenith"
        name_y = data['name_y']              # e.g. "QBER" or "Sifted Key"
        start = float(data['start_value_x']) # start value of x param (zenith)
        end = float(data['end_value_x'])     # end value of x param
        point = int(data['point'])           # number of sampling points

        # Step size for x-axis
        step = (end - start) / point

        xs = []
        qber_values = []
        sifted_key_values = []

        for i in range(point + 1):
            x_val = end if i == point else start + step * i
            xs.append(x_val)

            params = {
                'R':       1e9,
                's':       0.5,
                'p':       0.75,
                'f':       1.0,
                'd':       0.5,
                'p_dark':  1e-4,
                'P_AP':    0.02,
                'e_0':     0.5,
                'e_pol':   0.01,
                'n_s':     0.3,
                'n_d':     0.09,
                'zenith':  x_val,
                'tau':     0.81
            }

            # Tính QBER và SKR tại giá trị hiện tại của tham số x
            qber_val = simulation_QBer(
                params
            )

            skr_val = simulation_SKR(
 params
            )

            qber_values.append(qber_val * 100)       # % QBER
            sifted_key_values.append(skr_val / 1000) # Kbps

        # Chọn dữ liệu y phù hợp để hiển thị
        if name_y == "QBER":
            y = qber_values
            y_label = "QBER (%)"
        else:
            y = sifted_key_values
            y_label = "Sifted Key (Kbps)"

        x_label = "Zenith (degree)" if name_x == "Zenith" else name_x

        # Vẽ biểu đồ
        fig, ax = plt.subplots()
        ax.plot(xs, y, marker='o', linestyle='--', color='blue')
        ax.set_xlabel(x_label)
        ax.set_ylabel(y_label)
        ax.set_title("BB84 Simulation")
        ax.grid(True)
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

from flask import Flask, request, jsonify
import bb84
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/bb84', methods=['POST'])
def run_bb84():
    try:
        payload = request.json
        print("Received payload from frontend:", payload)

        n_bits = payload.get('bitCount', 100)
        setup_params = {k: v for k, v in payload.items() if k not in ('bitCount','isAutoPlay','isManualInput')}
        print("Parameters for setup:", setup_params)

        # Simulate
        alice_bits, bob_bits, alice_bases, bob_bases, sifted_key, qber, matching_bases_count = \
            bb84.bb84_no_Eve(n_bits=n_bits, params=bb84.setup_parameters(setup_params))

        response_data = {
            "alice_bits": alice_bits,
            "bob_bits": bob_bits,
            "alice_bases": alice_bases,
            "bob_bases": bob_bases,
            "sifted_key": sifted_key,
            "quantum_bit_error_rate": qber * 100,
            "matching_bases_count": matching_bases_count
        }

        print("Sending response:", response_data)

        # Trả về JSON
        return jsonify(response_data)
    except Exception as e:
        print("Error:", e)
        return jsonify({"error": str(e)}), 400


if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000, debug=True)

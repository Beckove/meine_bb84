from flask import Flask, request, jsonify
import bb84
from flask_cors import CORS

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

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000, debug=True)

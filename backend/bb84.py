import numpy as np
from qiskit import QuantumCircuit, transpile
from qiskit_aer import Aer

# Giữ nguyên tên tham số frontend (camelCase)
def setup_parameters(params):
    defaults = {
        'perturbProbability': 0.1,
        'sopMeanDeviation': 0.1,
        'sourceEfficiency': 0.9,
        'fiberLength': 100,
        'fiberLoss': 0.2,
        'detectorEfficiency': 0.8,
        'sourceRate': 72.6
    }
    # Gộp params do frontend với defaults
    merged = {**defaults, **params}
    return merged

def photon_survives(fiberLength, fiberLoss, sourceEfficiency, detectorEfficiency):
    total_loss_dB = fiberLength * fiberLoss
    prob_transmission = sourceEfficiency * 10 ** (-total_loss_dB / 10) * detectorEfficiency
    return np.random.rand() < prob_transmission

def apply_perturbation(qc, q, perturbProbability):
    if np.random.rand() < perturbProbability:
        theta = np.random.uniform(0, np.pi)
        qc.ry(theta, q)

def apply_sop_deviation(qc, q, sopMeanDeviation):
    theta = np.random.normal(0, sopMeanDeviation)
    qc.ry(theta, q)

def prepare_qubit(bit, basis):
    qc = QuantumCircuit(1, 1)
    if basis == 0:
        if bit == 1:
            qc.x(0)
    else:
        if bit == 1:
            qc.x(0)
        qc.h(0)
    return qc

def transmit(qc, params):
    # params giữ nguyên tên do frontend gửi
    if not photon_survives(params['fiberLength'], params['fiberLoss'], params['sourceEfficiency'], params['detectorEfficiency']):
        return None
    apply_perturbation(qc, 0, params['perturbProbability'])
    apply_sop_deviation(qc, 0, params['sopMeanDeviation'])
    return qc

def measure_qubit(qc, basis):
    if basis == 1:
        qc.h(0)
    qc.measure(0, 0)
    simulator = Aer.get_backend('aer_simulator')
    compiled = transpile(qc, simulator)
    job = simulator.run(compiled, shots=1, memory=True)
    res = job.result().get_memory()[0]
    return int(res)

def calculate_qber(alice_bits, bob_bits, alice_bases, bob_bases):
    matching = [(a, b) for a, b, ab, bb in zip(alice_bits, bob_bits, alice_bases, bob_bases) if ab == bb and b is not None]
    if not matching:
        return 0
    errors = sum(1 for a, b in matching if a != b)
    return errors / len(matching)

def bb84_no_Eve(n_bits=1000, params=None):
    raw_params = setup_parameters(params or {})

    alice_bits = np.random.randint(0, 2, n_bits)
    alice_bases = np.random.randint(0, 2, n_bits)
    bob_bases = np.random.randint(0, 2, n_bits)

    raw_key = []
    bob_bits = []
    matching_count = 0
    eve_bits = [None] * n_bits
    eve_bases = [None] * n_bits

    for bit, a_basis, b_basis in zip(alice_bits, alice_bases, bob_bases):
        qc = prepare_qubit(bit, a_basis)
        qc_channel = transmit(qc, raw_params)
        if qc_channel is None:
            bob_bits.append(None)
            raw_key.append((a_basis, b_basis, bit, None))
            continue
        result = measure_qubit(qc_channel, b_basis)
        bob_bits.append(result)
        raw_key.append((a_basis, b_basis, bit, result))
        if a_basis == b_basis:
            matching_count += 1

    sifted_key = [str(bit) for a, b, bit, res in raw_key if res is not None and a == b and bit == res]
    qber = calculate_qber(alice_bits, bob_bits, alice_bases, bob_bases)

    return (
        alice_bits.tolist(), bob_bits, alice_bases.tolist(), bob_bases.tolist(),
        eve_bits, eve_bases, sifted_key, qber, matching_count
    )

def bb84_Eve(n_bits=1000, params=None):
    raw_params = setup_parameters(params or {})

    alice_bits = np.random.randint(0, 2, n_bits)
    alice_bases = np.random.randint(0, 2, n_bits)
    eve_bases = np.random.randint(0, 2, n_bits)
    bob_bases = np.random.randint(0, 2, n_bits)

    raw_key = []
    bob_bits = []
    eve_bits = []
    matching_count = 0

    for bit, a_basis, e_basis, b_basis in zip(alice_bits, alice_bases, eve_bases, bob_bases):
        # Alice -> Eve
        qc_A = prepare_qubit(bit, a_basis)
        qc_A_e = transmit(qc_A, raw_params)
        if qc_A_e is None:
            bob_bits.append(None)
            eve_bits.append(None)
            raw_key.append((a_basis, b_basis, bit, None))
            continue
        e_res = measure_qubit(qc_A_e, e_basis)
        eve_bits.append(e_res)

        # Eve -> Bob
        qc_E = prepare_qubit(e_res, e_basis)
        qc_E_b = transmit(qc_E, raw_params)
        if qc_E_b is None:
            bob_bits.append(None)
            raw_key.append((a_basis, b_basis, bit, None))
            continue
        b_res = measure_qubit(qc_E_b, b_basis)
        bob_bits.append(b_res)
        raw_key.append((a_basis, b_basis, bit, b_res))
        if a_basis == b_basis:
            matching_count += 1

    sifted_key = [str(bit) for a, b, bit, res in raw_key if res is not None and a == b and bit == res]
    qber = calculate_qber(alice_bits, bob_bits, alice_bases, bob_bases)

    return (
        alice_bits.tolist(), bob_bits, alice_bases.tolist(), bob_bases.tolist(),
        eve_bits, eve_bases.tolist(), sifted_key, qber, matching_count
    )

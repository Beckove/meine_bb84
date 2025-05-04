import sys
import numpy as np
from qiskit import QuantumCircuit, transpile
from qiskit_aer import Aer


def setup_parameters(params):
    return {
        'perturb_probability': params.get('perturbProbability', 0.1),
        'sigma_sop': params.get('sopDeviation', 0.1),
        'source_efficiency': params.get('sourceEfficiency', 0.9),
        'fiber_length': params.get('fiberLength', 5),
        'fiber_loss': params.get('fiberLoss', 0),
        'detector_efficiency': params.get('detectorEfficiency', 1),
        'source_rate': params.get('sourceRate', 72.6)
    }


def photon_survives(fiber_length, fiber_loss, source_efficiency, detector_efficiency):
    total_loss_dB = fiber_length * fiber_loss
    prob_transmission = source_efficiency * 10 ** (-total_loss_dB / 10) * detector_efficiency
    return np.random.rand() < prob_transmission


def apply_perturbation(qc, q, perturb_probability):
    if np.random.rand() < perturb_probability:
        theta = np.random.uniform(0, np.pi)
        qc.ry(theta, q)


def apply_sop_deviation(qc, q, sigma_sop):
    theta = np.random.normal(0, sigma_sop)
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


def transmit(qc, fiber_length, fiber_loss, source_efficiency, detector_efficiency, perturb_probability, sigma_sop):
    if not photon_survives(fiber_length, fiber_loss, source_efficiency, detector_efficiency):
        return None
    apply_perturbation(qc, 0, perturb_probability)
    apply_sop_deviation(qc, 0, sigma_sop)
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
    matching_bits = []
    for a_bit, b_bit, a_base, b_base in zip(alice_bits, bob_bits, alice_bases, bob_bases):
        if a_base == b_base and b_bit is not None:
            matching_bits.append((a_bit, b_bit))

    if not matching_bits:
        return 0
    num_errors = sum(1 for a_bit, b_bit in matching_bits if a_bit != b_bit)
    return num_errors / len(matching_bits)


def bb84_no_Eve(n_bits=1000, params=None):
    if params is None:
        params = setup_parameters({})

    alice_bits = np.random.randint(0, 2, n_bits)
    alice_bases = np.random.randint(0, 2, n_bits)
    bob_bases = np.random.randint(0, 2, n_bits)

    raw_key = []
    bob_bits = []
    matching_bases_count = 0

    for bit, a_basis, b_basis in zip(alice_bits, alice_bases, bob_bases):
        qc = prepare_qubit(bit, a_basis)
        qc_channel = transmit(
            qc,
            params['fiber_length'], params['fiber_loss'],
            params['source_efficiency'], params['detector_efficiency'],
            params['perturb_probability'], params['sigma_sop']
        )
        if qc_channel is None:
            raw_key.append((a_basis, b_basis, bit, None))
            bob_bits.append(None)
            continue
        result = measure_qubit(qc_channel, b_basis)
        raw_key.append((a_basis, b_basis, bit, result))
        bob_bits.append(result)
        if a_basis == b_basis:
            matching_bases_count += 1

    sifted_key = [str(bit) for a, b, bit, res in raw_key if res is not None and a == b and bit == res]
    qber = calculate_qber(alice_bits.tolist(), bob_bits, alice_bases.tolist(), bob_bases.tolist())

    return alice_bits.tolist(), bob_bits, alice_bases.tolist(), bob_bases.tolist(), sifted_key, qber, matching_bases_count


def bb84_Eve(n_bits=1000, params=None):
    if params is None:
        params = setup_parameters({})

    alice_bits = np.random.randint(0, 2, n_bits)
    alice_bases = np.random.randint(0, 2, n_bits)
    eve_bases = np.random.randint(0, 2, n_bits)
    bob_bases = np.random.randint(0, 2, n_bits)

    raw_key = []
    bob_bits = []
    eve_bits = []
    matching_bases_count = 0

    for bit, a_basis, eve_basis, b_basis in zip(alice_bits, alice_bases, eve_bases, bob_bases):
        qc = prepare_qubit(bit, a_basis)
        qc_channel = transmit(
            qc,
            params['fiber_length'], params['fiber_loss'],
            params['source_efficiency'], params['detector_efficiency'],
            params['perturb_probability'], params['sigma_sop']
        )
        if qc_channel is None:
            raw_key.append((a_basis, b_basis, bit, None))
            bob_bits.append(None)
            eve_bits.append(None)
            continue

        pre_result = measure_qubit(qc_channel, eve_basis)
        eve_bits.append(pre_result)
        qc_channel = prepare_qubit(pre_result, eve_basis)

        result = measure_qubit(qc_channel, b_basis)
        raw_key.append((a_basis, b_basis, bit, result))
        bob_bits.append(result)
        if a_basis == b_basis:
            matching_bases_count += 1

    sifted_key = [str(bit) for a, b, bit, res in raw_key if res is not None and a == b and bit == res]
    qber = calculate_qber(alice_bits.tolist(), bob_bits, alice_bases.tolist(), bob_bases.tolist())

    return alice_bits.tolist(), bob_bits, alice_bases.tolist(), bob_bases.tolist(), sifted_key, qber, matching_bases_count


if __name__ == '__main__':
    n_bits = int(sys.argv[1]) if len(sys.argv) > 1 else 40
    results = bb84_no_Eve(n_bits=n_bits)
    alice_bits, bob_bits, alice_bases, bob_bases, sifted_key, qber, matching_bases_count = results

    print(f'— Kết quả với n_bits={n_bits} —')
    print('Alice bits:      ', alice_bits)
    print('Bob bits:        ', bob_bits)
    print('Alice bases:     ', alice_bases)
    print('Bob bases:       ', bob_bases)
    print('Sifted key:      ', sifted_key)
    print(f'QBER:            {qber*100:.2f}%')
    print('Matching bases:  ', matching_bases_count)

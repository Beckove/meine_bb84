import numpy as np
import time
from qiskit import QuantumCircuit
from qiskit.quantum_info import Statevector
from qiskit.quantum_info import Operator
import pandas as pd
import matplotlib.pyplot as plt
def photon_survives(loss, fiber_length, fiber_loss, detector_efficiency, source_efficiency):
    if loss:
        total_loss_dB = fiber_length * fiber_loss
        prob_transmission = source_efficiency * 10**(-total_loss_dB/10) * detector_efficiency
        return np.random.rand() < prob_transmission
    else:
        return True

def apply_perturbation(qc, q, perturbation, perturb_probability):
    if perturbation:
        if np.random.rand() < perturb_probability:
            theta = np.random.uniform(0, np.pi)
            qc.ry(theta, q)

def apply_sop_deviation(qc, q, sop_deviation, sigma_sop):
    if sop_deviation:
        theta = np.random.normal(0, sigma_sop)
        qc.ry(theta, q)

def eavesdrop(qc, eavesdrop_enable):
    if eavesdrop_enable:
        eavesdrop_basis = np.random.randint(0, 2)
        if eavesdrop_basis == 1:
            qc.h(0)
        qc.measure(0, 0)
        # Mô phỏng đo Eve
        sv = Statevector.from_instruction(qc.remove_final_measurements(inplace=False))
        probs = sv.probabilities_dict()
        measurement_result = int(np.random.rand() > probs.get('0', 0))
        if eavesdrop_basis == 1:
            if measurement_result == 1:
                qc.x(0)
            qc.h(0)
    return qc

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

def transmit(qc, loss_enable, perturbation_enable, sop_deviation_enable, eavesdrop_enable, param):
    if not photon_survives(loss_enable, float(param["fiberLength"]), float(param["fiberLoss"]), float(param["detectorEfficiency"]), float(param["sourceEfficiency"])):
        return None
    apply_perturbation(qc, 0, perturbation_enable, param["perturbProb"])
    apply_sop_deviation(qc, 0, sop_deviation_enable, param["sopDeviation"])
    qc = eavesdrop(qc, eavesdrop_enable)
    return qc

def remove_measurements(qc):
    qc2 = QuantumCircuit(qc.num_qubits, qc.num_clbits)
    for instr, qargs, cargs in qc.data:
        if instr.name != 'measure':
            qc2.append(instr, qargs, cargs)
    return qc2

def measure_qubit_fast(qc, basis):
    qc_no_meas = remove_measurements(qc)
    sv = Statevector.from_instruction(qc_no_meas)
    if basis == 1:
        H = Operator.from_label('H')
        sv = sv.evolve(H)
    probs = sv.probabilities_dict()
    rand = np.random.rand()
    if rand < probs.get('0', 0):
        return 0
    else:
        return 1


import random

def calculate_qber_sample(alice_bits, bob_bits, alice_bases, bob_bases, sample_fraction=0.1):
    # Tìm các chỉ số có basis giống và bob đo được
    matching_indices = [i for i, (a_base, b_base, b_bit) in enumerate(zip(alice_bases, bob_bases, bob_bits)) if a_base == b_base and b_bit is not None]

    if len(matching_indices) == 0:
        return 0

    sample_size = max(1, int(len(matching_indices) * sample_fraction))  # ít nhất 1 bit
    sample_indices = random.sample(matching_indices, sample_size)

    num_errors = sum(1 for i in sample_indices if alice_bits[i] != bob_bits[i])
    return num_errors / sample_size

def bb84(n_bits, loss_enable, perturbation_enable, sop_deviation_enable, eavesdrop_enable, param):
    start = time.time()
    alice_bits = np.random.randint(0, 2, n_bits)
    alice_bases = np.random.randint(0, 2, n_bits)
    bob_bases   = np.random.randint(0, 2, n_bits)
    end = time.time()
    print(f"Khởi tạo bit và basis mất: {end - start:.3f}s")

    raw_key = []
    bob_bits = []
    matching_bases_count = 0

    start = time.time()
    for i, (bit, a_basis, b_basis) in enumerate(zip(alice_bits, alice_bases, bob_bases)):
        qc = prepare_qubit(bit, a_basis)
        qc_channel = transmit(qc, loss_enable, perturbation_enable, sop_deviation_enable, eavesdrop_enable, param)
        if qc_channel is None:
            raw_key.append((a_basis, b_basis, bit, None))
            bob_bits.append(None)
            continue
        result = measure_qubit_fast(qc_channel, b_basis)
        raw_key.append((a_basis, b_basis, bit, result))
        bob_bits.append(result)
        if a_basis == b_basis:
            matching_bases_count += 1
    end = time.time()
    print(f"Thời gian mô phỏng đo {n_bits} qubit: {end - start:.3f}s")

    sifted_key = [str(bit) for (a, b, bit, res) in raw_key if res is not None and a == b and bit == res]
    df = pd.DataFrame({
        'Alice bit': alice_bits,
        'Alice basis': alice_bases,
        'Bob basis': bob_bases,
        'Bob bit': bob_bits
    })
    print(df)
    qber = calculate_qber_sample(alice_bits, np.array(bob_bits), alice_bases, bob_bases, sample_fraction=1)
    print(f"QBER: {qber}")

    return alice_bits, np.array(bob_bits), alice_bases, bob_bases, sifted_key, qber, matching_bases_count

def combined_efficiency_cal(source_efficiency, fiber_length,detector_efficiency, fiber_loss):
    total_loss_dB = fiber_length * fiber_loss
    CE = source_efficiency * 10**(-total_loss_dB/10) * detector_efficiency
    return CE

def key_length_cal(n_bits, combined_efficiency, cross_check_f):
    Nk = n_bits * combined_efficiency * (1-cross_check_f) * 0.5
    return Nk

def key_rate_cal(source_generation_rate, combined_efficiency, cross_check_f ):
    Vk = source_generation_rate * combined_efficiency * (1-cross_check_f) * 0.5
    return Vk
def sifted_bit_rate(source_generation_rate, combined_efficiency):
    Sr = source_generation_rate * combined_efficiency
    return Sr
def error_rate(source_generation_rate, combined_efficiency, cross_check_f, qber ):
    er = source_generation_rate * combined_efficiency*0.5 * cross_check_f * qber
    return er
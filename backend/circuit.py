from qiskit import QuantumCircuit
from qiskit_aer import Aer
import matplotlib.pyplot as plt

# Dữ liệu đầu vào
alice_bits = "0101"
alice_basis = "0101"
bob_basis = "0110"

def encode_qubits(n, bits, basis):
    qc = QuantumCircuit(n, n)
    for i in range(n):
        if basis[i] == '0':
            if bits[i] == '1':
                qc.x(i)
        else:
            if bits[i] == '0':
                qc.h(i)
            else:
                qc.x(i)
                qc.h(i)
    return qc

def bob_measurement(qc, basis):
    for i in range(len(basis)):
        if basis[i] == '1':
            qc.h(i)
    qc.measure(range(len(basis)), range(len(basis)))
    return qc

# Tạo mạch
num_qubits = len(alice_bits)
qc = encode_qubits(num_qubits, alice_bits, alice_basis)
qc.barrier()
qc = bob_measurement(qc, bob_basis)

# Chạy mô phỏng với Qiskit >= 1.0
backend = Aer.get_backend('qasm_simulator')
job = backend.run(qc, shots=1)
result = job.result()
counts = result.get_counts()

# In kết quả
print("Kết quả đo của Bob:", counts)

# Vẽ mạch
qc.draw(output='mpl')
plt.show()

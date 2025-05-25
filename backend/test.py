from flask import Flask, request, jsonify, send_file
import bb84
import bb84_fso as Simu
from flask_cors import CORS
import io
import numpy as np
import matplotlib.pyplot as plt


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


name_x = "Length"
name_y = "Sifted Key"
start = 1
end = 3
point = 10

step = (end - start) / point
Qber = []
xs = []
kr = []
sk = []
for i in range(point+1):

    if name_x == 'C2n':
        x = pow(10,-start) + ((pow(10,-end) - pow(10,-start))/point) * i
        xs.append(x)
        params["C2n"] = x
    else:
        if(i == point):
            x=3
            xs.append(x)
        else:
            x = start + step * i
            xs.append(x)
        if name_x == 'Detection Efficiency':
            detector_efficiency = x/100
            params["detectorEfficiency"] = x/100
        elif name_x == 'Length':
            # fiber_length = x
            params["L"] = x*1000
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
    sk.append(len(sifted_key)/1000)
y = Qber
if name_y == "Sifted Key":
    y = sk
    name_y = "Sifted Key (KBit)"
elif name_y == "QBER":
    y = Qber
    name_y = "QBER (%)"
if name_x == "Length": name_x = "FSO Length (km)"
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

# Đặt xticks là 0, 0.5, 1, ..., 3
ax.set_xticks([i * 0.5 for i in range(7)])  # 0*0.5=0, 1*0.5=0.5, ..., 6*0.5=3

# Giới hạn trục x từ 1 đến 3
ax.set_xlim(1, 3)

buf = io.BytesIO()
plt.savefig(buf, format='png')
buf.seek(0)
plt.show()
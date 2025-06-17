import numpy as np
from scipy.integrate import quad
from scipy.special import erf, erfc
import matplotlib.pyplot as plt


class AtmosphericChannel:
    def __init__(self, lamda_nm=850, a=0.75, tau_zen=0.8, theta=10e-6,
                 H_ogs=10, H_atm=20e3, v=21, A=10e-13,
                 muy_x=None, muy_y=None, sigma_x=None, sigma_y=None, H_source=500e3):
        self.lamda_nm = lamda_nm
        self.lamda_m = lamda_nm * 1e-9
        self.a = a
        self.tau_zen = tau_zen
        self.theta = theta
        self.H_ogs = H_ogs
        self.H_atm = H_atm
        self.v = v
        self.A = A
        self.H_source = H_source

    def sec(self, zenith):
        return 1 / np.cos(np.radians(zenith))
    
    def print_parameters(self):
        print("=== Channel Parameters ===")
        print(f"Lambda (nm): {self.lamda_nm}")
        print(f"Lambda (m): {self.lamda_m}")
        print(f"a: {self.a}")
        print(f"tau_zen: {self.tau_zen}")
        print(f"theta: {self.theta}")
        print(f"H_ogs: {self.H_ogs}")
        print(f"H_atm: {self.H_atm}")
        print(f"v: {self.v}")
        print(f"A: {self.A}")
        print(f"H_source: {self.H_source}")
        print(f"muy_x: {self.muy_x}")
        print(f"muy_y: {self.muy_y}")
        print(f"sigma_x: {self.sigma_x}")
        print(f"sigma_y: {self.sigma_y}")

    def compute_L_km(self, zenith):
        zenith_rad = np.radians(zenith)
        L_m = (self.H_source-self.H_ogs) / np.cos(zenith_rad)
        return L_m / 1000  # đơn vị km

    def Cn2_HV(self, h):
        p1 = 0.2 * 0.00594 * (self.v / 27)**2 * (h / 1e5)**10 * np.exp(-h / 1000)
        p2 = 2.7e-16 * np.exp(-h / 1500)
        p3 = self.A * np.exp(-h / 100)
        return p1 + p2 + p3

    def sigma_r2(self, zenith):
        def integrand(h):
            return self.Cn2_HV(h) * ((h - self.H_ogs)**(5/6))
        I, _ = quad(integrand, self.H_ogs, self.H_atm)
        part1 = 2.25 * (2 * np.pi / self.lamda_m)**(7/6)
        sec_zen = self.sec(zenith)
        part2 = sec_zen**(11/6)
        return part1 * part2 * I

    def beam_sizes(self, zenith):
        L_km = self.compute_L_km(zenith)
        L_m = L_km * 1e3
        w0 = self.lamda_m / (np.pi * self.theta)
        k = 2 * np.pi / self.lamda_m
        sec_zen = self.sec(zenith)
        w = w0 * np.sqrt(1 + ((2 * L_m) / (k * w0**2))**2)

        T1 = 4.35 * ((2 * L_m) / (k * w**2))**(5/6) * k**(7/6) * ((self.H_atm - self.H_ogs)**(5/6)) * (sec_zen**(11/6))

        def integrand_eq11(h):
            return self.Cn2_HV(h) * ((h - self.H_ogs) / (self.H_atm - self.H_ogs))**(5/3)

        T2, _ = quad(integrand_eq11, self.H_ogs, self.H_atm)
        T = T1 * T2
        wL = w * np.sqrt(1 + T)
        return w0, w, wL

    def prepare_parameters(self, zenith):

        new_H_source = self.compute_L_km(zenith)
        self.muy_x =  0
        self.muy_y =  0
        self.sigma_x =  (self.theta / 5) * new_H_source * 1000
        self.sigma_y =  (self.theta / 5) * new_H_source * 1000

        k = 2 * np.pi / self.lamda_m
        sigma_r_22 = self.sigma_r2(zenith)
        w0, w, wL = self.beam_sizes(zenith)
        nu = (np.sqrt(np.pi) * self.a) / (np.sqrt(2) * wL)
        w_leg_num = np.sqrt(np.pi) * erf(nu)
        w_leg_den = 2 * nu * np.exp(-nu**2)
        w_leg_2 = (wL**2) * (w_leg_num / w_leg_den)
        w_leg = np.sqrt(w_leg_2)

        sigma_mod = ((3 * self.muy_x**2 * self.sigma_x**4 + 3 * self.muy_y**2 * self.sigma_y**4 +
                      self.sigma_x**6 + self.sigma_y**6) / 2)**(1/3)
        phi_mod = w_leg / (2 * sigma_mod)

        phi_x = w_leg / (2 * self.sigma_x)
        phi_y = w_leg / (2 * self.sigma_y)
        A_0 = erf(nu)**2

        arg_pos = (
            (1 / phi_mod**2) - 1 / (2 * phi_x**2) - 1 / (2 * phi_y**2)
            - self.muy_x**2 / (2 * self.sigma_x**2 * phi_x**2)
            - self.muy_y**2 / (2 * self.sigma_y**2 * phi_y**2)
        )

        G = np.exp(arg_pos)
        A_mod = A_0 * G

        mu = (sigma_r_22 / 2) * (1 + 2 * phi_mod**2)
        sigma_R = np.sqrt(sigma_r_22)
        eta_l = self.tau_zen**(self.sec(zenith))

        return phi_mod, A_mod, eta_l, mu, sigma_R

    def f_eta(self, eta, phi_mod, A_mod, eta_l, mu, sigma_R):

        power = phi_mod ** 2

        coef = phi_mod ** 2 / (2 * (A_mod * eta_l) ** power)

        term1 = coef * eta ** (power - 1)

        argument_erfc = (np.log(eta / (A_mod * eta_l)) + mu) / (np.sqrt(2) * sigma_R)

        erfc_part = erfc(argument_erfc)

        exp_part = np.exp((sigma_R ** 2 / 2) * power * (1 + power))

        result = term1 * erfc_part * exp_part

        return result

    def sample(self, zenith=None, n_samples=1):
        if zenith is None:
            zenith = 30

        phi_mod, A_mod, eta_l, mu, sigma_R = self.prepare_parameters(zenith)

        # Giới hạn sampling vùng hợp lý hơn
        eta_min, eta_max = 0.001, 0.1
        eta_test = np.linspace(eta_min, eta_max, 500)
        f_test = np.array([self.f_eta(e, phi_mod, A_mod, eta_l, mu, sigma_R) for e in eta_test])
        f_max = f_test.max()

        samples = []
        while len(samples) < n_samples:
            x = np.random.uniform(eta_min, eta_max)
            y = np.random.uniform(0, f_max)
            if y < self.f_eta(x, phi_mod, A_mod, eta_l, mu, sigma_R):
                samples.append(x)
        return np.array(samples if n_samples > 1 else samples[0])


# Hàm vẽ mô phỏng phân phối fading
def plot_fading_distribution(channel, zenith, eta_min=0.001, eta_max=0.1, num_points=500):
    phi_mod, A_mod, eta_l, mu, sigma_R = channel.prepare_parameters(zenith)
    eta_values = np.linspace(eta_min, eta_max, num_points)
    pdf_values = [channel.f_eta(eta, phi_mod, A_mod, eta_l, mu, sigma_R) for eta in eta_values]
    pdf_values = np.array(pdf_values)
    pdf_values /= np.trapz(pdf_values, eta_values)

    plt.figure(figsize=(8, 5))
    plt.plot(eta_values, pdf_values, label=f'Zenith = {zenith}°')
    plt.xlabel('Eta (η)')
    plt.ylabel('Probability Density')
    plt.title('Fading Distribution')
    plt.grid(True)
    plt.legend()
    plt.show()


# Thử nghiệm
channel = AtmosphericChannel(H_source=500e3)  # ví dụ vệ tinh ở 500km
plot_fading_distribution(channel, zenith=30)

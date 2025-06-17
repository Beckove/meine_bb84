import numpy as np
from scipy import integrate
from yudai.fso_link_muy_sigma_change import *

# Hàm Shannon entropy có kiểm tra biên
def H_2(p):
    if p <= 0:
        return 0
    if p >= 1:
        return 0
    return -p * np.log2(p) - (1 - p) * np.log2(1 - p)


# Hàm tính Qμ và Qν
def Q_muy(eta, p_dark, P_AP, n_s):
    p_dark_new = p_dark * (1 + P_AP)
    return p_dark_new + (1 + P_AP) * (1 - np.exp(-n_s * eta))

# Hàm tính EμQμ và EνQν
def EQ_muy(eta, p_dark, P_AP, e_0, e_pol, n_s):
    p_dark_new = p_dark * (1 + P_AP)
    return e_0 * p_dark_new + (e_pol + e_0 * P_AP) * (1 - np.exp(-n_s * eta))

# Tính QBER trung bình và Qμ trung bình
def qber_cal(p_dark, P_AP, e_0, e_pol, n_s, zenith):
    phi_mod, A_mod, eta_l, mu, sigma_R = channel.prepare_parameters(zenith=zenith)

    def numerator(eta):
        return EQ_muy(eta, p_dark, P_AP, e_0, e_pol, n_s) * channel.f_eta(eta, phi_mod, A_mod, eta_l, mu, sigma_R)

    def denominator(eta):
        return Q_muy(eta, p_dark, P_AP, n_s) * channel.f_eta(eta, phi_mod, A_mod, eta_l, mu, sigma_R)

    denominator_inter, _ = integrate.quad(denominator, 0, np.inf, limit=100, epsabs=1e-9, epsrel=1e-9)
    numerator_inter, _ = integrate.quad(numerator, 0, np.inf, limit=100, epsabs=1e-9, epsrel=1e-9)

    return numerator_inter / denominator_inter, denominator_inter

# Hàm tính SKR hoàn chỉnh
def compute_SKR(R, s, p, d, f, p_dark, e_0, e_pol, n_s, n_d, P_AP, zenith):
    phi_mod, A_mod, eta_l, mu, sigma_R = channel.prepare_parameters(zenith=zenith)

    # Hàm tính Q1 lower bound
    def Q_1_L(eta):
        Q_nu = Q_muy(eta, p_dark, P_AP, n_d)
        Q_mu = Q_muy(eta, p_dark, P_AP, n_s)

        temp1 = (np.exp(-n_s) * n_s ** 2) / (n_s * n_d - n_d ** 2)
        temp2 = (Q_nu * np.exp(n_d)
                 - Q_mu * np.exp(n_s) * (n_d ** 2 / n_s ** 2)
                 - ((n_s ** 2 - n_d ** 2) / n_s ** 2) * (p_dark * (1 + P_AP)))

        return temp1 * temp2 * channel.f_eta(eta, phi_mod, A_mod, eta_l, mu, sigma_R)

    # Hàm tính e1 upper bound
    def e1_U(eta):
        Q_nu = Q_muy(eta, p_dark, P_AP, n_d)
        Q_mu = Q_muy(eta, p_dark, P_AP, n_s)
        E_nu_Q_nu = EQ_muy(eta, p_dark, P_AP, e_0, e_pol, n_s)

        temp1 = e_0 * (p_dark * (1 + P_AP))
        temp2 = n_s / (n_s * n_d - n_d ** 2)
        temp3 = (Q_nu * np.exp(n_d)
                 - Q_mu * np.exp(n_s) * (n_d ** 2 / n_s ** 2)
                 - ((n_s ** 2 - n_d ** 2) / n_s ** 2) * (p_dark * (1 + P_AP)))

        Y_1L = temp2 * temp3

        return ((E_nu_Q_nu * np.exp(n_d) - temp1) / (Y_1L*n_d)) * Q_1_L(eta)

    # Tích phân lấy trung bình Q1
    avg_Q_1_L, _ = integrate.quad(Q_1_L, 0, np.inf, limit=100, epsabs=1e-9, epsrel=1e-9)

    # Tích phân lấy trung bình e1
    integral_e1, _ = integrate.quad(e1_U, 0, np.inf, limit=100, epsabs=1e-9, epsrel=1e-9)
    avg_e1_U = integral_e1 / avg_Q_1_L

    # Tính Qμ và Eμ trung bình
    E_mu, Q_mu = qber_cal(p_dark, P_AP, e_0, e_pol, n_s, zenith)

    # Tính toàn bộ SKR
    element_1 = R * s * p * d
    element_2 = -Q_mu * f * H_2(E_mu)
    element_3 = avg_Q_1_L * (1 - H_2(avg_e1_U))
    # if (element_2 + element_3) < 0:
    #     return 0
    return element_1 * (element_2 + element_3)


def simulation_QBer(params):
    channel = AtmosphericChannel(tau_zen=params["tau"], H_source=500e3)
    qber, _ = qber_cal(
        params["p_dark"],
        params["P_AP"],
        params["e_0"],
        params["e_pol"],
        params["n_s"],
        params["zenith"]
    )
    return qber

def simulation_SKR(params):
    channel = AtmosphericChannel(tau_zen=params["tau"], H_source=500e3)
    skr = compute_SKR(
        params["R"],
        params["s"],
        params["p"],
        params["d"],
        params["f"],
        params["p_dark"],
        params["e_0"],
        params["e_pol"],
        params["n_s"],
        params["n_d"],
        params["P_AP"],
        params["zenith"]
    )
    return skr


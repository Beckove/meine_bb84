import React, { useState, useRef } from 'react';
import MultipleSimulation from './multiplesimulation';

export default function SimuPage() {
  const [mode, setMode] = useState('single');
  const [progress, setProgress] = useState(0);
  const abortControllerRef = useRef(null);

  const [formData, setFormData] = useState({
    p_dark: '',
    P_AP: '',
    e_0: '',
    e_pol: '',
    n_s: '',
    zenith: '',
    R: '',
    s: '',
    p: '',
    d: '',
    f: '',
    n_d: '',
    tau_zen: '',
  });

  const [results, setResults] = useState({
    keyLength: '--',
    keyRate: '--',
    qber: '--',
    sValue: '--',
    combinedEfficiency: '--',
    siftedkey: '--',
    siftedkeyrate: '--',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRunSimulation = async () => {
    setProgress(0);
    setResults({
      keyLength: '--',
      keyRate: '--',
      qber: '--',
      sValue: '--',
      combinedEfficiency: '--',
      siftedkey: '--',
    });

    let currentProgress = 0;
    const maxBeforeResponse = 90;
    const interval = setInterval(() => {
      currentProgress += 5;
      if (currentProgress >= maxBeforeResponse) {
        currentProgress = maxBeforeResponse;
        clearInterval(interval);
      }
      setProgress(currentProgress);
    }, 200);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const res = await fetch('http://localhost:5000/bb84_simu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        signal: controller.signal,
      });

      const data = await res.json();
      clearInterval(interval);
      setProgress(100);
      setResults({
        keyLength: data.keyLength ?? '--',
        keyRate: data.keyRate ?? '--',
        qber: data.qber ?? '--',
        sValue: data.sValue ?? '--',
        combinedEfficiency: data.combinedEfficiency ?? '--',
        siftedkey: data.siftedkey ?? '--',
      });
    } catch (err) {
      console.error('Simulation error:', err);
      clearInterval(interval);
      setProgress(0);
      alert('Simulation failed or aborted.');
    }
  };

  const handleAbort = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setProgress(0);
      alert('Simulation aborted.');
    }
  };

  const paramFields = [
    { label: 'Background detection probability (p_dark)', name: 'p_dark', unit: '' },
    { label: 'After-pulsing probability (P_AP)', name: 'P_AP', unit: '' },
    { label: 'Background error rate (e₀)', name: 'e_0', unit: '' },
    { label: 'Polarization error probability (eₚₒₗ)', name: 'e_pol', unit: '' },
    { label: 'Mean photon number (signal pulse) (nₛ)', name: 'n_s', unit: '' },
    { label: 'Zenith Angle (°)', name: 'zenith', unit: '°' },
    { label: 'Atmospheric attenuation (τ)', name: 'tau_zen', unit: '' },
    { label: 'Repetition rate (R)', name: 'R', unit: 'MHz' },
    { label: 'Sifting efficiency (s)', name: 's', unit: '' },
    { label: 'Parameter estimation coefficient (p)', name: 'p', unit: '' },
    { label: 'Signal pulse fraction (d)', name: 'd', unit: '' },
    { label: 'Key reconciliation efficiency (f)', name: 'f', unit: '' },
    { label: 'Mean photon number (decoy pulse) (n_d)', name: 'n_d', unit: '' },
  ];

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 p-10">
      <div className="bg-white p-10 rounded-2xl shadow-2xl max-w-7xl mx-auto w-full">
        <div className="flex justify-center mb-8 space-x-4">
          <button
            onClick={() => setMode('single')}
            className={`px-4 py-2 rounded-lg font-medium ${mode === 'single' ? 'bg-indigo-500 text-black' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            Single Simulation
          </button>
          <button
            onClick={() => setMode('multiple')}
            className={`px-4 py-2 rounded-lg font-medium ${mode === 'multiple' ? 'bg-indigo-500 text-black' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            Multiple Simulations
          </button>
        </div>

        <h1 className="text-3xl font-bold mb-10 text-center">QKD Simulation Settings</h1>

        {mode === 'single' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Parameters Input (2/3 width) */}
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
              {paramFields.map(({ label, name, unit }, idx) => (
                <div key={idx}>
                  <label className="block mb-1 text-sm font-medium">{label}</label>
                  <div className="relative">
                    <input
                      type="text"
                      name={name}
                      value={formData[name]}
                      onChange={handleChange}
                      className="w-full px-3 py-2 pr-16 rounded border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                    />
                    {unit && (
                      <span className="absolute top-1/2 right-3 transform -translate-y-1/2 text-sm text-gray-500">{unit}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Results + Buttons */}
            <div className="flex flex-col justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold mb-4">Results</h2>
                {[{ label: 'QBER (%)', name: 'qber' }, { label: 'Sifted Key Rate (Hz)', name: 'siftedkey' }].map(({ label, name }, idx) => (
                  <div key={idx} className="mb-4">
                    <label className="block mb-1 text-sm font-medium">{label}</label>
                    <input
                      type="text"
                      readOnly
                      value={results[name]}
                      className="w-full px-3 py-2 rounded bg-gray-100 border border-gray-300 text-gray-700"
                    />
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={handleRunSimulation}
                  className="bg-indigo-500 text-black px-4 py-2 rounded hover:bg-indigo-600"
                >
                  Run simulation
                </button>
                {/* <button
                  onClick={handleAbort}
                  className="bg-red-500 hover:bg-red-600 text-black px-4 py-2 rounded"
                >
                  Abort
                </button> */}
              </div>

              <div className="h-4 bg-gray-200 rounded-full overflow-hidden mt-2">
                <div
                  className="bg-indigo-500 h-full text-center text-white text-sm leading-4 transition-all duration-200 ease-linear"
                  style={{ width: `${progress}%` }}
                >
                  {progress}%
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-10">
            <MultipleSimulation formData={formData} />
          </div>
        )}
      </div>
    </div>
  );
}

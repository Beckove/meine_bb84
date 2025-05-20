import React, { useState, useRef } from 'react';
import MultipleSimulation from './multiplesimulation';


export default function SimuPage() {
  const [mode, setMode] = useState('single');
  const [progress, setProgress] = useState(0);
  const abortControllerRef = useRef(null);

  const [formData, setFormData] = useState({
    sourceRate: '',
    sourceEfficiency: '',
    fiberLength: '',
    fiberLoss: '',
    detectorEfficiency: '',
    perturbProb: '',
    sopDeviation: '',
    protocol: 'BB84',
    losses: false,
    perturbations: false,
    eavesdropping: false,
    sopUncertainty: false,
    qubits: 50,
    qberFraction: '10.00',
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
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
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
      siftedkey: '--'
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
    // { label: 'Source rate', name: 'sourceRate', unit: 'MHz' },
    { label: 'FSO length', name: 'FSO Length', unit: 'km' },
    // { label: 'Fiber loss', name: 'fiberLoss', unit: 'dB/km' },
    { label: 'Detector efficiency', name: 'detectorEfficiency', unit: '%' },
    { label: 'Perturb probability', name: 'perturbProb', unit: '%' },
    { label: 'SOP mean deviation', name: 'sopDeviation', unit: 'rad' },
  ];

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 p-10">
      <div className="bg-white p-10 rounded-2xl shadow-2xl max-w-6xl mx-auto w-full">

        {/* Thanh chuyển chế độ */}
        <div className="flex justify-center mb-8 space-x-4">
          <button
            onClick={() => setMode('single')}
            className={`px-4 py-2 rounded-lg font-medium ${
              mode === 'single'
                ? 'bg-indigo-500 text-black'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Single Simulation
          </button>
          <button
            onClick={() => setMode('multiple')}
            className={`px-4 py-2 rounded-lg font-medium ${
              mode === 'multiple'
                ? 'bg-indigo-500 text-black'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Multiple Simulations
          </button>
        </div>

        <h1 className="text-3xl font-bold mb-8 text-center">QKD Simulation Settings</h1>

        {mode === 'single' ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* System Parameters */}
              <div>
                <h2 className="text-xl font-semibold mb-4">System Parameters</h2>
                {paramFields.map(({ label, name, unit }, idx) => (
                  <div key={idx} className="mb-4">
                    <div className="flex items-center mb-4">
                      <label className="w-40 text-sm font-medium">{label}</label>
                      <div className="relative flex-1">
                        <input
                          type="text"
                          name={name}
                          value={formData[name]}
                          onChange={handleChange}
                          className="w-full px-3 py-2 pr-16 rounded border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                        <span className="absolute top-1/2 right-3 transform -translate-y-1/2 text-sm text-gray-500">
                          {unit}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Simulation Settings */}
              <div>
                <h2 className="text-xl font-semibold mb-4">Simulation Settings</h2>
                <div className="mb-4">
                  <label className="block mb-1 text-sm font-medium">Protocol</label>
                  <select
                    name="protocol"
                    value={formData.protocol}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                  >
                    <option>BB84</option>
                    <option>E91</option>
                  </select>
                </div>

                {[
                  { label: 'Losses enabled', name: 'losses' },
                  { label: 'Perturbations enabled', name: 'perturbations' },
                  { label: 'Eavesdropping enabled', name: 'eavesdropping' },
                  { label: 'SOP uncertainty enabled', name: 'sopUncertainty' },
                ].map(({ label, name }, idx) => (
                  <div key={idx} className="flex items-center space-x-2 mb-3">
                    <input
                      type="checkbox"
                      name={name}
                      checked={formData[name]}
                      onChange={handleChange}
                      className="accent-indigo-600 w-4 h-4"
                    />
                    <label className="text-sm">{label}</label>
                  </div>
                ))}

                <div className="mb-4">
                  <label className="block mb-1 text-sm font-medium">Number of qubits</label>
                  <input
                    type="number"
                    name="qubits"
                    value={formData.qubits}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="mb-4">
                  <label className="block mb-1 text-sm font-medium">QBER cross-check fraction</label>
                  <div className="relative">
                    <input
                      type="text"
                      name="qberFraction"
                      value={formData.qberFraction}
                      onChange={handleChange}
                      className="w-full px-3 py-2 pr-10 rounded border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                    />
                    <span className="absolute top-1/2 right-3 transform -translate-y-1/2 text-sm text-gray-500">%</span>
                  </div>
                </div>
              </div>

              {/* Results */}
              <div>
                <h2 className="text-xl font-semibold mb-4">Results</h2>
                {[
  { label: 'Sifted Key', name: 'siftedkey' },
  { label: 'QBER (%)', name: 'qber' },
].map(({ label, name }, idx) => (
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

                <div className="flex flex-col gap-4 mt-6">
                  <button
                    onClick={handleRunSimulation}
                    className="bg-indigo-500 text-black px-4 py-2 rounded hover:bg-indigo-600"
                  >
                    Run simulation
                  </button>
                  <button
                    onClick={handleAbort}
                    className="bg-red-500 hover:bg-red-600 text-black px-4 py-2 rounded shadow"
                  >
                    Abort
                  </button>
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-10 h-4 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="bg-indigo-500 h-full text-center text-white text-sm leading-4 transition-all duration-200 ease-linear"
                style={{ width: `${progress}%` }}
              >
                {progress}%
              </div>
            </div>
          </>
        ) : (
              <div className="py-10">
      <MultipleSimulation formData={formData} />
    </div>
            )}
      </div>
    </div>
  );
}

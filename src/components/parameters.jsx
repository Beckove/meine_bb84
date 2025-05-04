// src/components/parameters.jsx
import React from 'react';

export default function ParameterPanel({ params, onChange, onReset, className = '' }) {
  const handleChange = key => e => {
    const value = parseFloat(e.target.value) || 0;
    onChange({ ...params, [key]: value });
  };

  const renderInput = (label, key, step = '0.1') => (
    <div className="flex flex-col space-y-1">
      <label className="text-sm text-cyan-200">{label}</label>
      <input
        type="number"
        step={step}
        value={params[key]}
        onChange={handleChange(key)}
        className="w-full sm:w-40 px-3 py-1.5 rounded-md bg-gray-900 text-white border border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-300"
      />
    </div>
  );

  return (
    <div className={`bg-gray-800 bg-opacity-60 border border-amber-600 shadow-lg rounded-2xl p-6 w-full max-w-4xl text-gray-200 ${className}`}>
      <h2 className="text-2xl font-semibold text-center mb-6 text-cyan-300">⚛️ Protocol Parameters</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {renderInput('Source generation rate (MHz)', 'sourceRate')}
        {renderInput('Detector Efficiency (%)', 'detectorEfficiency', '0.01')}
        {renderInput('Source efficiency (%)', 'sourceEfficiency')}
        {renderInput('Perturb Probability (%)', 'perturbProbability')}
        {renderInput('Fiber Length (km)', 'fiberLength', '1')}
        {renderInput('SOP Mean Deviation (rad)', 'sopMeanDeviation', '0.01')}
        {renderInput('Fiber Loss (dB/km)', 'fiberLoss', '0.01')}
      </div>

      <div className="flex justify-end pt-6">
        <button
          onClick={onReset}
          className="px-6 py-2 bg-cyan-700 hover:bg-cyan-500 text-amber-500 rounded-lg transition"
        >
          Reset to ideal state
        </button>
      </div>
    </div>
  );
}

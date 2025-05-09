import React from 'react';

export default function ParameterPanel({ params, onChange, onReset, className = '' }) {
  const handleChange = (key) => (e) => {
    const value = parseFloat(e.target.value) || 0;
    onChange({ ...params, [key]: value });
  };

  const renderInput = (label, key, step = '0.1') => (
    <div className="flex flex-col">
      <label className="text-sm font-medium text-indigo-200 mb-1">{label}</label>
      <input
        type="number"
        step={step}
        value={params[key]}
        onChange={handleChange(key)}
        className="w-full sm:w-48 px-4 py-2 rounded-xl bg-gray-700 text-white border border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-300 transition-shadow"
      />
    </div>
  );

  return (
    <div className={`bg-gradient-to-br from-indigo-900 via-gray-800 to-indigo-800 border border-indigo-500 shadow-2xl rounded-3xl p-8 max-w-4xl mx-auto ${className}`}>      
      <h2 className="text-3xl font-bold text-center mb-8 text-indigo-100 tracking-wide">Protocol Parameters</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {renderInput('Source generation rate (MHz)', 'sourceRate')}
        {renderInput('Detector Efficiency (%)', 'detectorEfficiency', '0.01')}
        {renderInput('Source efficiency (%)', 'sourceEfficiency')}
        {renderInput('Perturb Probability (%)', 'perturbProbability')}
        {renderInput('Fiber Length (km)', 'fiberLength', '1')}
        {renderInput('SOP Mean Deviation (rad)', 'sopMeanDeviation', '0.01')}
        {renderInput('Fiber Loss (dB/km)', 'fiberLoss', '0.01')}
      </div>

      <div className="flex justify-end mt-10">
        <button
          onClick={onReset}
          className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-indigo-400 hover:from-indigo-500 hover:to-indigo-300 text-white font-semibold rounded-full shadow-lg transform hover:scale-105 transition-transform"
        >
          Reset to Ideal
        </button>
      </div>
    </div>
  );
}

import React, { useState } from 'react';

const xParams = [
  { value: 'Zenith', label: 'Zenith (degree)' },
  { value: 'Tau zen', label: 'Tau zen (τ) ' }
];

const yParams = [
  { value: 'QBER', label: 'QBER' },
  { value: 'Secret Key Rate ', label: 'Key Generation Rate (Mbps)' }
];

const MultipleSimulationsUI = () => {
  const [nameX, setNameX] = useState(xParams[0].value);
  const [nameY, setNameY] = useState(yParams[0].value);
  const [startX, setStartX] = useState('0.00');
  const [endX, setEndX] = useState('90.00');
  const [points, setPoints] = useState('10');
  const [progress, setProgress] = useState(0);
  const [chartUrl, setChartUrl] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleRun = async () => {
    const start = parseFloat(startX);
    const end = parseFloat(endX);
    const nPoints = parseInt(points);

    if (isNaN(start) || isNaN(end) || isNaN(nPoints) || start >= end || nPoints <= 1) {
      alert("Please enter valid numeric values. Start must be less than End, and Points > 1.");
      return;
    }

    setProgress(10);
    try {
      const res = await fetch('http://localhost:5000/plot_simulation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name_x: nameX,
          name_y: nameY,
          start_value_x: start,
          end_value_x: end,
          point: nPoints,
        }),
      });

      setProgress(70);

      if (!res.ok) throw new Error('Failed to fetch plot');

      const blob = await res.blob();
      const imageUrl = URL.createObjectURL(blob);
      setChartUrl(imageUrl);
      setProgress(100);
    } catch (err) {
      console.error(err);
      alert("Simulation failed. Check server or parameters.");
      setProgress(0);
    }
  };

  return (
    <div className="bg-gray-100 text-gray-900 min-h-screen p-6 font-sans">
      <div className="max-w-6xl mx-auto flex space-x-8 border border-gray-300 rounded-lg p-6 shadow-lg bg-white">
        {/* Parameters */}
        <div className="w-1/2 space-y-6 border border-gray-300 rounded-lg p-6 bg-gray-50 shadow-inner">
          <h2 className="text-2xl font-semibold mb-4 text-center">Computation Parameters</h2>

          <div>
            <label className="block text-sm mb-2 font-medium">X-axis parameter</label>
            <select
              value={nameX}
              onChange={(e) => setNameX(e.target.value)}
              className="w-full px-3 py-2 rounded border border-gray-400 bg-white focus:ring-2 focus:ring-indigo-500"
            >
              {xParams.map((x) => (
                <option key={x.value} value={x.value}>{x.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm mb-2 font-medium">Y-axis parameter</label>
            <select
              value={nameY}
              onChange={(e) => setNameY(e.target.value)}
              className="w-full px-3 py-2 rounded border border-gray-400 bg-white focus:ring-2 focus:ring-indigo-500"
            >
              {yParams.map((y) => (
                <option key={y.value} value={y.value}>{y.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm mb-2 font-medium">Start value (x)</label>
            <input
              type="number"
              value={startX}
              onChange={(e) => setStartX(e.target.value)}
              step="0.01"
              className="w-full px-3 py-2 rounded border border-gray-400 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm mb-2 font-medium">End value (x)</label>
            <input
              type="number"
              value={endX}
              onChange={(e) => setEndX(e.target.value)}
              step="0.01"
              className="w-full px-3 py-2 rounded border border-gray-400 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm mb-2 font-medium">Number of simulation points</label>
            <input
              type="number"
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              className="w-full px-3 py-2 rounded border border-gray-400 focus:ring-2 focus:ring-indigo-500"
              min="2"
            />
          </div>

          <button
            onClick={handleRun}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded shadow"
          >
            Run Simulation
          </button>

          <div className="bg-gray-300 h-5 rounded mt-4 overflow-hidden">
            <div
              className="bg-blue-500 h-5 text-center text-sm font-semibold transition-all duration-500"
              style={{ width: `${progress}%` }}
            >
              {progress > 0 ? `${progress}%` : ''}
            </div>
          </div>
        </div>

        {/* Chart display */}
        <div className="w-1/2 border border-gray-300 rounded-lg p-6 bg-gray-50 shadow-inner flex flex-col">
          <h2 className="text-2xl font-semibold mb-4 text-center">Results</h2>
          <div className="flex-grow bg-white rounded p-4 flex flex-col items-center justify-center border border-gray-200">
            {chartUrl ? (
              <>
                <img src={chartUrl} alt="Simulation result" className="max-h-[32rem] max-w-full rounded" />
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded shadow"
                >
                  Zoom In
                </button>
              </>
            ) : (
              <p className="text-gray-500 text-center italic">[Chart will appear here after simulation]</p>
            )}
          </div>
        </div>
      </div>

      {/* Modal Zoom Image */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50"
          onClick={() => setIsModalOpen(false)}
        >
          <img
            src={chartUrl}
            alt="Zoomed simulation result"
            className="w-full h-[600px] object-contain rounded"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setIsModalOpen(false)}
            className="absolute top-4 right-4 text-white bg-red-600 hover:bg-red-700 rounded-full w-10 h-10 flex items-center justify-center text-xl font-bold"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
};

export default MultipleSimulationsUI;

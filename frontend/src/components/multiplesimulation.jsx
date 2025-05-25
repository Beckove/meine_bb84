import React, { useState } from 'react';

const xParams = [
  { value: 'Detection Efficiency', label: 'Detector efficiency (%)' },
  { value: 'Length', label: 'Length (km)' },
  // { value: 'Sop Mean Deviation', label: 'Sop Mean Deviation (rad)' },
  { value: 'Perturb Probability', label: 'Perturb Probability (%)' }
];

const yParams = [
  { value: 'QBER', label: 'QBER' },
    { value: 'Sifted Key', label: 'Sifted Key' }
];

const MultipleSimulationsUI = () => {
  const [nameX, setNameX] = useState('Fiber Loss');
  const [nameY, setNameY] = useState('Key Length');
  const [startX, setStartX] = useState('0.00');
  const [endX, setEndX] = useState('1.00');
  const [points, setPoints] = useState('10');
  const [progress, setProgress] = useState(0);
  const [chartUrl, setChartUrl] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleRun = async () => {
    setProgress(10);
    try {
      const res = await fetch('http://localhost:5000/plot_simulation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name_x: nameX,
          name_y: nameY,
          start_value_x: parseFloat(startX),
          end_value_x: parseFloat(endX),
          point: parseInt(points),
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
      setProgress(0);
    }
  };

  return (
    <div className="bg-gray-100 text-gray-900 min-h-screen p-6 font-sans">
      <div className="max-w-6xl mx-auto flex space-x-8 border border-gray-300 rounded-lg p-6 shadow-lg bg-white">
        {/* Parameters */}
        <div className="w-1/2 space-y-6 border border-gray-300 rounded-lg p-6 bg-gray-50 shadow-inner">
          <h2 className="text-2xl font-semibold mb-4 text-center">Parameters</h2>

          <div>
            <label className="block text-sm mb-2 font-medium">Select x-parameter</label>
            <select
              value={nameX}
              onChange={(e) => setNameX(e.target.value)}
              className="w-full px-3 py-2 rounded border border-gray-400 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {xParams.map((x) => (
                <option key={x.value} value={x.value}>
                  {x.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm mb-2 font-medium">Select y-parameter</label>
            <select
              value={nameY}
              onChange={(e) => setNameY(e.target.value)}
              className="w-full px-3 py-2 rounded border border-gray-400 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {yParams.map((y) => (
                <option key={y.value} value={y.value}>
                  {y.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm mb-2 font-medium">Start value x</label>
            <input
              type="number"
              value={startX}
              onChange={(e) => setStartX(e.target.value)}
              step="0.01"
              className="w-full px-3 py-2 rounded border border-gray-400 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm mb-2 font-medium">End value x</label>
            <input
              type="number"
              value={endX}
              onChange={(e) => setEndX(e.target.value)}
              step="0.01"
              className="w-full px-3 py-2 rounded border border-gray-400 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm mb-2 font-medium">Number of points</label>
            <input
              type="number"
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              className="w-full px-3 py-2 rounded border border-gray-400 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            onClick={handleRun}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-black font-semibold py-2 rounded shadow transition-colors duration-200"
          >
            Run simulations
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

        {/* Chart */}
        <div className="w-1/2 border border-gray-300 rounded-lg p-6 bg-gray-50 shadow-inner flex flex-col">
          <h2 className="text-2xl font-semibold mb-4 text-center text-gray-900">Results</h2>
          <div className="flex-grow bg-white rounded p-4 flex flex-col items-center justify-center border border-gray-200">
            {chartUrl ? (
              <>
<img src={chartUrl} alt="Simulation result" className="max-h-[32rem] max-w-full rounded" />
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-black rounded shadow"
                >
                  Zoom in
                </button>
              </>
            ) : (
              <p className="text-gray-500 text-center italic">[Biểu đồ sẽ hiển thị tại đây]</p>
            )}
          </div>
        </div>
      </div>

      {/* Modal phóng to ảnh */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50"
          onClick={() => setIsModalOpen(false)}
        >
          <img
            src={chartUrl}
            alt="Simulation result large"
  className="w-full h-[600px] object-contain rounded"
            onClick={(e) => e.stopPropagation()} // ngăn đóng modal khi click lên ảnh
          />
          <button
            onClick={() => setIsModalOpen(false)}
            className="absolute top-4 right-4 text-white bg-red-600 rounded-full w-10 h-10 flex items-center justify-center font-bold hover:bg-red-700"
            aria-label="Close modal"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
};

export default MultipleSimulationsUI;

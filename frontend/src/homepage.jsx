import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center w-full h-screen bg-gradient-to-br from-purple-900 via-indigo-800 to-blue-700">
      <div className="bg-white bg-opacity-20 backdrop-blur-lg rounded-3xl p-12 shadow-2xl flex flex-col items-center space-y-8">
        <h1 className="text-4xl font-extrabold text-white tracking-wider">BB84 QKD Simulation</h1>
        <div className="flex flex-col sm:flex-row gap-6">
          <button
            onClick={() => navigate('/setting_page')}
            className="px-8 py-4 bg-green-500 bg-opacity-80 hover:bg-opacity-100 text-white font-semibold rounded-full shadow-lg transform hover:scale-105 transition-transform"
          >
            No Eve Mode
          </button>

          <button
            onClick={() => navigate('/eve')}
            className="px-8 py-4 bg-red-500 bg-opacity-80 hover:bg-opacity-100 text-white font-semibold rounded-full shadow-lg transform hover:scale-105 transition-transform"
          >
            Eve Mode
          </button>

          <button
            onClick={() => navigate('/simulation')}
            className="px-8 py-4 bg-indigo-500 bg-opacity-80 hover:bg-opacity-100 text-white font-semibold rounded-full shadow-lg transform hover:scale-105 transition-transform"
          >
            Simulation Mode
          </button>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Atom, Zap } from 'lucide-react';

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center w-full h-screen bg-gradient-to-br from-indigo-900 via-purple-800 to-black">
      <div className="relative z-10 bg-white bg-opacity-10 backdrop-blur-lg rounded-3xl p-12 shadow-xl border border-purple-600 flex flex-col items-center space-y-10">
        <h1 className="text-5xl font-extrabold text-indigo-900 tracking-wide">BB84 QKD Simulator</h1>
        <p className="text-indigo-300 text-lg max-w-md text-center">Explore quantum key distribution with interactive visualization and secure simulation.</p>
        <div className="flex flex-col sm:flex-row gap-8">
          <button
            onClick={() => navigate('/setting_page')}
            className="flex items-center space-x-3 px-10 py-4 bg-gradient-to-r from-purple-600 to-indigo-500 hover:from-purple-500 hover:to-indigo-400 text-white font-semibold rounded-full shadow-lg transform hover:scale-105 transition-transform"
          >
            <Atom size={24} />
            <span>Visualization</span>
          </button>

          <button
            onClick={() => navigate('/simulation')}
            className="flex items-center space-x-3 px-10 py-4 bg-gradient-to-r from-blue-600 to-purple-500 hover:from-blue-500 hover:to-purple-400 text-white font-semibold rounded-full shadow-lg transform hover:scale-105 transition-transform"
          >
            <Zap size={24} />
            <span>Simulation Mode</span>
          </button>
        </div>
      </div>
      {/* Animated quantum particles background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute bg-gradient-to-r from-pink-500 to-blue-500 opacity-20 rounded-full animate-float"
            style={{
              width: `${Math.random() * 20 + 10}px`,
              height: `${Math.random() * 20 + 10}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDuration: `${Math.random() * 5 + 5}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

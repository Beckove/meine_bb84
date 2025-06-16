import React, { useState, useEffect } from 'react';
import { Square, CheckSquare, Rocket } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../index.css';

export default function ControlPanel({ onStart }) {
  const [bitCount, setBitCount] = useState(10);
  const [isEveMode, setIsEveMode] = useState(false);
  const [isNoEveMode, setIsNoEveMode] = useState(true);
  const [popupMessage, setPopupMessage] = useState('');
  const [isPopupVisible, setIsPopupVisible] = useState(false);

  const navigate = useNavigate();

  const handleStart = () => {
    if (!isEveMode && !isNoEveMode) {
      setPopupMessage('Must choose simulate mode');
      setIsPopupVisible(true);
      return;
    }

    setPopupMessage(`Simulation will begin with qubit count = ${bitCount}`);
    setIsPopupVisible(true);

    setTimeout(() => {
      onStart({ bitCount, isEveMode, isNoEveMode });
      setIsPopupVisible(false);
    }, 3500);
  };

  useEffect(() => {
    if (isPopupVisible) {
      const t = setTimeout(() => setIsPopupVisible(false), 2000);
      return () => clearTimeout(t);
    }
  }, [isPopupVisible]);

  return (
    <div
      className="p-10 rounded-3xl text-center space-y-12 border border-white/30"
      style={{
        background: 'rgba(255, 255, 255, 0.2)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.25)',
      }}
    >
      <h2 className="text-4xl font-extrabold text-indigo-900 drop-shadow">Number of Bits</h2>

      <input
        type="number"
        value={bitCount}
        onChange={e => setBitCount(+e.target.value)}
        className="mx-auto w-40 h-20 text-4xl border-2 border-indigo-300 rounded-xl text-center font-semibold bg-white/80 text-indigo-900 placeholder-indigo-400 shadow-md"
      />

      <div className="flex space-x-16 justify-center items-center text-3xl font-bold text-indigo-800">
        <label className="flex items-center cursor-pointer space-x-6 hover:scale-110 transition-transform">
          <div
            onClick={() => { setIsEveMode(true); setIsNoEveMode(false); }}
            className="w-14 h-14 border-2 border-indigo-500 rounded-xl flex items-center justify-center bg-white/40"
          >
            {isEveMode ? <CheckSquare className="w-10 h-10 text-pink-600" /> : <Square className="w-10 h-10 text-indigo-400" />}
          </div>
          <span>Eve Mode</span>
        </label>

        <label className="flex items-center cursor-pointer space-x-6 hover:scale-110 transition-transform">
          <div
            onClick={() => { setIsNoEveMode(true); setIsEveMode(false); }}
            className="w-14 h-14 border-2 border-indigo-500 rounded-xl flex items-center justify-center bg-white/40"
          >
            {isNoEveMode ? <CheckSquare className="w-10 h-10 text-pink-600" /> : <Square className="w-10 h-10 text-indigo-400" />}
          </div>
          <span>No Eve Mode</span>
        </label>
      </div>

      <button
        onClick={handleStart}
className="inline-flex items-center space-x-4 px-12 py-6 bg-pink-500 text-black rounded-3xl text-5xl font-black shadow-lg hover:bg-pink-400 transition"
      >
        <Rocket className="w-10 h-10" />
        <span>Start</span>
      </button>

      {isPopupVisible && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="bg-black bg-opacity-80 text-red-500 p-8 rounded-2xl text-3xl pointer-events-auto text-center">
            {popupMessage}
          </div>
        </div>
      )}
    </div>
  );
}

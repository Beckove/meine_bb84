// components/controlpanel.jsx
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
    <div className="p-6 bg-white shadow-lg rounded-2xl text-center space-y-6">
      <h2 className="text-lg font-semibold">Number of Bits</h2>
      <input
        type="number"
        value={bitCount}
        onChange={e => setBitCount(+e.target.value)}
        className="mx-auto w-20 h-10 border rounded text-center"
      />

      <div className="flex space-x-6 justify-center">
        <label className="flex items-center cursor-pointer">
          <div
            onClick={() => { setIsEveMode(true); setIsNoEveMode(false); }}
            className="w-5 h-5 border rounded flex items-center justify-center"
          >
            {isEveMode ? <CheckSquare /> : <Square />}
          </div>
          <span className="ml-2">Eve Mode</span>
        </label>

        <label className="flex items-center cursor-pointer">
          <div
            onClick={() => { setIsNoEveMode(true); setIsEveMode(false); }}
            className="w-5 h-5 border rounded flex items-center justify-center"
          >
            {isNoEveMode ? <CheckSquare /> : <Square />}
          </div>
          <span className="ml-2">No Eve Mode</span>
        </label>
      </div>

      <button
        onClick={handleStart}
        className="inline-flex items-center space-x-2 px-6 py-2 bg-indigo-200 rounded-lg"
      >
        <Rocket /><span>Start</span>
      </button>

      {isPopupVisible && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="bg-black text-red-500 p-4 rounded-lg w-100 h-50 flex items-center justify-center text-center pointer-events-auto">
            {popupMessage}
          </div>
        </div>
      )}
    </div>
  );
}

// App.jsx
import React, { useState } from 'react';
import Sidebar from './components/sidebar1';
import AppBar from './components/appbar';
import ControlPanel from './components/controlpanel';
import ParameterPanel from './components/parameters';
import { useNavigate } from 'react-router-dom';

import Alice from './assets/Alice.svg';
import Bob from './assets/Bob.svg';
import './App.css';

const idealParams = {
  sourceRate: 10,
  detectorEfficiency: 1.0,
  sourceEfficiency: 1.0,
  perturbProbability: 0.0,
  fiberLength: 0,
  sopMeanDeviation: 0.0,
  fiberLoss: 0.0 
};

function App() {
  const navigate = useNavigate();
  const [params, setParams] = useState(idealParams);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleParamChange = newParams => setParams(newParams);
  const handleParamReset = () => setParams(idealParams);

  const handleStart = async ({ bitCount, isEveMode }) => {
    const inputParams = { bitCount, isEveMode, ...params };
    setIsLoading(true);
    setError(null);

    try {
      const resp = await fetch('http://localhost:5000/bb84', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inputParams)
      });

      if (!resp.ok) throw new Error(`Server error ${resp.status}`);
      const result = await resp.json();

      // Destructure all returned fields
      const {
        alice_bits,
        bob_bits,
        alice_bases,
        bob_bases,
        eve_bits,
        eve_bases,
        sifted_key,
        quantum_bit_error_rate,
        matching_bases_count
      } = result;

navigate(isEveMode ? '/with-eve' : '/no-eve', { state: { result, inputParams } });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen">
      <div className="fixed left-0 top-0 bottom-0 w-20 bg-white">
        <Sidebar />
      </div>
      <div className="flex flex-col flex-1 ml-20">
        <AppBar />

        {error && (
          <div className="flex-1 flex items-center justify-center text-red-500">
            Lỗi: {error}
          </div>
        )}

        {!isLoading && (
          <div className="flex-1 flex justify-center items-center p-8">
            <div className="flex flex-col items-center space-y-10 w-full max-w-5xl">
              <div className="flex items-center space-x-8">
                <img src={Alice} alt="Alice" className="w-32 h-32 animate-pulse" />
                <ControlPanel onStart={handleStart} />
                <img src={Bob} alt="Bob" className="w-32 h-32 animate-pulse" />
              </div>
              <ParameterPanel
                params={params}
                onChange={handleParamChange}
                onReset={handleParamReset}
              />
            </div>
          </div>
        )}

        {isLoading && (
          <div className="text-amber-500 flex-1 flex items-center justify-center">
            Loading Simulation ...
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

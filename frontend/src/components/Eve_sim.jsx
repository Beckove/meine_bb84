// Này ngon rồi
import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, useAnimation } from 'framer-motion';

import Sidebar from './sidebar1';
import AppBar from './appbar';
import ParameterPanel from './parameters';

import Alice from '../assets/Alice.svg';
import Bob from '../assets/Bob.svg';
import Devil from '../assets/devil_eve.svg';
import quantumchan from '../assets/qt_x2.svg';
import classicalchan from '../assets/classic_x2.svg';
import symbols_table from '../assets/symbols_img.svg';

// Bases
import rect_base from '../assets/rectilinear_base.svg';
import diagonal_base from '../assets/diagonal_base.svg';

// Bits
import diagonal1_bit from '../assets/diagonal1_bit.svg';
import diagonal2_bit from '../assets/diagonal2_bit.svg';
import ver_bit from '../assets/vertical_bit.svg';
import hor_bit from '../assets/horizontal_bit.svg';

// Placeholder
import Nonee from '../assets/react.svg';

export default function SimulationPage() {
  const navigate = useNavigate();
  const { state } = useLocation();



  const [result] = useState(state?.result || {});
  const [inputParams] = useState(state?.inputParams || {});
        const {
    alice_bits = [],
    bob_bits = [],
    eve_bits = [],
    alice_bases = [],
    bob_bases = [],
    eve_bases = [],
    sifted_key = [],
    quantum_bit_error_rate = 0,
    matching_bases_count = 0,
  } = result;
  useEffect(() => {
  if (!state?.result || !state?.inputParams) return;



  const payload = {
    alice_bits,
    alice_bases,
    bob_bases,
    eve_bases,
    perturbProbability: parseFloat(inputParams.perturbProbability ?? 0)
  };

  fetch('http://localhost:5000/bb84_circuit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
    .then(res => {
      if (!res.ok) throw new Error(res.statusText);
      return res.text(); // SVG string
    })
    .then(setCircuitSvg)
    .catch(err => {
      console.error('Error loading BB84 circuit SVG:', err);
    });
}, [state, inputParams, alice_bits, alice_bases, bob_bases, eve_bases]);

  const [circuitSvg, setCircuitSvg] = useState(null);

  useEffect(() => {
    if (!state?.result || !state?.inputParams) {
      navigate('/setting_page');
    }
  }, [state, navigate]);

  

  const aliceControls = useAnimation();
  const eveControls = useAnimation();



  const bitCount = alice_bits.length;
  // Pause/Resume state
  const [isPaused, setIsPaused] = useState(false);
  const togglePause = () => setIsPaused(prev => !prev);

  const controls = useAnimation();
  const channelRef = useRef(null);
  const [channelWidth, setChannelWidth] = useState(0);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [showLoopEnd, setShowLoopEnd] = useState(false);
  const [progress, setProgress] = useState(0);

  useLayoutEffect(() => {
    const updateWidth = () => {
      if (channelRef.current) {
        setChannelWidth(channelRef.current.clientWidth - 80);
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  useEffect(() => {
    if (currentIdx >= bitCount || channelWidth === 0 || isPaused) return;
    aliceControls.set({ x: 0 });
    setProgress(0);
    aliceControls.start({
      x: channelWidth / 2 + 8,
      transition: { duration: 1.2, ease: 'linear' },
      onUpdate: ({ x }) => setProgress(x / channelWidth),
    });
  }, [currentIdx, channelWidth, isPaused]);

  useEffect(() => {
    if (currentIdx >= bitCount || channelWidth === 0 || isPaused) return;
    eveControls.set({ x: channelWidth / 2, opacity: 0 });
    eveControls.start({
      x: channelWidth,
      opacity: 1,
      transition: { duration: 1.2, ease: 'linear', delay: 1.2 },
    });
  }, [currentIdx, channelWidth, isPaused]);

  useEffect(() => {
    if (isPaused) return;
    if (currentIdx < bitCount) {
      const timer = setTimeout(() => setCurrentIdx(i => i + 1), 2400);
      return () => clearTimeout(timer);
    }
    if (currentIdx === bitCount) {
      controls.set({ x: 0 });
      setShowLoopEnd(true);
      const endTimer = setTimeout(() => {
        controls.set({ x: 0 });
        setShowLoopEnd(false);
        setCurrentIdx(0);
      }, 2000);
      return () => clearTimeout(endTimer);
    }
  }, [currentIdx, bitCount, isPaused]);

  const getBaseImage = base => (base === 0 ? rect_base : base === 1 ? diagonal_base : Nonee);
  const getBitImage = (base, bit) => {
    if (base === 0) return bit === 0 ? hor_bit : ver_bit;
    if (base === 1) return bit === 0 ? diagonal1_bit : diagonal2_bit;
    return Nonee;
  };

  const alicePhoton = alice_bits[currentIdx] != null
    ? getBitImage(alice_bases[currentIdx], alice_bits[currentIdx])
    : Nonee;
  const evePhoton = eve_bits[currentIdx] != null
    ? getBitImage(eve_bases[currentIdx], eve_bits[currentIdx])
    : Nonee;
  const bobPhoton = bob_bits[currentIdx] != null
    ? getBitImage(bob_bases[currentIdx], bob_bits[currentIdx])
    : Nonee;

  const measuredImages = [hor_bit, ver_bit, diagonal1_bit, diagonal2_bit];
  const bobImage = bobPhoton;

return (
    //<div className="flex min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-black text-amber-300"> // Line này giữ màu grad quantum
<div className="flex min-h-screen bg-gradient-to-br from-gray-900 via-indigo-800 to-black text-amber-500 items-center">

      <div className="fixed inset-y-0 left-0 w-20 bg-gray-800 bg-opacity-50 pt-16 backdrop-blur-lg border-r border-amber-600 shadow-lg">
        <Sidebar />
      </div>
      <div className="items-center flex flex-col flex-1 ml-20 overflow-hidden pt-16">
        <AppBar />
        <div className="flex-1 overflow-auto p-1 items-center">
          <div className="flex justify-center mb-10">
            {/* Alice panel */}
            <div className="flex flex-col items-center w-64">
              <img src={Alice} alt="Alice" className="h-32 mb-4" />
              <div className="color-blue-200 w-full h-72 overflow-y-auto border border-amber-600 rounded-2xl p-4 bg-opacity-40">
               {/*</div><div className="color-blue-200 w-full h-72 overflow-y-auto border border-amber-600 rounded-2xl p-4 bg-gray-800 bg-opacity-40"> */}

                <div className="text-2xl font-semibold mb-3 text-center text-amber-200">Alice</div>
                {alice_bases.map((base, i) => (
                  <div
                    key={`alice-${i}`}
                    className={`grid grid-cols-3 items-center gap-2 mb-3 py-2 px-1 rounded-lg ${
                      currentIdx === i ? 'bg-amber-700 bg-opacity-30 font-bold' : ''
                    }`}
                  >
                    <img src={getBaseImage(base)} alt="alice-base" className="h-10 w-10" />
                    <img src={getBitImage(base, alice_bits[i])} alt="alice-bit" className="scale-1.1 h-10 w-10" />
                    <span className="text-amber-100 text-2xl">{alice_bits[i]}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Control panel */}
            <div className="flex flex-col items-center px-6">
              <div className="mb-2 text-3xl font-semibold text-amber-400">Bits: {bitCount}</div>
              <img src={Nonee} alt="Placeholder" className="h-80 opacity-70 mb-4" />
            </div>

            {/* Bob panel */}
            <div className="flex flex-col items-center w-64">
              <img src={Bob} alt="Bob" className="h-32 mb-4" />
              <div className="w-full h-72 overflow-y-auto border border-amber-600 rounded-2xl p-4 bg-gray-800 bg-opacity-40">
                <div className="text-2xl font-semibold mb-3 text-center text-amber-200">Bob</div>
                {bob_bases.map((base, i) => (
                  <div
                    key={
                      `bob-${i}`
                    }
                    className={`grid grid-cols-3 items-center gap-2 mb-3 py-2 px-1 rounded-lg ${
                      currentIdx === i ? 'bg-amber-700 bg-opacity-30 font-bold' : ''
                    }`}
                  >
                    <img src={getBaseImage(base)} alt="bob-base" className="h-10 w-10" />
                    <img src={getBitImage(base, bob_bits[i])} alt="bob-bit" className="h-10 w-10" />
                    <span className="text-amber-100 text-2xl">{bob_bits[i] != null ? bob_bits[i] : '-'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Classical channel */}
          <div className="mb-4 flex flex-col items-center">
            <div className="w-full h-16 relative">
              <img src={classicalchan} alt="Classical Channel" className="scale-0.7 absolute inset-0 w-full h-full object-contain opacity-80" />
              {showLoopEnd && (
                <div className="absolute inset-0 flex items-center justify-center text-4xl font-bold bg-gray-900 bg-opacity-80 text-amber-300">
                  Exchange information to get the sifted key
                </div>
              )}
            </div>
            <div className="mt-1 text-sm font-medium text-amber-400">Classical Channel</div>
          </div>

          {/* Quantum channel */}
          <div className="-mt-6 mb-4 flex flex-col justify-center">
            <div className="flex justify-between w-full px-4 mb-2 ">
              <img src={alicePhoton} alt="alice-photon" className="h-10 w-10" />
              <img src={bobPhoton} alt="bob-photon" className="h-10 w-10" />
            </div>
            <div ref={channelRef} className="w-full h-16 relative overflow-hidden rounded-lg border border-amber-600 bg-gray-800 bg-opacity-30">
              {/* Background*/}
              <img src={quantumchan} alt="" className="scale-0.7 absolute left-20 top-0 w-80 h-full object-contain opacity-60" />
              <img src={Devil}       alt=""   className="scale-0.8 absolute left-1/2 top-0 transform -translate-x-1/2 w-40 h-full object-contain opacity-100 z-20"/>
              <img src={quantumchan} alt="" className="scale-0.7  absolute right-20 top-0 w-80 h-full object-contain opacity-60" />
              {currentIdx < bitCount && (
                <>
                  {/* Alice & Bob bases */}
                  <img src={getBaseImage(alice_bases[currentIdx])} alt="alice-base" className="absolute left-4 bottom-2 h-10 w-10" />
                  <img src={getBaseImage(eve_bases[currentIdx])} alt="eve-base" className="absolute left-105 bottom-2 h-10 w-10" />
                  <img src={getBitImage(eve_bases[currentIdx], eve_bits[currentIdx])} alt="eve-bit" className="scale-1.1 absolute left-135 bottom-2 h-10 w-10" />
                  <img src={getBaseImage(bob_bases[currentIdx])}   alt="bob-base"   className="absolute right-4 bottom-2 h-10 w-10" />
                  {/* Phase 1: Alice photon -> center */}
                  
                    <motion.img
                    key={`alice-${currentIdx}`}
                    src={alicePhoton}
                    alt="alice-photon"
                    initial={{ x: 0 }}
                    animate={aliceControls}
                    style={{ opacity: progress < 0.5 ? 1 : 0 }}
                    className="scale-1.1 absolute top-1/2 -translate-y-1/2 h-10 w-10"
                    />
                  {/* Phase 2: Eve photon -> right */}
                  
                  {channelWidth > 0 && (
                    <motion.img
                      key={`eve-${currentIdx}-${channelWidth}`}
                      src={evePhoton}
                      alt="eve-photon"
                      initial={{ x: channelWidth / 2, opacity: 0 }}
                      animate={{ x: channelWidth, opacity: 1 }}
                      transition={{
                        x: { duration: 1.2, ease: 'linear', delay: 1.2 },
                        opacity: { duration: 0.2, delay: 1.2 }
                      }}
                      className="scale-1.1 absolute left-0 top-1/2 -translate-y-1/2 h-10 w-10 z-10"
                    />
                  )}

                </>
              )}

              {showLoopEnd && (
                <div className="absolute inset-0 flex items-center justify-center text-4xl font-bold bg-gray-900 bg-opacity-80 text-amber-300 z-100">
                  LOOP END
                </div>
              )}
            </div>
            <div className="mt-1 text-sm font-medium text-amber-400">Quantum Channel</div>

            {/* Measured photons display */}
            <div className="w-full mt-6 border border-amber-600 rounded-2xl p-4 bg-gray-800 bg-opacity-30">
              <div className="text-center font-semibold text-amber-300 mb-2">Bob Measured Photons</div>
              <div className="flex justify-center space-x-4">
                {measuredImages.map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt={`meas-${idx}`}
                    className={`h-12 w-12 ${img === bobImage ? 'ring-4 ring-amber-400 rounded-full' : 'opacity-60'}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Results summary */}
          <div className="w-full border border-amber-600 rounded-2xl p-6 bg-gray-800 bg-opacity-40 text-amber-200 space-y-2 mb-10">
            <div><strong>Alice bits:</strong> {alice_bits.join(' ')}</div>
            <div><strong>Bob bits:</strong> {bob_bits.map(b => b == null ? '-' : b).join(' ')}</div>
            <div><strong>Eve bits:</strong>   {eve_bits.join(' ')}</div>
            <div><strong>Alice bases:</strong> {alice_bases.join(' ')}</div>
            <div><strong>Bob bases:</strong>   {bob_bases.join(' ')}</div>
            <div><strong>Eve bases:</strong>   {eve_bases.join(' ')}</div>
            <div><strong>Sifted key:</strong>  {sifted_key.join('')}</div>
            <div><strong>Matching bases:</strong> {matching_bases_count}</div>
            <div><strong>QBER:</strong> {(quantum_bit_error_rate * 100).toFixed(2)}%</div>
          </div>

{circuitSvg && (
  <div className="w-full max-h-[500px] overflow-auto border border-amber-600 rounded-2xl p-6 bg-gray-800 bg-opacity-40 text-amber-200 mb-10">
    <h3 className="text-lg font-semibold mb-4">BB84 Circuit</h3>
    <div className="w-full overflow-x-auto">
      <div
        className="w-full"
        dangerouslySetInnerHTML={{
          __html: circuitSvg.replace(
            /<svg([^>]*)>/,
            '<svg$1 style="width:100%;height:auto;max-height:400px;" preserveAspectRatio="xMidYMid meet">'
          ),
        }}
      />
    </div>
  </div>
)}








          {/* Parameters panel */}
          <div className="flex justify-center items-start gap-12 mb-10">
            <img src={symbols_table} alt="Symbols" className="w-64 opacity-80" />
            <ParameterPanel
              params={inputParams}
              onChange={() => {}}
              onReset={() => navigate('/setting_page')}
              className="bg-gray-800 bg-opacity-60 rounded-2xl p-4 border border-amber-600"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, useAnimation } from 'framer-motion';

import Sidebar from '../components/sidebar1';
import AppBar from '../components/appbar';
import ParameterPanel from '../components/parameters';

import Alice from '../assets/Alice.svg';
import Bob from '../assets/Bob.svg';
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

  useEffect(() => {
    if (!state?.result || !state?.inputParams) {
      navigate('/setting_page');
    }
  }, [state, navigate]);

  const {
    alice_bits = [],
    bob_bits = [],
    alice_bases = [],
    bob_bases = [],
    sifted_key = [],
    quantum_bit_error_rate = 0,
    matching_bases_count = 0,
  } = result;

  const bitCount = alice_bits.length;
  const [isPaused, setIsPaused] = useState(false);
  const controls = useAnimation();
  const togglePause = () => setIsPaused(prev => !prev);

  const channelRef = useRef(null);
  const [channelWidth, setChannelWidth] = useState(0);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [showLoopEnd, setShowLoopEnd] = useState(false);

  const [progress, setProgress] = useState(0);

  // Calculate channel width and handle resize
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

// Thêm state track tiến độ

// Khi currentIdx thay đổi, start animation và cập nhật progress
useEffect(() => {
  if (currentIdx < bitCount) {
    setProgress(0);
    controls.set({ x: 0 });
    controls.start({
      x: channelWidth,
      transition: { duration: 2.4, ease: 'linear' },
      onUpdate: ({ x }) => {
        if (channelWidth > 0) {
          setProgress(x / channelWidth);
        }
      }
    });
  }
}, [currentIdx, channelWidth]);

// Pause/Resume: tính remaining dựa trên progress
useEffect(() => {
  if (currentIdx >= bitCount) return;
  if (isPaused) {
    controls.stop();
  } else {
    const remaining = Math.max(0, 1 - progress);
    controls.start({
      x: channelWidth,
      transition: { duration: remaining * 2.4, ease: 'linear' }
    });
  }
}, [isPaused, progress, channelWidth, currentIdx]);

  // Update currentIdx and loop
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
  }, [currentIdx, bitCount, isPaused, controls]);

  const getBaseImage = base => (base === 0 ? rect_base : base === 1 ? diagonal_base : Nonee);
  const getBitImage = (base, bit) => {
    if (base === 0) return bit === 0 ? hor_bit : ver_bit;
    if (base === 1) return bit === 0 ? diagonal1_bit : diagonal2_bit;
    return Nonee;
  };

  const alicePhoton = alice_bits[currentIdx] != null
    ? getBitImage(alice_bases[currentIdx], alice_bits[currentIdx])
    : Nonee;
  const bobPhoton = bob_bits[currentIdx] != null
    ? getBitImage(bob_bases[currentIdx], bob_bits[currentIdx])
    : Nonee;

  const measuredImages = [hor_bit, ver_bit, diagonal1_bit, diagonal2_bit];
  const bobImage = bobPhoton;


  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-black text-amber-300">
      <div className="fixed inset-y-0 left-0 w-20 bg-gray-800 bg-opacity-50 pt-16 backdrop-blur-lg border-r border-amber-600 shadow-lg">
        <Sidebar />
      </div>
      <div className="flex flex-col flex-1 ml-20 overflow-hidden pt-16">
        <AppBar />
        <div className="flex-1 overflow-auto p-6">
          <div className="flex justify-between mb-10">
            {/* Alice panel */}
            <div className="flex flex-col items-center w-64">
              <img src={Alice} alt="Alice" className="h-32 mb-4" />
              <div className="w-full h-72 overflow-y-auto border border-amber-600 rounded-2xl p-4 bg-gray-800 bg-opacity-40">
                <div className="text-2xl font-semibold mb-3 text-center text-amber-200">Alice</div>
                {alice_bases.map((base, i) => (
                  <div
                    key={`alice-${i}`}
                    className={`grid grid-cols-3 items-center gap-2 mb-3 py-2 px-1 rounded-lg ${
                      currentIdx === i ? 'bg-amber-700 bg-opacity-30 font-bold' : ''
                    }`}
                  >
                    <img src={getBaseImage(base)} alt="alice-base" className="h-10 w-10" />
                    <img src={getBitImage(base, alice_bits[i])} alt="alice-bit" className="h-10 w-10" />
                    <span className="text-amber-100 text-2xl">{alice_bits[i]}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Control panel */}
            <div className="flex flex-col items-center px-6">
              <div className="mb-2 text-3xl font-semibold text-amber-400">Bits: {bitCount}</div>
              <img src={Nonee} alt="Placeholder" className="h-80 opacity-70 mb-4" />
              <button
                onClick={togglePause}
                disabled={showLoopEnd}
                className="px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-semibold rounded-lg transform hover:scale-105 transition-transform disabled:opacity-50"
              >
                {isPaused ? 'Resume' : 'Pause'}
              </button>
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
          <div className="mb-10">
            <div className="flex flex-col items-center mb-6">
              <div className="w-full h-16 relative">
                <img src={classicalchan} alt="Classical Channel" className="absolute inset-0 w-full h-full object-contain opacity-80" />
                                {showLoopEnd && (
                  <div className="absolute inset-0 flex items-center justify-center text-4xl font-bold bg-gray-900 bg-opacity-80 text-amber-300">
                    Exchange information to get the sifted key
                  </div>
                )}
              </div>
              <div className="mt-1 text-sm font-medium text-amber-400">Classical Channel</div>
            </div>

            {/* Quantum channel */}
          <div className="mb-10 flex flex-col items-center">
            <div className="flex justify-between w-full px-4 mb-2">
              <img src={alicePhoton} alt="alice-photon" className="h-10 w-10" />
              <img src={bobPhoton} alt="bob-photon" className="h-10 w-10" />
            </div>
            <div ref={channelRef} className="w-full h-16 relative overflow-hidden rounded-lg border border-amber-600 bg-gray-800 bg-opacity-30">
              <img src={quantumchan} alt="Quantum Channel" className="absolute inset-0 w-full h-full object-contain opacity-60" />
              {currentIdx < bitCount && (
                <>
                  <img src={getBaseImage(alice_bases[currentIdx])} alt="alice-base" className="absolute left-4 bottom-2 h-10 w-10" />
                  <img src={getBaseImage(bob_bases[currentIdx])} alt="bob-base" className="absolute right-4 bottom-2 h-10 w-10" />
                  <motion.img
                    //key={currentIdx} // remount per index
                    src={alicePhoton}
                    alt="sliding-bit"
                    className="absolute top-1/2 transform -translate-y-1/2 h-10 w-10"
                    //initial={{ x: 0 }}
                    animate={controls}
                    //key={currentIdx}
                    initial={false}
                  />
                </>
              )}
                {showLoopEnd && (
                  <div className="absolute inset-0 flex items-center justify-center text-4xl font-bold bg-gray-900 bg-opacity-80 text-amber-300">
                    LOOP END
                  </div>
                )}
              </div>
              <div className="mt-1 text-sm font-medium text-amber-400">Quantum Channel</div>

              <div className="w-full mt-6 border border-amber-600 rounded-2xl p-4 bg-gray-800 bg-opacity-30">
                <div className="text-center font-semibold text-amber-300 mb-2">Measured Photons</div>
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
          </div>

          {/* Results summary */}
          <div className="w-full border border-amber-600 rounded-2xl p-6 bg-gray-800 bg-opacity-40 text-amber-200 space-y-2 mb-10">
            <div><strong>Alice bits:</strong> {alice_bits.join(' ')}</div>
            <div><strong>Alice bases:</strong> {alice_bases.join(' ')}</div>
            <div><strong>Bob bits:</strong> {bob_bits.map(b => b == null ? '-' : b).join(' ')}</div>
            <div><strong>Bob bases:</strong> {bob_bases.join(' ')}</div>
            <div><strong>Sifted key:</strong> {sifted_key.join('')}</div>
            <div><strong>Matching bases:</strong> {matching_bases_count}</div>
            <div><strong>QBER:</strong> {(quantum_bit_error_rate * 100).toFixed(2)}%</div>
          </div>

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

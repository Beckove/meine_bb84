import React from 'react';
import { FiZap } from 'react-icons/fi';

function AppBar() {
  return (
    <div
      className="fixed left-24 top-0 w-[calc(100%-5rem)] h-16
                     bg-gradient-to-r from-amber-300 to-amber-500
                     text-blue-900 flex items-center justify-center
                     px-8 shadow-lg z-20"
    >
      {/* Centered Title */}
      <div className="flex items-center space-x-3">
        <FiZap className="text-2xl" />
        <h1 className="text-lg font-semibold tracking-wide uppercase">
          BB84 Protocol
        </h1>
      </div>
    </div>
  );
}

export default AppBar;

import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function HomePage() {
  const navigate = useNavigate();

  const handleNoEve = () => {
    // Chuyển tới trang chính (No Eve mode)
    navigate('/no-eve');
  };

  const handleEve = () => {
    // Chuyển tới trang có Eve (Eve mode)
    navigate('/eve');
  };

  return (
    <div className="flex w-full h-screen items-center justify-center bg-gray-100">
      <div className="space-x-6 w-full bg-amber-800">
        <button
            onClick={() => navigate('/setting_page')}
            className="px-6 py-3 bg-green-500 text-black rounded-lg hover:bg-green-600"
          >
            No Eve mode
        </button>

        <button
          onClick={handleEve}
          className="px-6 py-3 bg-red-600 text-black rounded-lg hover:bg-red-500"
        >
          Eve mode
        </button>
      </div>
    </div>
  );
}

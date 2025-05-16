import React from 'react';
import { useNavigate } from 'react-router-dom';
import bb84_logo from '../assets/Home_button.svg';
import ideal_bb84 from '../assets/ideal_bb84.svg';

function Sidebar() {
  const navigate = useNavigate();

  return (
    <div className="w-24 h-screen bg-white flex flex-col items-center py-4 space-y-6">
      <img
        src={bb84_logo}
        alt="Home"
        className="w-20 h-20 hover:scale-110 transition-transform cursor-pointer"
        onClick={() => navigate('/')}
      />
      <img
        src={ideal_bb84}
        alt="Ideal BB84"
        className="w-20 h-20 hover:scale-110 transition-transform cursor-pointer"
        onClick={() => navigate('/setting_page')}
      />
    </div>
  );
}

export default Sidebar;

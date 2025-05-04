import React from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter, Routes, Route } from 'react-router-dom';

import HomePage from './homepage.jsx';
import App from './App.jsx';
import SimulationPage from './components/simulation_page'
import './index.css';

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/setting_page" element={<App />} /> {/* trang để set mấy tham số, là trang kế tiếp của HomePage */}
        <Route path="/no-eve" element={<SimulationPage />} /> {/* Trang mô phỏng k Eve */}
      </Routes>
    </HashRouter>
  </React.StrictMode>
);

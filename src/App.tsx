import React from 'react';
import { HashRouter as Router, Route, Routes } from 'react-router-dom';
import MainScreen from './components/MainScreen';
import SettingsPage from './components/SettingsPage';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainScreen />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </Router>
  );
};

export default App;
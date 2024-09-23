import React, { useEffect, useState } from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom'; // Update import
import MainScreen from './components/MainScreen'; // Import MainScreen

const App: React.FC = () => {
  const [hasLogs, setHasLogs] = useState<boolean>(false);

  useEffect(() => {
    const storedLogs = localStorage.getItem('devLogs');
    setHasLogs(!!storedLogs);
  }, []);

  return (
    <HashRouter> {/* Wrap the main component with HashRouter */}
      <Routes>
        <Route path="/" element={<MainScreen />} /> {/* Add route for MainScreen */}
      </Routes>
    </HashRouter>
  );
};

export default App;
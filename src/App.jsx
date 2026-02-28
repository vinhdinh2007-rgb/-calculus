import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import ScoreCalculator from './pages/ScoreCalculator';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route path="/" element={<ScoreCalculator />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;

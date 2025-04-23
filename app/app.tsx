import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import MoneyManager from './MoneyManager';  // 既存のコンポーネント
import MonthlySummaryPage from './monthly-summary/page';  // 新しいページ（後述）

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MoneyManager />} />
        <Route path="/monthly-summary" element={<MonthlySummaryPage />} />
      </Routes>
    </Router>
  );
};

export default App;

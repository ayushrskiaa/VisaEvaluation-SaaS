import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import EvaluationPage from './pages/EvaluationPage';
import EmbedPage from './pages/EmbedPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/evaluate" element={<EvaluationPage />} />
        <Route path="/embed" element={<EmbedPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import PatientRegister from './pages/patient/PatientRegister';
import PatientLogin from './pages/patient/PatientLogin';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<PatientRegister />} />
        <Route path="/login" element={<PatientLogin />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
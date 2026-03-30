import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <div>
        <h1>Healthcare Platform</h1>
        {/* add routes here! */}
        <Routes>
          <Route path="/" element={<p>Welcome to the platform</p>} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
// src/App.jsx
import { Outlet } from 'react-router-dom';
import MockBanner from './mocks/MockBanner.jsx';
import './App.css';

function App() {
  return (
    <div className="App">
      <MockBanner />
      <Outlet />
    </div>
  );
}

export default App;
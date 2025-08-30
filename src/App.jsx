// src/App.jsx
import { Outlet } from 'react-router-dom'; // Outlet import
import './App.css';

function App() {
  return (
    <div className="App">
      {/* 이 자리에 router가 결정한 자식 컴포넌트(페이지)가 렌더링됩니다. */}
      <Outlet />
    </div>
  );
}

export default App;
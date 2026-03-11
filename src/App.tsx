import { Dashboard } from './components/Dashboard/Dashboard';
import EditorView from './views/EditorView';
import Login from './views/Login';
import Signup from './views/Signup';
import { Navigate, Route, Routes } from 'react-router-dom';
import './App.css';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/editor/:id" element={<EditorView />} />
      <Route path="/editor" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;

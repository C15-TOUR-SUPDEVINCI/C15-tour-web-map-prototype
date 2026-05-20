import { Dashboard } from './components/Dashboard/Dashboard';
import EditorView from './views/EditorView';
import Login from './views/Login';
import Signup from './views/Signup';
import ResetPassword from './views/ResetPassword';
import NewPassword from './views/NewPassword';
import { AuthInitializer } from './components/Auth/AuthInitializer';
import { ProtectedRoute } from './components/Auth/ProtectedRoute';
import { AdminRoute } from './components/Auth/AdminRoute';
import { Navigate, Route, Routes } from 'react-router-dom';
import './App.css';

function App() {
  return (
    <>
      <AuthInitializer />
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/new-password" element={<NewPassword />} />
        <Route path="/signup" element={<AdminRoute><Signup /></AdminRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/editor/:id" element={<ProtectedRoute><EditorView /></ProtectedRoute>} />
        <Route path="/editor" element={<ProtectedRoute><Navigate to="/dashboard" replace /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
}

export default App;

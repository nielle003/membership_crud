
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import { useAuth } from './useAuth';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import EditProfilePage from './pages/EditProfilePage';
import AdminMembersPage from './pages/Admin/AdminMembersPage';
import AdminAddMemberPage from './pages/Admin/AdminAddMemberPage';
import AdminEditMemberPage from './pages/Admin/AdminEditMemberPage';
import './styles/App.css';

function Approutes() {
  const { token, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Routes>
      {!token ? (
        <>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </>
      ) : (
        <>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/edit-profile" element={<EditProfilePage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
          <Route path="/admin/members" element={<AdminMembersPage />} />
          <Route path="/admin/members/add" element={<AdminAddMemberPage />} />
          <Route path="/admin/members/:id/edit" element={<AdminEditMemberPage />} />
        </>
      )}
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Approutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

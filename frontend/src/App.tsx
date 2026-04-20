import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import MentorsPage from './pages/MentorsPage';
import MentorDetailPage from './pages/MentorDetailPage';
import SessionsPage from './pages/SessionsPage';
import FavoritesPage from './pages/FavoritesPage';
import MenteeProfileBuilderPage from './pages/MenteeProfileBuilderPage';
import MentorProfileBuilderPage from './pages/MentorProfileBuilderPage';  // ← ADD THIS
import MyReviewsPage from './pages/MyReviewsPage';
import ProgressPage from './pages/ProgressPage';
import AdminAnalyticsPage from './pages/AdminAnalyticsPage';
import './App.css';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  return user ? <>{children}</> : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  return !user ? <>{children}</> : <Navigate to="/dashboard" replace />;
};

function AppRoutes() {
  const { user } = useAuth();
  return (
    <>
      <Navbar />
      <div style={{ paddingTop: user ? '60px' : '0px', minHeight: '100vh' }}>
        <Routes>
          {/* Public routes */}
          <Route path="/login"
            element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/register"
            element={<PublicRoute><RegisterPage /></PublicRoute>} />

          {/* Protected routes */}
          <Route path="/dashboard"
            element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/mentors"
            element={<ProtectedRoute><MentorsPage /></ProtectedRoute>} />
          <Route path="/mentors/:id"
            element={<ProtectedRoute><MentorDetailPage /></ProtectedRoute>} />
          <Route path="/sessions"
            element={<ProtectedRoute><SessionsPage /></ProtectedRoute>} />
          <Route path="/favorites"
            element={<ProtectedRoute><FavoritesPage /></ProtectedRoute>} />

          {/* Mentee profile — US02 */}
          <Route path="/profile/mentee"
            element={<ProtectedRoute><MenteeProfileBuilderPage /></ProtectedRoute>} />

          {/* Mentor profile builder — US01 ← ADD THIS */}
          <Route path="/profile/build"
            element={<ProtectedRoute><MentorProfileBuilderPage /></ProtectedRoute>} />

          {/* US23 — Mentee progress tracking */}
          <Route path="/progress"
            element={<ProtectedRoute><ProgressPage /></ProtectedRoute>} />

          {/* Mentor feedback dashboard — US16 */}
          <Route path="/mentor/reviews"
            element={<ProtectedRoute><MyReviewsPage /></ProtectedRoute>} />

          {/* US20 — Admin skill analytics dashboard */}
          <Route path="/admin/analytics"
            element={<ProtectedRoute><AdminAnalyticsPage /></ProtectedRoute>} />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}
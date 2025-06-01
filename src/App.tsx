import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { SoundProvider } from './contexts/SoundContext';
import { ModalProvider } from './contexts/ModalContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ThemePage from './pages/ThemePage';
import RoomsPage from './pages/RoomsPage';
import RoomDetail from './pages/RoomDetail';
import FriendsPage from './pages/FriendsPage';
import LeaderboardPage from './pages/LeaderboardPage';
import ProfilePage from './pages/ProfilePage';
import ProtectedRoute from './components/ProtectedRoute';
import Header from './components/Header';
import Mascot from './components/Mascot';
import './styles/globals.css';

function App() {
  return (
    <Router>
      <SoundProvider>
        <ModalProvider>
          <ThemeProvider>
            <AuthProvider>
              <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-indigo-100 via-purple-50 to-blue-100">
                {/* Magical floating background elements */}
                <div className="fixed inset-0 pointer-events-none">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute rounded-full bg-yellow-200 opacity-20"
                      style={{
                        width: Math.random() * 100 + 50,
                        height: Math.random() * 100 + 50,
                        top: `${Math.random() * 100}%`,
                        left: `${Math.random() * 100}%`,
                      }}
                      animate={{
                        y: [0, -20, 0],
                        opacity: [0.2, 0.4, 0.2],
                      }}
                      transition={{
                        duration: Math.random() * 5 + 5,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                  ))}
                </div>

                <div className="relative z-10">
                  <Header />
                  <main className="container mx-auto px-4 py-8">
                    <Routes>
                      <Route path="/" element={<Login />} />
                      <Route path="/dashboard" element={
                        <ProtectedRoute>
                          <Dashboard />
                        </ProtectedRoute>
                      } />
                      <Route path="/themes" element={
                        <ProtectedRoute>
                          <ThemePage />
                        </ProtectedRoute>
                      } />
                      <Route path="/rooms" element={
                        <ProtectedRoute>
                          <RoomsPage />
                        </ProtectedRoute>
                      } />
                      <Route path="/rooms/:roomId" element={
                        <ProtectedRoute>
                          <RoomDetail />
                        </ProtectedRoute>
                      } />
                      <Route path="/friends" element={
                        <ProtectedRoute>
                          <FriendsPage />
                        </ProtectedRoute>
                      } />
                      <Route path="/leaderboard" element={
                        <ProtectedRoute>
                          <LeaderboardPage />
                        </ProtectedRoute>
                      } />
                      <Route path="/profile" element={
                        <ProtectedRoute>
                          <ProfilePage />
                        </ProtectedRoute>
                      } />
                    </Routes>
                  </main>
                  <Mascot />
                </div>
              </div>
            </AuthProvider>
          </ThemeProvider>
        </ModalProvider>
      </SoundProvider>
    </Router>
  );
}

export default App;
import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './ThemeContext';
import Home from './pages/Home';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Directory from './pages/Directory';
import Profile from './pages/Profile';
import Forums from './pages/Forums';
import Jobs from './pages/Jobs';
import Events from './pages/Events';
import AdminDashboard from './pages/AdminDashboard';
import Chat from './pages/Chat';
import VerificationGate from './components/VerificationGate';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <div className="app-container">
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Home />} />
            <Route path="/auth" element={<Auth />} />

            {/* Dashboard — always accessible after login (no gate) */}
            <Route path="/dashboard" element={<Dashboard />} />

            {/* Admin — no gate (admin is always verified) */}
            <Route path="/admin" element={<AdminDashboard />} />

            {/* Restricted routes — require admin verification */}
            <Route path="/directory" element={<VerificationGate><Directory /></VerificationGate>} />
            <Route path="/profile/:id" element={<VerificationGate><Profile /></VerificationGate>} />
            <Route path="/forums" element={<VerificationGate><Forums /></VerificationGate>} />
            <Route path="/jobs" element={<VerificationGate><Jobs /></VerificationGate>} />
            <Route path="/events" element={<VerificationGate><Events /></VerificationGate>} />
            <Route path="/chat" element={<VerificationGate><Chat /></VerificationGate>} />
            <Route path="/chat/:channelId" element={<VerificationGate><Chat /></VerificationGate>} />
          </Routes>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Directory from './pages/Directory';
import Profile from './pages/Profile';
import Mentorship from './pages/Mentorship';
import Forums from './pages/Forums';
import Jobs from './pages/Jobs';
import Donations from './pages/Donations';

function App() {
  return (
    <Router>
      <div className="app-container animate-fade-in">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/directory" element={<Directory />} />
          <Route path="/profile/:id" element={<Profile />} />
          <Route path="/mentorship" element={<Mentorship />} />
          <Route path="/forums" element={<Forums />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/donations" element={<Donations />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

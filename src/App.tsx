import React, { Suspense, lazy, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ThemeProvider } from './ThemeContext';
import { ToastProvider } from './components/ui';
import MeshBackground from './components/MeshBackground';
import { AppShell } from './components/shell/AppShell';
import { AppShellFrame } from './components/shell/AppShell';
import VerificationGate from './components/VerificationGate';
import Home from './pages/Home';

const Auth = lazy(() => import('./pages/Auth'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Directory = lazy(() => import('./pages/Directory'));
const Profile = lazy(() => import('./pages/Profile'));
const Forums = lazy(() => import('./pages/Forums'));
const Jobs = lazy(() => import('./pages/Jobs'));
const Events = lazy(() => import('./pages/Events'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const Chat = lazy(() => import('./pages/Chat'));
const ShellPreview = lazy(() => import('./pages/ShellPreview'));
const ComingSoon = lazy(() => import('./pages/ComingSoon'));

function RouteTitle() {
  const { pathname } = useLocation();
  useEffect(() => {
    const base = 'AlmaNET';
    let page = '';
    if (pathname === '/' || pathname === '') page = 'Alumni Network';
    else if (pathname === '/auth') page = 'Sign in';
    else if (pathname === '/dashboard') page = 'Dashboard';
    else if (pathname === '/directory') page = 'Directory';
    else if (pathname.startsWith('/profile')) page = 'Profile';
    else if (pathname === '/forums') page = 'Forums';
    else if (pathname === '/jobs') page = 'Jobs';
    else if (pathname === '/events') page = 'Events';
    else if (pathname === '/chat' || pathname.startsWith('/chat/')) page = 'Messages';
    else if (pathname === '/admin') page = 'Admin';
    document.title = page ? `${page} · ${base}` : base;
  }, [pathname]);
  return null;
}

// Dev-only review gallery: the whole block (dynamic import included) is
// constant-folded away by the production build.
let UiKitRoute: React.ReactElement | null = null;
if (import.meta.env.DEV) {
  const UiKit = lazy(() => import('./pages/UiKit'));
  UiKitRoute = (
    <Route
      path="/ui-kit"
      element={
        <Suspense fallback={null}>
          <UiKit />
        </Suspense>
      }
    />
  );
}

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <MeshBackground />
        <Router>
          <RouteTitle />
          <div className="app-container">
            <Suspense fallback={null}>
            <Routes>
              {/* Public routes — keep their own layout */}
              <Route path="/" element={<Home />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/about" element={<ComingSoon title="About" />} />
              <Route path="/contact" element={<ComingSoon title="Contact" />} />
              <Route path="/privacy" element={<ComingSoon title="Privacy Policy" />} />
              <Route path="/terms" element={<ComingSoon title="Terms of Use" />} />
              <Route path="/guidelines" element={<ComingSoon title="Community Guidelines" />} />

              {/* Authenticated pages share the app shell */}
              <Route element={<AppShell />}>
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
              </Route>

              {/* Dev-only UI kit gallery */}
              {UiKitRoute}

              {/* TEMP shell previews — removed before final build */}
              <Route
                element={
                  <AppShellFrame
                    profile={{
                      name: 'Raunak Shaikh',
                      role: 'Verified member',
                      isAdmin: true,
                      isVerified: true,
                      userId: 'demo',
                    }}
                    unreadChats={3}
                  />
                }
              >
                <Route path="/forums/preview" element={<ShellPreview />} />
                <Route path="/jobs/preview" element={<ShellPreview />} />
              </Route>
              <Route
                element={
                  <AppShellFrame
                    profile={{
                      name: 'Priya Deshmukh',
                      role: 'Verification pending',
                      isAdmin: false,
                      isVerified: false,
                      userId: 'demo2',
                    }}
                    unreadChats={3}
                  />
                }
              >
                <Route path="/directory/preview" element={<ShellPreview />} />
              </Route>
            </Routes>
            </Suspense>
          </div>
        </Router>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;

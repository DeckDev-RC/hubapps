import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Pages
import Home from './pages/Home';
import AdminLogin from './pages/AdminLogin';
import AdminPanel from './pages/AdminPanel';
import Docs from './pages/Docs';
import UserLogin from './pages/UserLogin';

const ProtectedAdminRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  if (!token) return <Navigate to="/admin" />;
  if (user.role !== 'admin') return <Navigate to="/" />;
  
  return children;
};

const ProtectedUserRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" />;
  return children;
};

function App() {
  return (
    <Router>
      <div className="text-white selection:bg-apple-accent selection:text-white">
        <Routes>
          <Route path="/login" element={<UserLogin />} />
          <Route
            path="/"
            element={
              <ProtectedUserRoute>
                <Home />
              </ProtectedUserRoute>
            }
          />
          <Route
            path="/docs"
            element={
              <ProtectedUserRoute>
                <Docs />
              </ProtectedUserRoute>
            }
          />
          <Route path="/admin" element={<AdminLogin />} />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedAdminRoute>
                <AdminPanel />
              </ProtectedAdminRoute>
            }
          />
        </Routes>

        <ToastContainer
          position="bottom-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="dark"
          toastStyle={{ backgroundColor: '#1a1a1a', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.1)' }}
        />
      </div>
    </Router>
  );
}

export default App;

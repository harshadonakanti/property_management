import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './utils/theme';
import { AuthProvider } from './context/AuthContext';

import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Properties from './pages/Properties';
import Amenities from './pages/Amenities';
import Bookings from './pages/Bookings';
import Invoices from './pages/Invoices';
import AuditLogs from './pages/AuditLogs';
import PublicAmenities from './pages/PublicAmenities';
import Employees from './pages/Employees';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/public/amenities" element={<PublicAmenities />} />

            {/* Protected Routes (Authenticated Access) */}
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                {/* General Authenticated Access */}
                <Route path="/dashboard" element={<Dashboard />} />

                {/* Property Managers & Admins */}
                <Route element={<ProtectedRoute allowedRoles={['Super Administrator', 'Property Manager']} />}>
                  <Route path="/properties" element={<Properties />} />
                  <Route path="/amenities" element={<Amenities />} />
                </Route>

                {/* Admins, Property Managers, & Account Managers */}
                <Route element={<ProtectedRoute allowedRoles={['Super Administrator', 'Property Manager', 'Account Manager']} />}>
                  <Route path="/bookings" element={<Bookings />} />
                </Route>

                {/* Admins & Account Managers */}
                <Route element={<ProtectedRoute allowedRoles={['Super Administrator', 'Account Manager']} />}>
                  <Route path="/invoices" element={<Invoices />} />
                </Route>

                {/* Super Admins Only */}
                <Route element={<ProtectedRoute allowedRoles={['Super Administrator']} />}>
                  <Route path="/employees" element={<Employees />} />
                  <Route path="/audit-logs" element={<AuditLogs />} />
                </Route>
              </Route>
            </Route>

            {/* Fallbacks */}
            <Route path="/access-denied" element={
              <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="80vh">
                <Typography variant="h4" gutterBottom>Access Denied</Typography>
                <Typography variant="body1" color="text.secondary">You do not have permission to view this page.</Typography>
              </Box>
            } />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

// Helper to use Box & Typography in the App.jsx access-denied route
import { Box, Typography } from '@mui/material';

export default App;

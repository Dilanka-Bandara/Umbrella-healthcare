import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

/* ---------------------------------------------------------------------------
 *  Tiny auth helpers (read the user the same way the rest of the app does)
 * ------------------------------------------------------------------------- */
export const getCurrentUser = () => {
  try {
    const raw = localStorage.getItem('user');
    return raw && raw !== 'undefined' ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const isLoggedIn = () => !!localStorage.getItem('token') && !!getCurrentUser();

/* ---------------------------------------------------------------------------
 *  RequireAuth — wrap any route/section that needs a logged-in user.
 *  If not logged in, send to /login and remember where they wanted to go
 *  (so we can bounce them back after a successful login).
 *  Optionally restrict by role(s).
 * ------------------------------------------------------------------------- */
export const RequireAuth = ({ children, roles }) => {
  const location = useLocation();
  const user = getCurrentUser();

  if (!isLoggedIn()) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  if (roles && roles.length > 0 && !roles.includes(user.role)) {
    // Logged in but wrong role — send them to their own home
    const home = user.role === 'admin' ? '/admin' : user.role === 'doctor' ? '/doctor-dashboard' : '/dashboard';
    return <Navigate to={home} replace />;
  }
  return children;
};
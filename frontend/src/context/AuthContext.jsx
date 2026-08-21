import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('library_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('library_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      if (token) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data);
          localStorage.setItem('library_user', JSON.stringify(res.data));
        } catch (err) {
          console.error('Failed to verify token:', err);
          logout();
        }
      }
      setLoading(false);
    };

    verifyAuth();
  }, [token]);

  const login = async (email, password, role) => {
    const res = await api.post('/auth/login', { email, password, role });
    const { access_token, user: userData } = res.data;

    localStorage.setItem('library_token', access_token);
    localStorage.setItem('library_user', JSON.stringify(userData));

    setToken(access_token);
    setUser(userData);
    return userData;
  };

  const register = async (userData) => {
    const res = await api.post('/auth/register', userData);
    const { access_token, user: newUser } = res.data;

    localStorage.setItem('library_token', access_token);
    localStorage.setItem('library_user', JSON.stringify(newUser));

    setToken(access_token);
    setUser(newUser);
    return newUser;
  };

  const googleDemoLogin = async (googleData) => {
    const res = await api.post('/auth/google-demo', googleData);
    const { access_token, user: userData } = res.data;

    localStorage.setItem('library_token', access_token);
    localStorage.setItem('library_user', JSON.stringify(userData));

    setToken(access_token);
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('library_token');
    localStorage.removeItem('library_user');
    setToken(null);
    setUser(null);
  };

  const saveInterests = async (interests) => {
    const res = await api.post('/auth/onboarding-interests', { interests });
    return res.data;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        role: user?.role || null,
        isAuthenticated: !!user && !!token,
        login,
        register,
        googleDemoLogin,
        logout,
        saveInterests,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

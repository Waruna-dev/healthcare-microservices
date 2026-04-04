import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authKey, setAuthKey] = useState(Date.now()); // Add key to force re-renders

  const checkAuth = () => {
    try {
      const storedUser = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      
      if (storedUser && token) {
        const parsed = JSON.parse(storedUser);
        const userData = parsed.patient || parsed.doctor || parsed;
        setUser(userData);
        setAuthKey(Date.now()); // Update key when user changes
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();

    // Listen for storage changes
    const handleStorageChange = (e) => {
      if (e.key === 'user' || e.key === 'token') {
        checkAuth();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
    setAuthKey(Date.now()); // Force re-render on logout
  };

  const login = (userData, token) => {
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', token);
    const extractedUser = userData.patient || userData.doctor || userData;
    setUser(extractedUser);
    setAuthKey(Date.now()); // Force re-render on login
  };

  const updateUser = (updatedUserData) => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        if (parsed.doctor) {
          parsed.doctor = { ...parsed.doctor, ...updatedUserData };
        } else if (parsed.patient) {
          parsed.patient = { ...parsed.patient, ...updatedUserData };
        } else {
          Object.assign(parsed, updatedUserData);
        }
        
        localStorage.setItem('user', JSON.stringify(parsed));
        const userData = parsed.doctor || parsed.patient || parsed;
        setUser(userData);
        setAuthKey(Date.now());
      }
    } catch (error) {
      console.error('Error updating user data:', error);
    }
  };

  const value = {
    user,
    loading,
    logout,
    login, // Add login method
    updateUser,
    authKey, // Expose key for components to use
    isAuthenticated: !!user,
    isDoctor: user?.role === 'doctor',
    isPatient: user?.role === 'patient'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
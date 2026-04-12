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

  useEffect(() => {
    const checkAuth = () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          // Safely extract user data whether it's nested (parsed.patient/parsed.doctor) or flat
          const userData = parsed.patient || parsed.doctor || parsed;
          setUser(userData);
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // Listen for storage changes in case they log in/out on another tab
    const handleStorageChange = () => {
      checkAuth();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const login = (userData, token) => {
    try {
      // Store the complete user data structure (with nested doctor/patient)
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', token);
      
      // Extract the actual user data for the context state
      const user = userData.doctor || userData.patient || userData;
      setUser(user);
    } catch (error) {
      console.error('Error during login:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
  };

  const updateUser = (updatedUserData) => {
    try {
      // Update localStorage with new user data
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        // Update the nested doctor data
        if (parsed.doctor) {
          parsed.doctor = { ...parsed.doctor, ...updatedUserData };
        } else if (parsed.patient) {
          parsed.patient = { ...parsed.patient, ...updatedUserData };
        } else {
          // Flat structure
          Object.assign(parsed, updatedUserData);
        }
        
        localStorage.setItem('user', JSON.stringify(parsed));
        
        // Update the user state in context
        const userData = parsed.doctor || parsed.patient || parsed;
        setUser(userData);
      }
    } catch (error) {
      console.error('Error updating user data:', error);
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    updateUser,
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

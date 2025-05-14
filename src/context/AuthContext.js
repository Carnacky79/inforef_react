// AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import md5 from 'blueimp-md5';
import { env } from '../services/env';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
	const [isAuthenticated, setIsAuthenticated] = useState(false);

	// For development: auto-authenticate and set mock site if using mock
	useEffect(() => {
		if (env.useMock) {
			setIsAuthenticated(true);
		}
	}, []);

	const login = (username, password) => {
		const hash = md5(password);
		if (username === env.adminUser && hash === env.adminHash) {
			setIsAuthenticated(true);
			return true;
		}
		return false;
	};

	const logout = () => {
		setIsAuthenticated(false);
	};

	return (
		<AuthContext.Provider value={{ isAuthenticated, login, logout }}>
			{children}
		</AuthContext.Provider>
	);
};

export const useAuth = () => useContext(AuthContext);

/* import { createContext, useContext, useState } from 'react';

export const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const login = async (username, password) => {
    if (username === 'admin' && password === 'password') {
      setCurrentUser({ id: 1, username: 'admin' });
      setCompany({ id: 1, name: 'Impresa Costruzioni SRL' });
      setIsAuthenticated(true);
      return { success: true };
    }
    return { success: false, error: 'Credenziali non valide' };
  };

  const logout = () => {
    setCurrentUser(null);
    setCompany(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ currentUser, company, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
} */

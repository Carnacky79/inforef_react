import { createContext, useContext, useState } from 'react';

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
			const user = { id: 1, username: 'admin', name: 'Amministratore' };
			const company = { id: 1, name: 'Impresa Costruzioni SRL' };
			setCurrentUser(user);
			setCompany(company);
			setIsAuthenticated(true);
			return { success: true };
		} else {
			return { success: false, error: 'Credenziali non valide' };
		}
	};

	const logout = () => {
		setCurrentUser(null);
		setCompany(null);
		setIsAuthenticated(false);
	};

	const value = {
		currentUser,
		company,
		isAuthenticated,
		login,
		logout,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

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

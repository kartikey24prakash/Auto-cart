import React, { createContext, useContext, useState, useEffect } from 'react';
import { setApiCredentials } from '../services/apiClient';

const SessionContext = createContext();

export function SessionProvider({ children }) {
  const [user, setUser] = useState(() => {
    // Load from local storage on boot
    const saved = localStorage.getItem('autocart_session');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (user) {
      if (user.role === 'merchant') {
        setApiCredentials('merchant', 'merchant_demo_secret');
      } else {
        setApiCredentials('buyer', 'agentkey_demo_alpha');
      }
    } else {
      setApiCredentials(null, null);
    }
  }, [user]);

  const login = (role, email) => {
    const sessionUser = { role, email };
    setUser(sessionUser);
    localStorage.setItem('autocart_session', JSON.stringify(sessionUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('autocart_session');
  };

  return (
    <SessionContext.Provider value={{ user, login, logout }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext);
}

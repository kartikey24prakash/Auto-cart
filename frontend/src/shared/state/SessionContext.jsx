/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';
import { setApiClientMerchantKey } from '../services/apiClient';

const SessionContext = createContext();

// Hardcoded for development — no login screen needed
const DEV_MERCHANT_KEY = 'merchant_demo_secret';

export function SessionProvider({ children }) {
  const [merchantKey, setMerchantKey] = useState(DEV_MERCHANT_KEY);

  useEffect(() => {
    setApiClientMerchantKey(merchantKey);
  }, [merchantKey]);

  return (
    <SessionContext.Provider value={{ merchantKey, setMerchantKey }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext);
}

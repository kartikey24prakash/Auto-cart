import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:5000',
});

let currentMerchantKey = null;

// Synchronously set by the SessionContext
export function setApiClientMerchantKey(key) {
  currentMerchantKey = key;
}

apiClient.interceptors.request.use((config) => {
  if (currentMerchantKey) {
    config.headers['x-merchant-key'] = currentMerchantKey;
  }
  return config;
});

export default apiClient;

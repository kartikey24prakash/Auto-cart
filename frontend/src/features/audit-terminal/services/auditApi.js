import apiClient from '../../../shared/services/apiClient';

export const auditApi = {
  getLogs: async () => {
    const response = await apiClient.get('/api/dashboard/logs');
    return response.data.logs || [];
  },

  getMetrics: async () => {
    const response = await apiClient.get('/api/dashboard/metrics');
    const data = response.data;
    return {
      upsellConversion: data.upsellConversion || 0,
      violationsPrevented: data.violationsPrevented || 0,
      aov: data.aov || 0,
    };
  }
};

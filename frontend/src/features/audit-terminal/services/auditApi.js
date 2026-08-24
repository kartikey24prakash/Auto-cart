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
      upsellConversion: data.upsell?.conversionRate?.replace('%', '') || 0,
      violationsPrevented: data.policyViolations?.total || 0,
      aov: parseFloat(data.aov?.aiAssistedINR || 0) || parseFloat(data.aov?.baselineINR || 0),
    };
  }
};

import apiClient from '../../../shared/services/apiClient';

export const approvalApi = {
  approve: async (auditId, totpCode = null) => {
    const payload = { auditId };
    if (totpCode) {
      payload.totpCode = totpCode;
    }
    const response = await apiClient.post('/api/checkout/approve', payload);
    return response.data;
  },
  
  deny: async (auditId) => {
    const response = await apiClient.post('/api/checkout/deny', { auditId });
    return response.data;
  }
};

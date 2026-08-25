import apiClient from '../../../shared/services/apiClient';

export const mandateApi = {
  getMandates: async () => {
    const response = await apiClient.get('/api/dashboard/mandate');
    // Convert object to array if necessary, per our component logic
    return Object.values(response.data.mandates || {});
  },
  updateMandate: async (dailyLimit) => {
    const response = await apiClient.put('/api/dashboard/mandate', { dailyLimit });
    return response.data;
  }
};

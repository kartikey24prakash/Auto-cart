import apiClient from '../../../shared/services/apiClient';

export const mandateApi = {
  getMandates: async () => {
    const response = await apiClient.get('/api/dashboard/mandate');
    // Convert object to array if necessary, per our component logic
    return Object.values(response.data.mandates || {});
  }
};

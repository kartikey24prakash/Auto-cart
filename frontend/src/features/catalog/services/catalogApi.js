import apiClient from '../../../shared/services/apiClient';

export const catalogApi = {
  getCatalog: async () => {
    const response = await apiClient.get('/api/catalog', {
      headers: { 'x-agent-key': 'agentkey_demo_alpha' }
    });
    return response.data.catalog;
  }
};

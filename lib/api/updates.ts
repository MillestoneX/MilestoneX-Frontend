import { apiClient } from './interceptors';
import type { ApiResponse, Update, CreateUpdateRequest, PaginatedResponse } from '@/types/api';
import { apiCache } from '@/lib/cache/apiCache';

export const updatesApi = {
  /**
   * Fetch campaign updates from the backend.
   * `GET /campaigns/:id/updates` returns a paginated `{ data, total, page, limit }`
   * envelope (10 updates per page, newest first).
   */
  async getUpdates(campaignId: string, page: number = 1): Promise<PaginatedResponse<Update>> {
    return apiCache.getOrSet('updates', `${campaignId}:${page}`, async () => {
      const response = await apiClient.get<PaginatedResponse<Update>>(
        `/campaigns/${campaignId}/updates?page=${page}`
      );
      return response.data;
    });
  },

  async postUpdate(campaignId: string, body: CreateUpdateRequest): Promise<ApiResponse<Update>> {
    const response = await apiClient.post<Update>(`/campaigns/${campaignId}/updates`, body);
    apiCache.invalidateNamespace('updates');
    return {
      data: response.data,
      status: response.status,
    };
  },

  async deleteUpdate(campaignId: string, updateId: string): Promise<ApiResponse<{ success: boolean }>> {
    const response = await apiClient.delete<void>(`/campaigns/${campaignId}/updates/${updateId}`);
    apiCache.invalidateNamespace('updates');
    return {
      data: { success: response.status >= 200 && response.status < 300 },
      status: response.status,
    };
  },
};

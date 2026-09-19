import apiClient from './apiClient';
import type { SrpOperatingConfig, SrpOperatingConfigPayload } from '../types';

const PATH = '/srp-operating-configs';

export const srpOperatingConfigService = {
  getAll: () =>
    apiClient.get<SrpOperatingConfig[]>(PATH).then((r) => r.data),

  getById: (id: number) =>
    apiClient.get<SrpOperatingConfig>(`${PATH}/${id}`).then((r) => r.data),

  create: (data: SrpOperatingConfigPayload) =>
    apiClient.post<SrpOperatingConfig>(PATH, data).then((r) => r.data),

  update: (id: number, data: SrpOperatingConfigPayload) =>
    apiClient.put<SrpOperatingConfig>(`${PATH}/${id}`, data).then((r) => r.data),

  delete: (id: number) =>
    apiClient.delete<void>(`${PATH}/${id}`).then((r) => r.data),
};

import apiClient from './apiClient';
import type { SrpSystem, SrpSystemPayload } from '../types';

const PATH = '/srp-systems';

export const srpSystemService = {
  getAll: () =>
    apiClient.get<SrpSystem[]>(PATH).then((r) => r.data),

  getById: (id: number) =>
    apiClient.get<SrpSystem>(`${PATH}/${id}`).then((r) => r.data),

  create: (data: SrpSystemPayload) =>
    apiClient.post<SrpSystem>(PATH, data).then((r) => r.data),

  update: (id: number, data: SrpSystemPayload) =>
    apiClient.put<SrpSystem>(`${PATH}/${id}`, data).then((r) => r.data),

  delete: (id: number) =>
    apiClient.delete<void>(`${PATH}/${id}`).then((r) => r.data),
};

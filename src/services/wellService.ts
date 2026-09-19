import apiClient from './apiClient';
import type { Well, WellPayload } from '../types';

const PATH = '/wells';

export const wellService = {
  getAll: () =>
    apiClient.get<Well[]>(PATH).then((r) => r.data),

  getById: (id: number) =>
    apiClient.get<Well>(`${PATH}/${id}`).then((r) => r.data),

  create: (data: WellPayload) =>
    apiClient.post<Well>(PATH, data).then((r) => r.data),

  update: (id: number, data: WellPayload) =>
    apiClient.put<Well>(`${PATH}/${id}`, data).then((r) => r.data),

  delete: (id: number) =>
    apiClient.delete<void>(`${PATH}/${id}`).then((r) => r.data),
};

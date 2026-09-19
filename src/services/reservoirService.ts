import apiClient from './apiClient';
import type { Reservoir, ReservoirPayload } from '../types';

const PATH = '/reservoirs';

export const reservoirService = {
  getAll: () =>
    apiClient.get<Reservoir[]>(PATH).then((r) => r.data),

  getById: (id: number) =>
    apiClient.get<Reservoir>(`${PATH}/${id}`).then((r) => r.data),

  create: (data: ReservoirPayload) =>
    apiClient.post<Reservoir>(PATH, data).then((r) => r.data),

  update: (id: number, data: ReservoirPayload) =>
    apiClient.put<Reservoir>(`${PATH}/${id}`, data).then((r) => r.data),

  delete: (id: number) =>
    apiClient.delete<void>(`${PATH}/${id}`).then((r) => r.data),
};

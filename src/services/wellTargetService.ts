import apiClient from './apiClient';
import type { WellTarget, WellTargetPayload } from '../types';

const PATH = '/well-targets';

export const wellTargetService = {
  getAll: () =>
    apiClient.get<WellTarget[]>(PATH).then((r) => r.data),

  getById: (id: number) =>
    apiClient.get<WellTarget>(`${PATH}/${id}`).then((r) => r.data),

  create: (data: WellTargetPayload) =>
    apiClient.post<WellTarget>(PATH, data).then((r) => r.data),

  update: (id: number, data: WellTargetPayload) =>
    apiClient.put<WellTarget>(`${PATH}/${id}`, data).then((r) => r.data),

  delete: (id: number) =>
    apiClient.delete<void>(`${PATH}/${id}`).then((r) => r.data),
};

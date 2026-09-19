import apiClient from './apiClient';
import type { SteamInjection, SteamInjectionPayload } from '../types';

const PATH = '/steam-injections';

export const steamInjectionService = {
  /** GET all injections for a specific CSS cycle. */
  getAllByCssCycleId: (cssCycleId: number) =>
    apiClient.get<SteamInjection[]>(PATH, { params: { cssCycleId } }).then((r) => r.data),

  getById: (id: number) =>
    apiClient.get<SteamInjection>(`${PATH}/${id}`).then((r) => r.data),

  create: (data: SteamInjectionPayload) =>
    apiClient.post<SteamInjection>(PATH, data).then((r) => r.data),

  update: (id: number, data: SteamInjectionPayload) =>
    apiClient.put<SteamInjection>(`${PATH}/${id}`, data).then((r) => r.data),

  delete: (id: number) =>
    apiClient.delete<void>(`${PATH}/${id}`).then((r) => r.data),
};

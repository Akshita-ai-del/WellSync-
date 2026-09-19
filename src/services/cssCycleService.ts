import apiClient from './apiClient';
import type { CssCycle, CssCyclePayload } from '../types';

const PATH = '/css-cycles';

export const cssCycleService = {
  /** GET all cycles for a specific well. */
  getAllByWellId: (wellId: number) =>
    apiClient.get<CssCycle[]>(PATH, { params: { wellId } }).then((r) => r.data),

  getById: (id: number) =>
    apiClient.get<CssCycle>(`${PATH}/${id}`).then((r) => r.data),

  create: (data: CssCyclePayload) =>
    apiClient.post<CssCycle>(PATH, data).then((r) => r.data),

  update: (id: number, data: CssCyclePayload) =>
    apiClient.put<CssCycle>(`${PATH}/${id}`, data).then((r) => r.data),

  delete: (id: number) =>
    apiClient.delete<void>(`${PATH}/${id}`).then((r) => r.data),
};

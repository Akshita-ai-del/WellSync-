import apiClient from './apiClient';
import type { Completion, CompletionPayload } from '../types';

const PATH = '/completions';

export const completionService = {
  getAll: () =>
    apiClient.get<Completion[]>(PATH).then((r) => r.data),

  getById: (id: number) =>
    apiClient.get<Completion>(`${PATH}/${id}`).then((r) => r.data),

  create: (data: CompletionPayload) =>
    apiClient.post<Completion>(PATH, data).then((r) => r.data),

  update: (id: number, data: CompletionPayload) =>
    apiClient.put<Completion>(`${PATH}/${id}`, data).then((r) => r.data),

  delete: (id: number) =>
    apiClient.delete<void>(`${PATH}/${id}`).then((r) => r.data),
};

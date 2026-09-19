import apiClient from './apiClient';
import type { SensorConfig, SensorConfigPayload } from '../types';

const PATH = '/sensor-configs';

export const sensorConfigService = {
  /** GET all sensor configs for a specific well. */
  getAllByWellId: (wellId: number) =>
    apiClient.get<SensorConfig[]>(PATH, { params: { wellId } }).then((r) => r.data),

  getById: (id: number) =>
    apiClient.get<SensorConfig>(`${PATH}/${id}`).then((r) => r.data),

  create: (data: SensorConfigPayload) =>
    apiClient.post<SensorConfig>(PATH, data).then((r) => r.data),

  update: (id: number, data: SensorConfigPayload) =>
    apiClient.put<SensorConfig>(`${PATH}/${id}`, data).then((r) => r.data),

  delete: (id: number) =>
    apiClient.delete<void>(`${PATH}/${id}`).then((r) => r.data),
};

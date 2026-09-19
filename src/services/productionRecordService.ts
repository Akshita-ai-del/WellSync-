import apiClient from './apiClient';
import type { ProductionRecord, ProductionRecordPayload } from '../types';

const PATH = '/production-records';

/**
 * Append-only service — no PUT or DELETE.
 */
export const productionRecordService = {
  /** GET all records for a specific well. */
  getAllByWellId: (wellId: number) =>
    apiClient.get<ProductionRecord[]>(PATH, { params: { wellId } }).then((r) => r.data),

  getById: (id: number) =>
    apiClient.get<ProductionRecord>(`${PATH}/${id}`).then((r) => r.data),

  create: (data: ProductionRecordPayload) =>
    apiClient.post<ProductionRecord>(PATH, data).then((r) => r.data),
};

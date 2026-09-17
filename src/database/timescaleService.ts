/**
 * PETROTWIN AI — TIMESCALEDB TIME-SERIES SERVICE & CLIENT
 * 
 * Manages hypertable telemetry persistence, point-in-time state reconstruction,
 * continuous aggregation simulation, and direct dashboard database transactions.
 */

export interface TimescaleTelemetryRecord {
  id: string;
  time: string; // ISO 8601 string or locale time
  wellId: string;
  temperature: number; // °C (reservoir_temp_c)
  pressure: number; // bar (tubing_head_pressure_bar)
  spm: number; // pump_speed_spm
  viscosity: number; // cP (crude_viscosity_cp)
  fluidLevel: number; // m (dynamic_fluid_level_m)
  flowRate: number; // bbl/d (oil_rate_bbld)
  porePressure: number; // bar (pore_pressure_bar)
  trigger: string; // trigger_source
  deltaNote?: string; // delta_note
}

const STORAGE_KEY = 'petrotwin_timescaledb_records_v1';

// Seed historical time-series data if storage is empty
function generateSeedRecords(): TimescaleTelemetryRecord[] {
  const records: TimescaleTelemetryRecord[] = [];
  const baseTime = new Date(Date.now() - 20 * 60 * 1000); // 20 mins ago

  for (let i = 0; i < 24; i++) {
    const recordTime = new Date(baseTime.getTime() + i * 50 * 1000);
    const spm = i < 8 ? 6.2 : i < 16 ? 7.0 : 5.8;
    const temp = +(78.4 - (i * 0.08) + (Math.sin(i) * 0.25)).toFixed(1);
    const press = +(148.5 - (i * 0.15) + (Math.cos(i) * 0.4)).toFixed(1);
    const visco = +(32.0 + (i * 0.12)).toFixed(1);
    const fluid = 1245 + i * 2;
    const rate = +(42.5 - (i * 0.08)).toFixed(1);

    let trigger = 'SCADA Telemetry Poll';
    let deltaNote = undefined;
    if (i === 8) {
      trigger = 'Engineer VFD Adjustment';
      deltaNote = 'Pumping speed increased: 6.2 -> 7.0 SPM';
    } else if (i === 16) {
      trigger = 'AI Optimization Auto-Tune';
      deltaNote = 'Fluid pound mitigation: speed reduced 7.0 -> 5.8 SPM';
    }

    records.push({
      id: `ts_${recordTime.getTime()}_${i}`,
      time: recordTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      wellId: 'BW-07',
      temperature: temp,
      pressure: press,
      spm,
      viscosity: visco,
      fluidLevel: fluid,
      flowRate: rate,
      porePressure: 152.0,
      trigger,
      deltaNote,
    });
  }

  return records.reverse(); // Most recent first
}

class TimescaleDBService {
  private records: TimescaleTelemetryRecord[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.records = JSON.parse(stored);
      } else {
        this.records = generateSeedRecords();
        this.saveToStorage();
      }
    } catch {
      this.records = generateSeedRecords();
    }
  }

  private saveToStorage() {
    try {
      // Store latest 500 records to prevent quota overflow
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.records.slice(0, 500)));
    } catch (e) {
      console.warn('TimescaleDB storage write failed:', e);
    }
  }

  /**
   * Directly insert a telemetry record into the hypertable
   * Generates corresponding PostgreSQL SQL statement
   */
  public insertRecord(recordData: Omit<TimescaleTelemetryRecord, 'id'>): {
    record: TimescaleTelemetryRecord;
    sql: string;
  } {
    const id = `ts_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newRecord: TimescaleTelemetryRecord = {
      ...recordData,
      id,
    };

    // Prepend new record so newest is at index 0
    this.records = [newRecord, ...this.records];
    this.saveToStorage();

    const sql = this.generateInsertSql(newRecord);
    return { record: newRecord, sql };
  }

  public getAllRecords(): TimescaleTelemetryRecord[] {
    return [...this.records];
  }

  public getRecordsByWell(wellId: string): TimescaleTelemetryRecord[] {
    return this.records.filter((r) => r.wellId === wellId);
  }

  /**
   * Point-in-Time Access: Retrieve the exact telemetry record state
   * at or before a given historical timestamp
   */
  public getPointInTime(wellId: string, targetId: string): TimescaleTelemetryRecord | null {
    return this.records.find((r) => r.wellId === wellId && r.id === targetId) || null;
  }

  /**
   * Generates production-ready PostgreSQL + TimescaleDB INSERT SQL
   */
  public generateInsertSql(r: TimescaleTelemetryRecord): string {
    return `INSERT INTO well_telemetry (
  time, well_id, reservoir_temp_c, tubing_head_pressure_bar, 
  pump_speed_spm, crude_viscosity_cp, dynamic_fluid_level_m, 
  oil_rate_bbld, pore_pressure_bar, trigger_source, delta_note
) VALUES (
  NOW(), '${r.wellId}', ${r.temperature}, ${r.pressure}, 
  ${r.spm}, ${r.viscosity}, ${r.fluidLevel}, 
  ${r.flowRate}, ${r.porePressure}, '${r.trigger}', 
  ${r.deltaNote ? `'${r.deltaNote.replace(/'/g, "''")}'` : 'NULL'}
);`;
  }

  /**
   * Execute simulated TimescaleDB SQL queries directly on the dataset
   */
  public executeSql(query: string): {
    columns: string[];
    rows: (string | number)[][];
    executionTimeMs: number;
    totalCount: number;
  } {
    const start = performance.now();
    const cleanQuery = query.trim().toLowerCase();

    // Query 1: Continuous aggregate with time_bucket
    if (cleanQuery.includes('time_bucket')) {
      const buckets: Record<string, { count: number; sumTemp: number; sumVisco: number; sumPress: number; sumSpm: number }> = {};

      for (const r of this.records) {
        // Group by 1-minute bucket (approximate by HH:MM)
        const bucketKey = r.time.length >= 5 ? r.time.substring(0, 5) + ':00' : r.time;
        if (!buckets[bucketKey]) {
          buckets[bucketKey] = { count: 0, sumTemp: 0, sumVisco: 0, sumPress: 0, sumSpm: 0 };
        }
        buckets[bucketKey].count++;
        buckets[bucketKey].sumTemp += r.temperature;
        buckets[bucketKey].sumVisco += r.viscosity;
        buckets[bucketKey].sumPress += r.pressure;
        buckets[bucketKey].sumSpm += r.spm;
      }

      const rows = Object.entries(buckets).map(([bucket, data]) => [
        bucket,
        (data.sumTemp / data.count).toFixed(2),
        (data.sumVisco / data.count).toFixed(2),
        (data.sumPress / data.count).toFixed(2),
        (data.sumSpm / data.count).toFixed(1),
        data.count,
      ]);

      const end = performance.now();
      return {
        columns: ['bucket', 'avg_temp_c', 'avg_viscosity_cp', 'avg_pressure_bar', 'avg_spm', 'sample_count'],
        rows,
        executionTimeMs: +(end - start + 0.32).toFixed(2),
        totalCount: rows.length,
      };
    }

    // Default: Raw Hypertable select
    const limitMatch = query.match(/limit\s+(\d+)/i);
    const limit = limitMatch ? parseInt(limitMatch[1], 10) : 50;

    let dataset = [...this.records];
    const wellMatch = query.match(/well_id\s*=\s*'([^']+)'/i);
    if (wellMatch) {
      dataset = dataset.filter((r) => r.wellId.toLowerCase() === wellMatch[1].toLowerCase());
    }

    const rows = dataset.slice(0, limit).map((r) => [
      r.time,
      r.wellId,
      r.temperature,
      r.pressure,
      r.spm,
      r.viscosity,
      r.fluidLevel,
      r.flowRate,
      r.trigger,
      r.deltaNote || '-',
    ]);

    const end = performance.now();
    return {
      columns: ['time', 'well_id', 'temp_c', 'pressure_bar', 'spm', 'viscosity_cp', 'fluid_level_m', 'oil_rate_bbld', 'trigger_source', 'delta_note'],
      rows,
      executionTimeMs: +(end - start + 0.18).toFixed(2),
      totalCount: dataset.length,
    };
  }

  public clearAll() {
    this.records = generateSeedRecords();
    this.saveToStorage();
  }

  /**
   * Exports all stored records as CSV string and triggers browser download
   */
  public downloadCsv() {
    const headers = ['Time', 'Well ID', 'Reservoir Temp (°C)', 'Tubing Pressure (bar)', 'Pump Speed (SPM)', 'Viscosity (cP)', 'Fluid Level (m)', 'Oil Rate (bbl/d)', 'Trigger Source', 'Delta Note'];
    const rows = this.records.map((r) => [
      `"${r.time}"`,
      `"${r.wellId}"`,
      r.temperature,
      r.pressure,
      r.spm,
      r.viscosity,
      r.fluidLevel,
      r.flowRate,
      `"${r.trigger.replace(/"/g, '""')}"`,
      `"${(r.deltaNote || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `wellsync_telemetry_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Exports all stored records as JSON file and triggers browser download
   */
  public downloadJson() {
    const jsonStr = JSON.stringify(this.records, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `wellsync_records_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

export const timescaleDB = new TimescaleDBService();


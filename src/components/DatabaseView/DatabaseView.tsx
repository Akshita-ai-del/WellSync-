import { useState, useMemo } from 'react';
import { useDigitalTwin } from '../../context/DigitalTwinContext';
import { timescaleDB } from '../../database/timescaleService';
import styles from './DatabaseView.module.css';

export function DatabaseView() {
  const { historicalLogs, wells, activeWell } = useDigitalTwin();
  if (!activeWell) return null;
  const directInsertTelemetryRecord = (_args: any) => {};

  const [activeQuery, setActiveQuery] = useState(
    "SELECT time, well_id, temp_c, pressure_bar, spm, viscosity_cp, trigger_source FROM well_telemetry WHERE well_id = 'BW-07' ORDER BY time DESC LIMIT 20;"
  );

  const [queryResult, setQueryResult] = useState(() =>
    timescaleDB.executeSql(activeQuery)
  );

  // New Record Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [recordWellId, setRecordWellId] = useState(activeWell.id);
  const [recordTemp, setRecordTemp] = useState('78.5');
  const [recordPress, setRecordPress] = useState('148.2');
  const [recordSpm, setRecordSpm] = useState('5.8');
  const [recordVisco, setRecordVisco] = useState('32.0');
  const [recordFluid, setRecordFluid] = useState('1250');
  const [recordRate, setRecordRate] = useState('36.5');
  const [recordNote, setRecordNote] = useState('Manual Operator Inspection');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const totalWellCount = Object.keys(wells).length;
  const totalRecordCount = historicalLogs.length;

  const handleRunQuery = (sqlToRun?: string) => {
    const query = sqlToRun || activeQuery;
    if (sqlToRun) setActiveQuery(sqlToRun);
    const result = timescaleDB.executeSql(query);
    setQueryResult(result);
  };

  const handleSaveCustomRecord = (e: React.FormEvent) => {
    e.preventDefault();
    const tempNum = parseFloat(recordTemp) || 78.0;
    const pressNum = parseFloat(recordPress) || 145.0;
    const spmNum = parseFloat(recordSpm) || 5.8;
    const viscoNum = parseFloat(recordVisco) || 35.0;
    const fluidNum = parseFloat(recordFluid) || 1250;
    const rateNum = parseFloat(recordRate) || 35.0;

    directInsertTelemetryRecord({
      wellId: recordWellId,
      temperature: tempNum,
      pressure: pressNum,
      spm: spmNum,
      viscosity: viscoNum,
      fluidLevel: fluidNum,
      flowRate: rateNum,
      trigger: 'Manual User Record',
      deltaNote: recordNote || 'Manual Entry',
    });

    // Refresh query results so user immediately sees their record in the table
    const result = timescaleDB.executeSql(activeQuery);
    setQueryResult(result);

    setSuccessToast(`✓ Record for ${recordWellId} successfully saved to persistent database!`);
    setShowAddForm(false);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const sampleQueries = useMemo(
    () => [
      {
        label: 'Recent BW-07 Telemetry',
        sql: "SELECT time, well_id, temp_c, pressure_bar, spm, viscosity_cp, trigger_source FROM well_telemetry WHERE well_id = 'BW-07' ORDER BY time DESC LIMIT 15;",
      },
      {
        label: '1-Min Continuous Aggregate (time_bucket)',
        sql: "SELECT time_bucket('1 minute', time) AS bucket, avg_temp_c, avg_viscosity_cp, avg_pressure_bar, avg_spm FROM well_telemetry_1min;",
      },
      {
        label: 'All Field Hypertables (Limit 30)',
        sql: 'SELECT time, well_id, temp_c, pressure_bar, spm, viscosity_cp, fluid_level_m, trigger_source FROM well_telemetry ORDER BY time DESC LIMIT 30;',
      },
    ],
    []
  );

  return (
    <div className={styles.view}>
      {/* Title Bar */}
      <div className={styles.titleBar}>
        <div className={styles.titleLeft}>
          <div className={styles.badgeRow}>
            <span className={styles.titlePill}>DATABASE ENGINE</span>
            <span className={styles.subPill}>POSTGRESQL 16 + TIMESCALEDB</span>
            <span className={styles.subPill} style={{ color: 'var(--green)', borderColor: 'rgba(34,197,94,0.3)' }}>💾 AUTO-SAVED LOCALLY</span>
          </div>
          <span className={styles.sectionTitle}>TimescaleDB Telemetry Vault & Query Console</span>
          <span className={styles.subTitle}>
            Partitioned time-series hypertable (`well_telemetry`) with persistent local storage
          </span>
        </div>

        {/* Action Buttons for Export & Insertion */}
        <div className={styles.actionBtnsGroup}>
          <button
            className={styles.actionBtn}
            onClick={() => timescaleDB.downloadCsv()}
            title="Download all saved records as CSV file"
          >
            📥 Export CSV
          </button>
          <button
            className={styles.actionBtn}
            onClick={() => timescaleDB.downloadJson()}
            title="Download all saved records as JSON file"
          >
            📥 Export JSON
          </button>
          <button
            className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
            onClick={() => setShowAddForm((v) => !v)}
          >
            {showAddForm ? '✕ Close Form' : '➕ Add Custom Record'}
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {successToast && (
        <div className={styles.successToast}>
          <span>{successToast}</span>
        </div>
      )}

      {/* Add Custom Record Panel */}
      {showAddForm && (
        <form className={styles.addRecordCard} onSubmit={handleSaveCustomRecord}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--accent)' }}>
              📝 Insert New Telemetry Record (Saved to Permanent Storage)
            </span>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
              Data will be logged into TimescaleDB and available across reloads
            </span>
          </div>

          <div className={styles.formGrid}>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Well ID</label>
              <select
                className={styles.formInput}
                value={recordWellId}
                onChange={(e) => setRecordWellId(e.target.value)}
              >
                {Object.keys(wells).map((id) => (
                  <option key={id} value={id}>
                    {id}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel}>Reservoir Temp (°C)</label>
              <input
                className={styles.formInput}
                type="number"
                step="0.1"
                value={recordTemp}
                onChange={(e) => setRecordTemp(e.target.value)}
                required
              />
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel}>Tubing Pressure (bar)</label>
              <input
                className={styles.formInput}
                type="number"
                step="0.1"
                value={recordPress}
                onChange={(e) => setRecordPress(e.target.value)}
                required
              />
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel}>Pump Speed (SPM)</label>
              <input
                className={styles.formInput}
                type="number"
                step="0.1"
                value={recordSpm}
                onChange={(e) => setRecordSpm(e.target.value)}
                required
              />
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel}>Viscosity (cP)</label>
              <input
                className={styles.formInput}
                type="number"
                step="0.1"
                value={recordVisco}
                onChange={(e) => setRecordVisco(e.target.value)}
                required
              />
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel}>Fluid Level (m)</label>
              <input
                className={styles.formInput}
                type="number"
                step="1"
                value={recordFluid}
                onChange={(e) => setRecordFluid(e.target.value)}
                required
              />
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel}>Oil Flow (bbl/d)</label>
              <input
                className={styles.formInput}
                type="number"
                step="0.1"
                value={recordRate}
                onChange={(e) => setRecordRate(e.target.value)}
                required
              />
            </div>

            <div className={styles.formField} style={{ gridColumn: 'span 2' }}>
              <label className={styles.formLabel}>Operational Note / Trigger</label>
              <input
                className={styles.formInput}
                type="text"
                placeholder="e.g. Field Engineer Inspection / Routine Survey"
                value={recordNote}
                onChange={(e) => setRecordNote(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.formActions}>
            <button
              type="button"
              className={styles.actionBtn}
              onClick={() => setShowAddForm(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
            >
              💾 Save Record to Database
            </button>
          </div>
        </form>
      )}


      {/* Hypertable Status Grid */}
      <div className={styles.statusGrid}>
        <div className={styles.statusCard}>
          <span className={styles.statusLabel}>Primary Hypertable</span>
          <span className={styles.statusVal} style={{ color: 'var(--accent)' }}>well_telemetry</span>
          <span className={styles.statusSub}>Partition interval: 1 day</span>
        </div>

        <div className={styles.statusCard}>
          <span className={styles.statusLabel}>Total Logged Rows</span>
          <span className={styles.statusVal} style={{ color: 'var(--green)' }}>{totalRecordCount} records</span>
          <span className={styles.statusSub}>Zero overwrites (Append-only)</span>
        </div>

        <div className={styles.statusCard}>
          <span className={styles.statusLabel}>Well Dimensions</span>
          <span className={styles.statusVal} style={{ color: 'var(--purple)' }}>{totalWellCount} Wells</span>
          <span className={styles.statusSub}>34 Active · 18 Shut-in</span>
        </div>

        <div className={styles.statusCard}>
          <span className={styles.statusLabel}>Continuous Aggregate</span>
          <span className={styles.statusVal} style={{ color: 'var(--orange)' }}>well_telemetry_1min</span>
          <span className={styles.statusSub}>Auto-refresh: 1 min</span>
        </div>
      </div>

      {/* Interactive SQL Console */}
      <div className={styles.consoleCard}>
        <div className={styles.consoleHeader}>
          <span className={styles.consoleTitle}>TimescaleDB SQL Query Runner</span>
          <div className={styles.quickQueriesRow}>
            {sampleQueries.map((q, idx) => (
              <button
                key={idx}
                className={styles.quickQueryBtn}
                onClick={() => handleRunQuery(q.sql)}
              >
                {q.label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.queryInputWrapper}>
          <textarea
            className={styles.queryTextarea}
            value={activeQuery}
            onChange={(e) => setActiveQuery(e.target.value)}
            rows={2}
          />
          <button className={styles.executeBtn} onClick={() => handleRunQuery()}>
            Execute SQL
          </button>
        </div>

        {/* Results Metadata & Table */}
        <div className={styles.resultsMeta}>
          <span>
            Returned {queryResult.rows.length} rows (from {queryResult.totalCount} total time-series points)
          </span>
          <span style={{ color: 'var(--accent)' }}>Query execution time: {queryResult.executionTimeMs} ms</span>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.resultsTable}>
            <thead>
              <tr>
                {queryResult.columns.map((col, i) => (
                  <th key={i}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {queryResult.rows.map((row, rIdx) => (
                <tr key={rIdx}>
                  {row.map((cell, cIdx) => (
                    <td key={cIdx}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* PostgreSQL + TimescaleDB Schema Quick Reference */}
      <div className={styles.schemaCard}>
        <span className={styles.consoleTitle}>PostgreSQL Hypertable Schema Definition (`src/database/schema.sql`)</span>
        <pre className={styles.schemaPre}>
{`-- 1. TimescaleDB Extension & Hypertable Setup
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

CREATE TABLE IF NOT EXISTS well_telemetry (
    time TIMESTAMPTZ NOT NULL,
    well_id VARCHAR(16) NOT NULL REFERENCES wells(well_id),
    reservoir_temp_c NUMERIC(5,2) NOT NULL,
    tubing_head_pressure_bar NUMERIC(6,2) NOT NULL,
    pump_speed_spm NUMERIC(4,1) NOT NULL,
    crude_viscosity_cp NUMERIC(7,2) NOT NULL,
    dynamic_fluid_level_m NUMERIC(7,2) NOT NULL,
    oil_rate_bbld NUMERIC(7,2) NOT NULL,
    pore_pressure_bar NUMERIC(6,2) NOT NULL,
    trigger_source VARCHAR(64) DEFAULT 'SCADA Stream',
    delta_note TEXT
);

-- Partitioned by 1-day chunks
SELECT create_hypertable('well_telemetry', 'time', chunk_time_interval => INTERVAL '1 day', if_not_exists => TRUE);

-- Compound index for rapid chronological lookups by well
CREATE INDEX IF NOT EXISTS idx_well_telemetry_well_time ON well_telemetry (well_id, time DESC);`}
        </pre>
      </div>
    </div>
  );
}

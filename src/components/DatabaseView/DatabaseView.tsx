import { useState, useMemo } from 'react';
import { useDigitalTwin } from '../../context/DigitalTwinContext';
import { timescaleDB } from '../../database/timescaleService';
import styles from './DatabaseView.module.css';

export function DatabaseView() {
  const { historicalLogs, wells } = useDigitalTwin();

  const [activeQuery, setActiveQuery] = useState(
    "SELECT time, well_id, temp_c, pressure_bar, spm, viscosity_cp, trigger_source FROM well_telemetry WHERE well_id = 'BW-07' ORDER BY time DESC LIMIT 20;"
  );

  const [queryResult, setQueryResult] = useState(() =>
    timescaleDB.executeSql(activeQuery)
  );

  const totalWellCount = Object.keys(wells).length;
  const totalRecordCount = historicalLogs.length;

  const handleRunQuery = (sqlToRun?: string) => {
    const query = sqlToRun || activeQuery;
    if (sqlToRun) setActiveQuery(sqlToRun);
    const result = timescaleDB.executeSql(query);
    setQueryResult(result);
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
          </div>
          <span className={styles.sectionTitle}>TimescaleDB Telemetry Vault & Query Console</span>
          <span className={styles.subTitle}>
            Partitioned time-series hypertable (`well_telemetry`) with 1-minute continuous rollups
          </span>
        </div>
      </div>

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

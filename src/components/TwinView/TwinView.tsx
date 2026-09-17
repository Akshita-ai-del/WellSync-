import { useState, useMemo } from 'react';
import { useDigitalTwin, type HistoricalTelemetryRecord } from '../../context/DigitalTwinContext';
import styles from './TwinView.module.css';

/* High-fidelity macOS Lucid Well Schematic */
function SchematicSVG({
  fluidLevel,
  porePressure,
  thp,
  chp,
  isPound,
}: {
  fluidLevel: number;
  porePressure: number;
  thp: number;
  chp: number;
  isPound: boolean;
}) {
  // Normalize fluid level (1200m - 1350m) to SVG height (y: 200 - 330)
  const fluidY = 200 + Math.min(130, Math.max(0, ((fluidLevel - 1200) / 150) * 130));

  return (
    <svg className={styles.schematicSvg} viewBox="0 0 520 460" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="casingGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#1a243a" />
          <stop offset="50%" stopColor="#28385e" />
          <stop offset="100%" stopColor="#1a243a" />
        </linearGradient>

        <linearGradient id="fluidGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(0, 229, 255, 0.4)" />
          <stop offset="100%" stopColor="rgba(0, 102, 255, 0.85)" />
        </linearGradient>

        <radialGradient id="steamHeatGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ff8c00" stopOpacity="0.45" />
          <stop offset="60%" stopColor="#ff4b72" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#ff4b72" stopOpacity="0" />
        </radialGradient>

        <filter id="glowEffect" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Surface Terrain / Rig Floor */}
      <rect x="20" y="110" width="480" height="3" fill="rgba(255,255,255,0.08)" rx="1.5" />
      <rect x="20" y="113" width="480" height="340" fill="rgba(10,14,24,0.6)" rx="8" />

      {/* Heavy Oil Reservoir Zone (Payzone Sandstone) */}
      <rect x="40" y="380" width="440" height="65" fill="rgba(255, 140, 0, 0.05)" stroke="rgba(255, 140, 0, 0.2)" strokeDasharray="4 3" rx="4" />
      <ellipse cx="260" cy="412" rx="140" ry="26" fill="url(#steamHeatGrad)" />
      <text x="70" y="400" fill="rgba(255, 140, 0, 0.8)" fontSize="10" fontWeight="700" letterSpacing="0.8">
        JODHPUR FORMATION (PAYZONE DEPTH 2,847m)
      </text>
      <text x="70" y="415" fill="var(--text-muted)" fontSize="9" fontFamily="JetBrains Mono">
        P_res: {porePressure} bar · Viscosity: 32 cP (Steam Front Heated)
      </text>

      {/* Outer Casing Pipe */}
      <rect x="238" y="110" width="44" height="290" fill="url(#casingGrad)" stroke="rgba(255,255,255,0.12)" strokeWidth="1" rx="2" />

      {/* Annular Casing Fluid Level */}
      <rect x="240" y={fluidY} width="40" height={400 - fluidY} fill="url(#fluidGrad)" opacity="0.6" />

      {/* Inner Production Tubing Pipe */}
      <rect x="248" y="90" width="24" height="310" fill="#0b101c" stroke="var(--accent)" strokeWidth="1" strokeOpacity="0.5" />

      {/* Sucker Rod String (Reciprocating) */}
      <line x1="260" y1="50" x2="260" y2="395" stroke="#fff" strokeWidth="2" strokeOpacity="0.8" />

      {/* Perforations into Reservoir */}
      <line x1="230" y1="395" x2="248" y2="395" stroke="#ff8c00" strokeWidth="2" strokeDasharray="2 2" />
      <line x1="230" y1="405" x2="248" y2="405" stroke="#ff8c00" strokeWidth="2" strokeDasharray="2 2" />
      <line x1="272" y1="395" x2="290" y2="395" stroke="#ff8c00" strokeWidth="2" strokeDasharray="2 2" />
      <line x1="272" y1="405" x2="290" y2="405" stroke="#ff8c00" strokeWidth="2" strokeDasharray="2 2" />

      {/* Subsurface SRP Pump Barrel at 2,800m */}
      <rect x="245" y="380" width="30" height="25" fill="#1b253b" stroke="var(--accent)" strokeWidth="1.5" rx="2" />
      <circle cx="260" cy="392" r="4" fill={isPound ? '#ff4b72' : 'var(--green)'} filter="url(#glowEffect)" />
      <text x="260" y="372" textAnchor="middle" fill="var(--text-secondary)" fontSize="8" fontFamily="JetBrains Mono">
        SRP PUMP BARREL
      </text>

      {/* Surface Pump Jack / Walking Beam Derrick */}
      {/* Samson Post */}
      <polygon points="340,110 380,110 360,50" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" />
      {/* Walking Beam */}
      <line x1="260" y1="48" x2="410" y2="58" stroke="var(--accent)" strokeWidth="4" strokeLinecap="round" />
      {/* Horsehead Curved Arc */}
      <path d="M260 48 Q250 35 242 42 Q238 60 260 52" fill="none" stroke="var(--accent)" strokeWidth="2" />

      {/* Polished Rod Bridle from Horsehead to Wellhead */}
      <line x1="260" y1="52" x2="260" y2="88" stroke="#fff" strokeWidth="1.5" strokeDasharray="4 2" />

      {/* Surface Wellhead Christmas Tree */}
      <rect x="238" y="85" width="44" height="25" fill="#141c2e" stroke="rgba(255,255,255,0.2)" strokeWidth="1" rx="3" />
      <rect x="250" y="75" width="20" height="12" fill="#1c2842" stroke="var(--accent)" strokeWidth="1" rx="2" />

      {/* Flowline & Choke Valve to Separator */}
      <path d="M282 96 H330 Q335 96 335 102 V110" stroke="var(--accent)" strokeWidth="2" fill="none" />
      <circle cx="305" cy="96" r="4" fill="#00e5ff" />

      {/* HUD Telemetry Badges Floating in Schematic */}
      {/* Badge 1: Dynamic Fluid Level */}
      <g transform={`translate(100, ${fluidY - 10})`}>
        <rect width="130" height="26" rx="4" fill="rgba(8, 12, 21, 0.9)" stroke="rgba(0, 229, 255, 0.4)" strokeWidth="1" />
        <line x1="130" y1="13" x2="238" y2={13} stroke="rgba(0, 229, 255, 0.5)" strokeWidth="1" strokeDasharray="3 3" />
        <text x="8" y="17" fill="var(--accent)" fontSize="10" fontFamily="JetBrains Mono" fontWeight="700">
          FLUID LEVEL: {fluidLevel} m
        </text>
      </g>

      {/* Badge 2: Wellhead THP */}
      <g transform="translate(60, 68)">
        <rect width="120" height="26" rx="4" fill="rgba(8, 12, 21, 0.9)" stroke="rgba(255, 200, 55, 0.4)" strokeWidth="1" />
        <line x1="120" y1="13" x2="238" y2="88" stroke="rgba(255, 200, 55, 0.4)" strokeWidth="1" strokeDasharray="3 3" />
        <text x="8" y="17" fill="var(--yellow)" fontSize="10" fontFamily="JetBrains Mono" fontWeight="700">
          THP: {thp} bar
        </text>
      </g>

      {/* Badge 3: Casing Pressure CHP */}
      <g transform="translate(350, 75)">
        <rect width="120" height="26" rx="4" fill="rgba(8, 12, 21, 0.9)" stroke="rgba(0, 242, 155, 0.4)" strokeWidth="1" />
        <line x1="0" y1="13" x2="-68" y2="15" stroke="rgba(0, 242, 155, 0.4)" strokeWidth="1" strokeDasharray="3 3" />
        <text x="8" y="17" fill="var(--green)" fontSize="10" fontFamily="JetBrains Mono" fontWeight="700">
          CHP: {chp} bar
        </text>
      </g>

      {/* Badge 4: Subsea/Downhole Pump Status */}
      <g transform="translate(330, 360)">
        <rect width="150" height="26" rx="4" fill="rgba(8, 12, 21, 0.9)" stroke={isPound ? 'rgba(255, 75, 114, 0.6)' : 'rgba(0, 242, 155, 0.4)'} strokeWidth="1" />
        <text x="8" y="17" fill={isPound ? 'var(--red)' : 'var(--green)'} fontSize="10" fontFamily="JetBrains Mono" fontWeight="700">
          {isPound ? '⚠ FLUID POUND' : '● FULL PUMP FILLAGE'}
        </text>
      </g>
    </svg>
  );
}

export function TwinView() {
  const {
    wells,
    activeWell,
    telemetry,
    lastDashboardSyncNotice,
    setLastDashboardSyncNotice,
    historicalLogs,
    directInsertTelemetryRecord,
    loadHistoricalStateIntoCockpit,
  } = useDigitalTwin();

  const [showHistory, setShowHistory] = useState(false);
  const [showInsertModal, setShowInsertModal] = useState(false);
  const [selectedPitRecord, setSelectedPitRecord] = useState<HistoricalTelemetryRecord | null>(null);
  const [historySearch, setHistorySearch] = useState('');

  // Form state for Direct DB Record Ingestion
  const [insertForm, setInsertForm] = useState({
    wellId: activeWell.id,
    temperature: activeWell.reservoirTemp,
    pressure: telemetry.tubingHeadPressure,
    spm: telemetry.pumpSpeed,
    viscosity: telemetry.crudeViscosity,
    fluidLevel: telemetry.dynamicFluidLevel,
    flowRate: telemetry.oilProductionRate,
    trigger: 'Direct Dashboard Manual Input',
    deltaNote: 'Engineer parameter calibration via cockpit',
  });

  const isPound = telemetry.dynacardCondition === 'Fluid Pound';

  // Filter logs for active well & user search
  const wellLogs = useMemo(() => {
    return historicalLogs.filter((l) => {
      const matchWell = l.wellId === activeWell.id || l.wellId === 'BW-07';
      if (!historySearch.trim()) return matchWell;
      const q = historySearch.toLowerCase();
      return (
        matchWell &&
        (l.time.toLowerCase().includes(q) ||
          l.trigger.toLowerCase().includes(q) ||
          (l.deltaNote && l.deltaNote.toLowerCase().includes(q)) ||
          l.temperature.toString().includes(q) ||
          l.viscosity.toString().includes(q))
      );
    });
  }, [historicalLogs, activeWell.id, historySearch]);

  // Real-time generated SQL preview for the direct insert
  const previewSql = useMemo(() => {
    return `INSERT INTO well_telemetry (
  time, well_id, reservoir_temp_c, tubing_head_pressure_bar, 
  pump_speed_spm, crude_viscosity_cp, dynamic_fluid_level_m, 
  oil_rate_bbld, pore_pressure_bar, trigger_source, delta_note
) VALUES (
  NOW(), '${insertForm.wellId}', ${insertForm.temperature}, ${insertForm.pressure}, 
  ${insertForm.spm}, ${insertForm.viscosity}, ${insertForm.fluidLevel}, 
  ${insertForm.flowRate}, 152.00, '${insertForm.trigger}', 
  '${insertForm.deltaNote.replace(/'/g, "''")}'
);`;
  }, [insertForm]);

  const handleOpenInsertModal = () => {
    setInsertForm({
      wellId: activeWell.id,
      temperature: activeWell.reservoirTemp,
      pressure: telemetry.tubingHeadPressure,
      spm: telemetry.pumpSpeed,
      viscosity: telemetry.crudeViscosity,
      fluidLevel: telemetry.dynamicFluidLevel,
      flowRate: telemetry.oilProductionRate,
      trigger: 'Direct Dashboard Manual Input',
      deltaNote: 'Calibrated from Twin Cockpit',
    });
    setShowInsertModal(true);
  };

  const handleCommitInsert = (e: React.FormEvent) => {
    e.preventDefault();
    directInsertTelemetryRecord({
      wellId: insertForm.wellId,
      temperature: Number(insertForm.temperature),
      pressure: Number(insertForm.pressure),
      spm: Number(insertForm.spm),
      viscosity: Number(insertForm.viscosity),
      fluidLevel: Number(insertForm.fluidLevel),
      flowRate: Number(insertForm.flowRate),
      trigger: insertForm.trigger,
      deltaNote: insertForm.deltaNote,
    });
    setShowInsertModal(false);
  };

  return (
    <div className={styles.view}>
      {/* Dynamic Sync Notice Banner */}
      {lastDashboardSyncNotice && (
        <div className={styles.syncNoticeBar}>
          <span className={styles.syncNoticeText}>{lastDashboardSyncNotice}</span>
          <button
            className={styles.syncNoticeClose}
            onClick={() => setLastDashboardSyncNotice(null)}
          >
            ✕
          </button>
        </div>
      )}

      {/* Title Bar */}
      <div className={styles.titleBar}>
        <div className={styles.titleLeft}>
          <div className={styles.badgeRow}>
            <span className={styles.titlePill}>DIGITAL TWIN COCKPIT</span>
            <span className={styles.subPill}>POSTGRESQL + TIMESCALEDB HYPERTABLE</span>
          </div>
          <span className={styles.sectionTitle}>{activeWell.name} — Real-Time Wellbore Cross-Section</span>
          <span className={styles.subTitle}>
            {activeWell.field} · Formation: Jodhpur Sandstone · Lift: {activeWell.liftMethod}
          </span>
        </div>

        <div className={styles.pills}>
          {/* Direct DB Record Writer Button */}
          <button
            className={styles.directInsertBtn}
            onClick={handleOpenInsertModal}
            title="Directly commit a new telemetry record to TimescaleDB without opening pgAdmin"
          >
            + Direct DB Record
          </button>

          <button
            className={`${styles.historyToggleBtn} ${showHistory ? styles.historyToggleActive : ''}`}
            onClick={() => setShowHistory(!showHistory)}
            title="Inspect historical telemetry state changes & point-in-time snapshots"
          >
            {showHistory ? '✕ Close History' : '📜 Time-Series Log'}
          </button>

          <span
            className={styles.pill}
            style={{
              color: isPound ? 'var(--red)' : 'var(--green)',
              background: isPound ? 'var(--red-dim)' : 'var(--green-dim)',
              borderColor: isPound ? 'rgba(255,75,114,0.3)' : 'rgba(0,242,155,0.3)',
            }}
          >
            <span
              className={styles.dot}
              style={{ background: isPound ? 'var(--red)' : 'var(--green)' }}
            />
            {isPound ? 'Fluid Pound Warning' : 'Producing Normally'}
          </span>
          <span className={styles.pill} style={{ color: 'var(--accent)', background: 'var(--accent-dim)', borderColor: 'rgba(0,229,255,0.3)' }}>
            CSS Cycle #{activeWell.cssCycle} Active
          </span>
        </div>
      </div>

      {/* Historical Telemetry Drawer Overlay */}
      {showHistory && (
        <div className={styles.historyDrawer}>
          <div className={styles.drawerHeader}>
            <div>
              <span className={styles.drawerTitle}>TimescaleDB Telemetry Vault — {activeWell.id}</span>
              <span className={styles.drawerSub}>
                Immutable time-series records (Temperature, Pressure, SPM, Viscosity). Click "Inspect / Load" to access point-in-time data.
              </span>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="text"
                className={styles.formInput}
                style={{ padding: '3px 8px', fontSize: '10px', width: '160px' }}
                placeholder="Filter time, trigger..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
              />
              <button className={styles.drawerClose} onClick={() => setShowHistory(false)}>✕</button>
            </div>
          </div>

          <div className={styles.drawerTableWrapper}>
            <table className={styles.drawerTable}>
              <thead>
                <tr>
                  <th>Well_ID</th>
                  <th>Timestamp</th>
                  <th>Temperature (°C)</th>
                  <th>Pressure (bar)</th>
                  <th>SPM</th>
                  <th>Viscosity (cP)</th>
                  <th>Fluid Level (m)</th>
                  <th>Trigger / Operation</th>
                  <th>Point-in-Time</th>
                </tr>
              </thead>
              <tbody>
                {wellLogs.slice(0, 25).map((log) => (
                  <tr key={log.id}>
                    <td className={styles.wellIdCell}>{log.wellId}</td>
                    <td className={styles.monoCell}>{log.time}</td>
                    <td className={styles.tempCell}>{log.temperature} °C</td>
                    <td className={styles.monoCell}>{log.pressure} bar</td>
                    <td className={styles.spmCell}>{log.spm}</td>
                    <td className={styles.viscoCell}>{log.viscosity} cP</td>
                    <td className={styles.monoCell}>{log.fluidLevel} m</td>
                    <td className={styles.triggerCell}>
                      <span>{log.trigger}</span>
                      {log.deltaNote && <small className={styles.deltaNote}>{log.deltaNote}</small>}
                    </td>
                    <td>
                      <button
                        className={styles.rowActionBtn}
                        onClick={() => setSelectedPitRecord(log)}
                        title="Inspect snapshot at this timestamp"
                      >
                        Inspect / Load
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Direct DB Ingestion Modal */}
      {showInsertModal && (
        <div className={styles.modalOverlay} onClick={() => setShowInsertModal(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <span className={styles.modalTitle}>
                Direct Database Telemetry Entry
                <span className={styles.modalTitleBadge}>PostgreSQL Hypertable</span>
              </span>
              <button className={styles.drawerClose} onClick={() => setShowInsertModal(false)}>✕</button>
            </div>

            <form onSubmit={handleCommitInsert}>
              <div className={styles.modalBody}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Write telemetry directly into PostgreSQL / TimescaleDB hypertable (`well_telemetry`). Updates live dashboard gauges immediately.
                </span>

                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Target Well ID</label>
                    <select
                      className={styles.formSelect}
                      value={insertForm.wellId}
                      onChange={(e) => setInsertForm({ ...insertForm, wellId: e.target.value })}
                    >
                      {Object.keys(wells).map((id) => (
                        <option key={id} value={id}>
                          {id} — {wells[id].name} ({wells[id].status})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Reservoir Temperature (°C)</label>
                    <input
                      type="number"
                      step="0.1"
                      className={styles.formInput}
                      value={insertForm.temperature}
                      onChange={(e) => setInsertForm({ ...insertForm, temperature: parseFloat(e.target.value) || 0 })}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Tubing Head Pressure (bar)</label>
                    <input
                      type="number"
                      step="0.1"
                      className={styles.formInput}
                      value={insertForm.pressure}
                      onChange={(e) => setInsertForm({ ...insertForm, pressure: parseFloat(e.target.value) || 0 })}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>SRP Pump Speed (SPM)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      max="15"
                      className={styles.formInput}
                      value={insertForm.spm}
                      onChange={(e) => setInsertForm({ ...insertForm, spm: parseFloat(e.target.value) || 0 })}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Crude Viscosity (cP)</label>
                    <input
                      type="number"
                      step="0.5"
                      className={styles.formInput}
                      value={insertForm.viscosity}
                      onChange={(e) => setInsertForm({ ...insertForm, viscosity: parseFloat(e.target.value) || 0 })}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Dynamic Fluid Level (m)</label>
                    <input
                      type="number"
                      step="1"
                      className={styles.formInput}
                      value={insertForm.fluidLevel}
                      onChange={(e) => setInsertForm({ ...insertForm, fluidLevel: parseFloat(e.target.value) || 0 })}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Net Oil Flow Rate (bbl/d)</label>
                    <input
                      type="number"
                      step="0.1"
                      className={styles.formInput}
                      value={insertForm.flowRate}
                      onChange={(e) => setInsertForm({ ...insertForm, flowRate: parseFloat(e.target.value) || 0 })}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Trigger / Source</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      value={insertForm.trigger}
                      onChange={(e) => setInsertForm({ ...insertForm, trigger: e.target.value })}
                    />
                  </div>

                  <div className={styles.formGroupFull}>
                    <label className={styles.formLabel}>Audit Note / Calibration Reason</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      placeholder="e.g. Viscosity drop observed after steam injection cycle"
                      value={insertForm.deltaNote}
                      onChange={(e) => setInsertForm({ ...insertForm, deltaNote: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <span className={styles.sqlLabel}>Executed SQL Transaction:</span>
                  <div className={styles.sqlPreviewBox}>{previewSql}</div>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowInsertModal(false)}>
                  Cancel
                </button>
                <button type="submit" className={styles.commitBtn}>
                  Commit Record to TimescaleDB
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Point-in-Time Inspector Modal */}
      {selectedPitRecord && (
        <div className={styles.modalOverlay} onClick={() => setSelectedPitRecord(null)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <span className={styles.modalTitle}>
                Point-in-Time Telemetry Inspector
                <span className={styles.modalTitleBadge}>{selectedPitRecord.wellId} @ {selectedPitRecord.time}</span>
              </span>
              <button className={styles.drawerClose} onClick={() => setSelectedPitRecord(null)}>✕</button>
            </div>

            <div className={styles.modalBody}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Comparing historical telemetry snapshot from TimescaleDB hypertable against current live cockpit state.
              </span>

              <div className={styles.pitComparisonGrid}>
                {/* Historical Snapshot */}
                <div className={styles.pitCard}>
                  <span className={styles.pitCardTitle}>Past Historical Snapshot ({selectedPitRecord.time})</span>
                  <div className={styles.pitParamRow}>
                    <span className={styles.pitParamLabel}>Temperature:</span>
                    <span className={styles.pitParamVal} style={{ color: 'var(--yellow)' }}>{selectedPitRecord.temperature} °C</span>
                  </div>
                  <div className={styles.pitParamRow}>
                    <span className={styles.pitParamLabel}>Tubing Pressure:</span>
                    <span className={styles.pitParamVal}>{selectedPitRecord.pressure} bar</span>
                  </div>
                  <div className={styles.pitParamRow}>
                    <span className={styles.pitParamLabel}>SRP Speed:</span>
                    <span className={styles.pitParamVal} style={{ color: 'var(--purple)' }}>{selectedPitRecord.spm} SPM</span>
                  </div>
                  <div className={styles.pitParamRow}>
                    <span className={styles.pitParamLabel}>Viscosity:</span>
                    <span className={styles.pitParamVal} style={{ color: 'var(--orange)' }}>{selectedPitRecord.viscosity} cP</span>
                  </div>
                  <div className={styles.pitParamRow}>
                    <span className={styles.pitParamLabel}>Fluid Level:</span>
                    <span className={styles.pitParamVal}>{selectedPitRecord.fluidLevel} m</span>
                  </div>
                  <div className={styles.pitParamRow}>
                    <span className={styles.pitParamLabel}>Oil Flow Rate:</span>
                    <span className={styles.pitParamVal} style={{ color: 'var(--green)' }}>{selectedPitRecord.flowRate} bbl/d</span>
                  </div>
                  <div className={styles.pitParamRow}>
                    <span className={styles.pitParamLabel}>Trigger:</span>
                    <span className={styles.pitParamVal} style={{ fontSize: '10px' }}>{selectedPitRecord.trigger}</span>
                  </div>
                </div>

                {/* Current Live Cockpit State */}
                <div className={styles.pitCard} style={{ borderColor: 'rgba(0, 229, 255, 0.4)' }}>
                  <span className={styles.pitCardTitle} style={{ color: 'var(--accent)' }}>Current Live Cockpit State</span>
                  <div className={styles.pitParamRow}>
                    <span className={styles.pitParamLabel}>Temperature:</span>
                    <span className={styles.pitParamVal} style={{ color: 'var(--yellow)' }}>{telemetry.reservoirTemperature} °C</span>
                  </div>
                  <div className={styles.pitParamRow}>
                    <span className={styles.pitParamLabel}>Tubing Pressure:</span>
                    <span className={styles.pitParamVal}>{telemetry.tubingHeadPressure} bar</span>
                  </div>
                  <div className={styles.pitParamRow}>
                    <span className={styles.pitParamLabel}>SRP Speed:</span>
                    <span className={styles.pitParamVal} style={{ color: 'var(--purple)' }}>{telemetry.pumpSpeed} SPM</span>
                  </div>
                  <div className={styles.pitParamRow}>
                    <span className={styles.pitParamLabel}>Viscosity:</span>
                    <span className={styles.pitParamVal} style={{ color: 'var(--orange)' }}>{telemetry.crudeViscosity} cP</span>
                  </div>
                  <div className={styles.pitParamRow}>
                    <span className={styles.pitParamLabel}>Fluid Level:</span>
                    <span className={styles.pitParamVal}>{telemetry.dynamicFluidLevel} m</span>
                  </div>
                  <div className={styles.pitParamRow}>
                    <span className={styles.pitParamLabel}>Oil Flow Rate:</span>
                    <span className={styles.pitParamVal} style={{ color: 'var(--green)' }}>{telemetry.oilProductionRate} bbl/d</span>
                  </div>
                  <div className={styles.pitParamRow}>
                    <span className={styles.pitParamLabel}>Delta Viscosity:</span>
                    <span className={styles.pitParamVal} style={{ color: telemetry.crudeViscosity < selectedPitRecord.viscosity ? 'var(--green)' : 'var(--red)' }}>
                      {(telemetry.crudeViscosity - selectedPitRecord.viscosity).toFixed(1)} cP
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <span className={styles.sqlLabel}>Point-in-Time TimescaleDB Query:</span>
                <div className={styles.sqlPreviewBox}>
{`SELECT * FROM well_telemetry 
WHERE well_id = '${selectedPitRecord.wellId}' 
  AND time <= '${selectedPitRecord.time}' 
ORDER BY time DESC 
LIMIT 1;`}
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button type="button" className={styles.cancelBtn} onClick={() => setSelectedPitRecord(null)}>
                Close
              </button>
              <button
                type="button"
                className={styles.commitBtn}
                onClick={() => {
                  loadHistoricalStateIntoCockpit(selectedPitRecord);
                  setSelectedPitRecord(null);
                }}
              >
                ⏮ Apply Snapshot to Cockpit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Center Schematic Content */}
      <div className={styles.centerContent}>
        <div className={styles.svgWrapper}>
          <SchematicSVG
            fluidLevel={telemetry.dynamicFluidLevel}
            porePressure={telemetry.porePressure}
            thp={telemetry.tubingHeadPressure}
            chp={telemetry.casingHeadPressure}
            isPound={isPound}
          />
        </div>

        {/* Live Multiphysics Telemetry Metrics Strip */}
        <div className={styles.metricsRow}>
          <div className={styles.metricCard}>
            <span className={styles.metricLabel}>Reservoir Drawdown</span>
            <span className={styles.metricVal} style={{ color: 'var(--yellow)' }}>
              {telemetry.bottomholeDrawdown} <small>bar</small>
            </span>
            <span className={styles.metricSub}>P_res: {telemetry.porePressure} bar</span>
          </div>

          <div className={styles.metricCard}>
            <span className={styles.metricLabel}>Tubing Head (THP)</span>
            <span className={styles.metricVal} style={{ color: 'var(--accent)' }}>
              {telemetry.tubingHeadPressure} <small>bar</small>
            </span>
            <span className={styles.metricSub}>CHP: {telemetry.casingHeadPressure} bar</span>
          </div>

          <div className={styles.metricCard}>
            <span className={styles.metricLabel}>Dynamic Fluid Level</span>
            <span className={styles.metricVal} style={{ color: 'var(--green)' }}>
              {telemetry.dynamicFluidLevel} <small>m</small>
            </span>
            <span className={styles.metricSub}>Submergence Margin: 142m</span>
          </div>

          <div className={styles.metricCard}>
            <span className={styles.metricLabel}>SRP Pump Speed</span>
            <span className={styles.metricVal} style={{ color: 'var(--purple)' }}>
              {telemetry.pumpSpeed} <small>SPM</small>
            </span>
            <span className={styles.metricSub}>Fillage: {telemetry.pumpFillage}%</span>
          </div>

          <div className={styles.metricCard}>
            <span className={styles.metricLabel}>Net Oil Rate</span>
            <span className={styles.metricVal} style={{ color: 'var(--green)' }}>
              {telemetry.oilProductionRate} <small>bbl/d</small>
            </span>
            <span className={styles.metricSub}>Water Cut: {telemetry.waterCut}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

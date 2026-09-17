import { useState, useMemo } from 'react';
import { useDigitalTwin } from '../../context/DigitalTwinContext';
import styles from './ReportsView.module.css';

export function ReportsView() {
  const { telemetry, activeWell, alerts, historicalLogs } = useDigitalTwin();
  const [copied, setCopied] = useState(false);
  const [selectedWellFilter, setSelectedWellFilter] = useState<string>('all');
  const [logSearch, setLogSearch] = useState('');

  const reportDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const filteredLogs = useMemo(() => {
    return historicalLogs.filter((log) => {
      const matchWell = selectedWellFilter === 'all' || log.wellId === selectedWellFilter;
      const matchSearch =
        !logSearch.trim() ||
        log.wellId.toLowerCase().includes(logSearch.toLowerCase()) ||
        log.trigger.toLowerCase().includes(logSearch.toLowerCase()) ||
        (log.deltaNote && log.deltaNote.toLowerCase().includes(logSearch.toLowerCase()));
      return matchWell && matchSearch;
    });
  }, [historicalLogs, selectedWellFilter, logSearch]);

  const handleExportCSV = () => {
    const headers = 'Well_ID,Time,Temperature_C,Pressure_bar,SPM,Viscosity_cP,FluidLevel_m,FlowRate_bbld,Trigger,Note\n';
    const rows = filteredLogs
      .map(
        (l) =>
          `${l.wellId},"${l.time}",${l.temperature},${l.pressure},${l.spm},${l.viscosity},${l.fluidLevel},${l.flowRate},"${l.trigger}","${l.deltaNote || ''}"`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `WellSync_${activeWell.id}_Historical_Telemetry_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyMarkdown = () => {
    const md = `# WELLSYNC — DAILY PRODUCTION & RESERVOIR SURVEILLANCE REPORT
Date: ${reportDate} | Field: ${activeWell.field} | Asset: ONGC Rajasthan
Well ID: ${activeWell.name} | Status: ${activeWell.status} | Lift: ${activeWell.liftMethod}

## 1. MULTIPHYSICS TELEMETRY SUMMARY
- Pore Pressure (Pres): ${telemetry.porePressure} bar
- Bottomhole Flowing Pressure (Pwf): ${telemetry.bottomholeFlowingPressure} bar
- Net Drawdown: ${telemetry.bottomholeDrawdown} bar
- Tubing Head Pressure: ${telemetry.tubingHeadPressure} bar
- Casing Head Pressure: ${telemetry.casingHeadPressure} bar
- Dynamic Liquid Level: ${telemetry.dynamicFluidLevel} m below surface
- Reservoir Temperature: ${telemetry.reservoirTemperature} °C

## 2. ARTIFICIAL LIFT (SRP) PERFORMANCE
- Pumping Speed: ${telemetry.pumpSpeed} SPM
- Dynacard Condition: ${telemetry.dynacardCondition}
- Pump Fillage: ${telemetry.pumpFillage} %
- Peak Rod Load (PPRL): ${telemetry.peakPolishedRodLoad} lbs
- Min Rod Load (MPRL): ${telemetry.minPolishedRodLoad} lbs
- Power Demand: ${telemetry.motorPower} kW (${telemetry.motorCurrent} A)
- Lift Volumetric Efficiency: ${telemetry.srpEfficiency} %

## 3. PRODUCTION VOLUMES
- Net Oil Rate: ${telemetry.oilProductionRate} bbl/d
- Gross Liquid Rate: ${telemetry.grossRate} bbl/d
- Water Cut: ${telemetry.waterCut} %
- Gas-Oil Ratio: ${telemetry.gasOilRatio} scf/bbl
- 24h Cumulative Oil: ${telemetry.dailyCumulativeOil} bbl

## 4. HISTORICAL TIME-SERIES TELEMETRY AUDIT TRAIL (Last ${filteredLogs.length} Records)
${filteredLogs
  .slice(0, 15)
  .map(
    (l) =>
      `| ${l.wellId} | ${l.time} | Temp: ${l.temperature}°C | Press: ${l.pressure} bar | SPM: ${l.spm} | Visco: ${l.viscosity} cP | Level: ${l.fluidLevel}m | ${l.trigger} |`
  )
  .join('\n')}
`;
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <div className={styles.badgeRow}>
            <span className={styles.tag}>ONGC DGH COMPLIANCE FORMAT</span>
            <span className={styles.subTag}>HISTORICAL TELEMETRY DATABASE</span>
          </div>
          <h1 className={styles.title}>Surveillance Log & Historical Telemetry Vault</h1>
          <p className={styles.subtitle}>
            Continuous immutable audit trail. Every parameter alteration (temperature, SPM, viscosity, pressure) is chronologically archived without overwriting past data.
          </p>
        </div>

        <div className={styles.actions}>
          <button className={styles.csvBtn} onClick={handleExportCSV}>
            📥 Export CSV Database
          </button>
          <button className={styles.copyBtn} onClick={handleCopyMarkdown}>
            {copied ? '✓ Report Copied' : 'Copy Report Markdown'}
          </button>
          <button className={styles.printBtn} onClick={() => window.print()}>
            Print / PDF
          </button>
        </div>
      </header>

      <div className={styles.reportSheet}>
        <div className={styles.sheetHeader}>
          <div className={styles.sheetHeaderLeft}>
            <span className={styles.reportTitle}>SURVEILLANCE DOSSIER — {activeWell.name}</span>
            <span className={styles.reportMeta}>
              Asset: ONGC Rajasthan · Block RJ-ON-90/1 · Date: {reportDate} · Records Archived: {historicalLogs.length}
            </span>
          </div>
          <span className={styles.complianceBadge}>STATUS: IMMUTABLE AUDIT ACTIVE</span>
        </div>

        {/* Section 1: Immutable Historical Time-Series Telemetry Table */}
        <section className={styles.section}>
          <div className={styles.sectionHeaderRow}>
            <div>
              <h3 className={styles.secTitle}>1. Full Telemetry History & State Transition Log</h3>
              <p className={styles.secSubtitle}>
                Time-series record preserving chronological states for viscosity, temperature, pressure, and SPM.
              </p>
            </div>

            <div className={styles.filterControls}>
              <select
                value={selectedWellFilter}
                onChange={(e) => setSelectedWellFilter(e.target.value)}
                className={styles.wellSelectFilter}
              >
                <option value="all">All Wells History</option>
                <option value={activeWell.id}>Current Well ({activeWell.id})</option>
                <option value="BW-01">Well BW-01</option>
                <option value="BW-04">Well BW-04</option>
                <option value="BW-07">Well BW-07</option>
                <option value="BW-12">Well BW-12</option>
              </select>

              <input
                type="text"
                placeholder="Filter by keyword / event..."
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                className={styles.logSearchInput}
              />
            </div>
          </div>

          <div className={styles.historyTableWrapper}>
            <table className={styles.historyTable}>
              <thead>
                <tr>
                  <th>Well_ID</th>
                  <th>Timestamp</th>
                  <th>Temperature (°C)</th>
                  <th>Pressure (bar)</th>
                  <th>SPM</th>
                  <th>Viscosity (cP)</th>
                  <th>Fluid Level (m)</th>
                  <th>Net Rate (bbl/d)</th>
                  <th>Trigger / Operation</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.id}>
                    <td className={styles.wellIdCell}>{log.wellId}</td>
                    <td className={styles.monoCell}>{log.time}</td>
                    <td className={styles.tempCell}>{log.temperature} °C</td>
                    <td className={styles.monoCell}>{log.pressure} bar</td>
                    <td className={styles.spmCell}>{log.spm}</td>
                    <td className={styles.viscoCell}>{log.viscosity} cP</td>
                    <td className={styles.monoCell}>{log.fluidLevel} m</td>
                    <td className={styles.rateCell}>{log.flowRate}</td>
                    <td className={styles.triggerCell}>
                      <span className={styles.triggerTag}>{log.trigger}</span>
                      {log.deltaNote && <span className={styles.deltaNote}>{log.deltaNote}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 2: Multiphysics Summary */}
        <section className={styles.section}>
          <h3 className={styles.secTitle}>2. Live Reservoir Hydrodynamic Integrity</h3>
          <div className={styles.table}>
            <div className={styles.trHeader}>
              <span>Parameter</span>
              <span>Observed Value</span>
              <span>Baseline Norm</span>
              <span>Variance / Status</span>
            </div>
            <div className={styles.tr}>
              <span>Reservoir Pore Pressure ($P_{'{'}res{'}'}$)</span>
              <span className={styles.mono}>{telemetry.porePressure} bar</span>
              <span>152.0 bar</span>
              <span style={{ color: 'var(--green)' }}>-0.7 bar (Normal Depletion)</span>
            </div>
            <div className={styles.tr}>
              <span>Bottomhole Flowing Pressure ($P_{'{'}wf{'}'}$)</span>
              <span className={styles.mono}>{telemetry.bottomholeFlowingPressure} bar</span>
              <span>98.0 bar</span>
              <span style={{ color: 'var(--accent)' }}>Drawdown: {telemetry.bottomholeDrawdown} bar</span>
            </div>
            <div className={styles.tr}>
              <span>Dynamic Liquid Level</span>
              <span className={styles.mono}>{telemetry.dynamicFluidLevel} m</span>
              <span>1,240 m</span>
              <span style={{ color: telemetry.dynamicFluidLevel > 1280 ? 'var(--red)' : 'var(--green)' }}>
                {telemetry.dynamicFluidLevel > 1280 ? 'Submergence Warning' : 'Adequate Submergence'}
              </span>
            </div>
            <div className={styles.tr}>
              <span>Casing Head Pressure (CHP)</span>
              <span className={styles.mono}>{telemetry.casingHeadPressure} bar</span>
              <span>90.0 bar</span>
              <span style={{ color: 'var(--yellow)' }}>Gas cushion active</span>
            </div>
          </div>
        </section>

        {/* Section 3: Artificial Lift Telemetry */}
        <section className={styles.section}>
          <h3 className={styles.secTitle}>3. Sucker Rod Pump (SRP) Artificial Lift Telemetry</h3>
          <div className={styles.table}>
            <div className={styles.trHeader}>
              <span>Component</span>
              <span>Telemetry Value</span>
              <span>Operating Limit</span>
              <span>Diagnostics</span>
            </div>
            <div className={styles.tr}>
              <span>Pumping Speed (VFD)</span>
              <span className={styles.mono}>{telemetry.pumpSpeed} SPM</span>
              <span>3.5 – 8.0 SPM</span>
              <span>Optimal IPR range</span>
            </div>
            <div className={styles.tr}>
              <span>Dynacard Condition</span>
              <span
                className={styles.mono}
                style={{
                  color: telemetry.dynacardCondition === 'Normal Full Fillage' ? 'var(--green)' : 'var(--red)',
                }}
              >
                {telemetry.dynacardCondition}
              </span>
              <span>Full Fillage</span>
              <span>Fillage: {telemetry.pumpFillage}%</span>
            </div>
            <div className={styles.tr}>
              <span>Peak Polished Rod Load (PPRL)</span>
              <span className={styles.mono}>{telemetry.peakPolishedRodLoad} lbs</span>
              <span>22,000 lbs (Rating)</span>
              <span>Margin: +{22000 - telemetry.peakPolishedRodLoad} lbs</span>
            </div>
            <div className={styles.tr}>
              <span>Surface Electric Motor</span>
              <span className={styles.mono}>{telemetry.motorPower} kW ({telemetry.motorCurrent} A)</span>
              <span>22 kW</span>
              <span>VFD power factor: 0.92</span>
            </div>
          </div>
        </section>

        {/* Section 4: Anomaly Logs */}
        <section className={styles.section}>
          <h3 className={styles.secTitle}>4. Active AI Alerts & Remediation History</h3>
          <div className={styles.alertLog}>
            {alerts.map((a) => (
              <div key={a.id} className={styles.alertEntry}>
                <span
                  className={styles.alertTag}
                  style={{
                    color:
                      a.severity === 'critical'
                        ? 'var(--red)'
                        : a.severity === 'warning'
                        ? 'var(--yellow)'
                        : 'var(--accent)',
                  }}
                >
                  [{a.subsystem}] {a.title}
                </span>
                <p className={styles.alertDesc}>{a.description}</p>
                <span className={styles.actionAdvice}>Recommended Action: {a.actionLabel}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

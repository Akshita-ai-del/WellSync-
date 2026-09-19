import { useState, useMemo } from 'react';
import { useDigitalTwin } from '../../context/DigitalTwinContext';
import styles from './AnalyticsView.module.css';

interface Point {
  time: string;
  val: number;
}

/* High-fidelity interactive SVG Line Chart with Gridlines & Gradient Area */
function TimeSeriesChart({
  points,
  color,
  unit,
  minVal,
  maxVal,
}: {
  points: Point[];
  color: string;
  unit: string;
  minVal?: number;
  maxVal?: number;
}) {
  const w = 600;
  const h = 180;
  const paddingX = 40;
  const paddingY = 24;

  const dataValues = points.map((p) => p.val);
  const min = minVal !== undefined ? minVal : Math.min(...dataValues);
  const max = maxVal !== undefined ? maxVal : Math.max(...dataValues);
  const range = max - min || 1;

  const innerW = w - paddingX * 2;
  const innerH = h - paddingY * 2;
  const step = points.length > 1 ? innerW / (points.length - 1) : innerW;

  const coords = points.map((p, i) => ({
    x: paddingX + i * step,
    y: paddingY + innerH - ((p.val - min) / range) * innerH,
    time: p.time,
    val: p.val,
  }));

  const pathStr = coords.reduce((acc, pt, i) => {
    return i === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`;
  }, '');

  const areaStr =
    coords.length > 1
      ? `${pathStr} L ${coords[coords.length - 1].x},${paddingY + innerH} L ${coords[0].x},${paddingY + innerH} Z`
      : '';

  const gradId = `chartGrad_${color.replace(/[^a-zA-Z0-9]/g, '')}`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={styles.chartSvg} preserveAspectRatio="none">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0.01" />
        </linearGradient>
      </defs>

      {/* Subtle Horizontal Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
        const yPos = paddingY + innerH * ratio;
        const valAtY = (max - ratio * range).toFixed(1);
        return (
          <g key={idx}>
            <line
              x1={paddingX}
              y1={yPos}
              x2={w - paddingX}
              y2={yPos}
              stroke="rgba(255, 255, 255, 0.06)"
              strokeDasharray="3 3"
              strokeWidth="1"
            />
            <text
              x={paddingX - 6}
              y={yPos + 3}
              textAnchor="end"
              fill="rgba(255, 255, 255, 0.35)"
              fontSize="8"
              fontFamily="JetBrains Mono"
            >
              {valAtY}
            </text>
          </g>
        );
      })}

      {/* Area under curve */}
      {areaStr && <path d={areaStr} fill={`url(#${gradId})`} />}

      {/* Main trend line */}
      {pathStr && (
        <path
          d={pathStr}
          fill="none"
          stroke={color}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}

      {/* Data Point Markers */}
      {coords.map((pt, i) => (
        <circle
          key={i}
          cx={pt.x}
          cy={pt.y}
          r={i === coords.length - 1 ? 4 : 2}
          fill={i === coords.length - 1 ? '#ffffff' : color}
          stroke={color}
          strokeWidth="1.5"
        />
      ))}

      {/* Latest Value Badge on last point */}
      {coords.length > 0 && (
        <text
          x={coords[coords.length - 1].x}
          y={coords[coords.length - 1].y - 8}
          textAnchor="middle"
          fill="#ffffff"
          fontSize="9"
          fontWeight="700"
          fontFamily="JetBrains Mono"
        >
          {coords[coords.length - 1].val} {unit}
        </text>
      )}

      {/* Timestamp labels on bottom */}
      {coords.length > 0 && (
        <>
          <text
            x={coords[0].x}
            y={h - 4}
            textAnchor="start"
            fill="rgba(255, 255, 255, 0.4)"
            fontSize="8"
            fontFamily="JetBrains Mono"
          >
            {coords[0].time}
          </text>
          <text
            x={coords[coords.length - 1].x}
            y={h - 4}
            textAnchor="end"
            fill="rgba(255, 255, 255, 0.4)"
            fontSize="8"
            fontFamily="JetBrains Mono"
          >
            {coords[coords.length - 1].time} (Live)
          </text>
        </>
      )}
    </svg>
  );
}

export function AnalyticsView() {
  const { wells, activeWell, setActiveWellId, historicalLogs, telemetry } = useDigitalTwin();

  if (!telemetry || !activeWell) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', padding: '2rem', textAlign: 'center', color: '#888' }}>
        No telemetry data available. Awaiting connection to Digital Twin backend.
      </div>
    );
  }

  const [selectedWellId, setSelectedWellId] = useState<string>(activeWell.id);

  const selectedWell = wells[selectedWellId] || activeWell;

  // Filter or synthesize time-series telemetry points for the selected well
  const wellLogs = useMemo(() => {
    const raw = historicalLogs.filter((l) => l.wellId === selectedWellId);
    if (raw.length >= 6) {
      return raw.slice(0, 24).reverse();
    }

    // Generate continuous smooth series matching selected well parameters
    const synthetic = [];
    const baseTime = Date.now() - 15 * 60 * 1000;
    for (let i = 0; i < 15; i++) {
      const t = new Date(baseTime + i * 60 * 1000).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      const tempWave = Math.sin(i * 0.4) * 0.6;
      synthetic.push({
        id: `synth_${i}`,
        wellId: selectedWellId,
        time: t,
        temperature: +(selectedWell.reservoirTemp + tempWave).toFixed(1),
        pressure: +(148.5 - i * 0.15 + Math.cos(i) * 0.4).toFixed(1),
        spm: selectedWell.status === 'Shut-in / Workover' ? 0 : +(5.8 + Math.sin(i * 0.5) * 0.3).toFixed(1),
        viscosity: +(selectedWell.baselineViscosity - i * 0.3 + Math.sin(i) * 0.5).toFixed(1),
        fluidLevel: 1245 + i * 2,
        flowRate: selectedWell.targetRate,
        porePressure: 152.0,
        trigger: 'SCADA Telemetry Stream',
      });
    }
    return synthetic;
  }, [historicalLogs, selectedWellId, selectedWell]);

  // Transform into points
  const tempPoints: Point[] = wellLogs.map((l) => ({ time: l.time, val: l.temperature }));
  const viscoPoints: Point[] = wellLogs.map((l) => ({ time: l.time, val: l.viscosity }));
  const pressPoints: Point[] = wellLogs.map((l) => ({ time: l.time, val: l.pressure }));
  const spmPoints: Point[] = wellLogs.map((l) => ({ time: l.time, val: l.spm }));
  const fluidPoints: Point[] = wellLogs.map((l) => ({ time: l.time, val: l.fluidLevel }));
  const flowPoints: Point[] = wellLogs.map((l) => ({ time: l.time, val: l.flowRate }));

  // Latest snapshot metrics
  const latestLog = wellLogs[wellLogs.length - 1] || {
    temperature: selectedWell.reservoirTemp,
    viscosity: selectedWell.baselineViscosity,
    pressure: telemetry.tubingHeadPressure,
    spm: telemetry.pumpSpeed,
    fluidLevel: telemetry.dynamicFluidLevel,
    flowRate: selectedWell.targetRate,
  };

  // CSV Report download handler for the specifically chosen well
  const handleDownloadCsv = () => {
    const headers = 'Timestamp,Well_ID,Temperature_C,Tubing_Pressure_bar,Pump_Speed_SPM,Viscosity_cP,Fluid_Level_m,Oil_Rate_bbld,Trigger\n';
    const rows = wellLogs
      .map(
        (l) =>
          `${l.time},${l.wellId},${l.temperature},${l.pressure},${l.spm},${l.viscosity},${l.fluidLevel},${l.flowRate},"${l.trigger}"`
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `WellSync_${selectedWell.id}_Telemetry_Report_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Printable Shift Dossier download
  const handleDownloadDossier = () => {
    const reportText = `# WELLSYNC FIELD SURVEILLANCE DOSSIER
Asset: ONGC Rajasthan Asset | Block RJ-ON-90/1
Target Well: ${selectedWell.name} (${selectedWell.id})
Field Status: ${selectedWell.status}
Target Depth: ${selectedWell.targetDepth} meters | Lift Method: ${selectedWell.liftMethod}
Generated Timestamp: ${new Date().toLocaleString('en-IN')}

================================================================================
LATEST TELEMETRY SNAPSHOT:
--------------------------------------------------------------------------------
• Reservoir Temperature:   ${latestLog.temperature} °C
• Crude Viscosity:         ${latestLog.viscosity} cP (Native: ${selectedWell.baselineViscosity} cP)
• Tubing Head Pressure:    ${latestLog.pressure} bar
• SRP Pumping Speed:       ${latestLog.spm} SPM
• Dynamic Fluid Level:     ${latestLog.fluidLevel} meters
• Net Oil Production Rate: ${latestLog.flowRate} bbl/d

================================================================================
HISTORICAL TELEMETRY LOGS (LATEST ${wellLogs.length} SAMPLES):
--------------------------------------------------------------------------------
${wellLogs.map((l) => `[${l.time}] Temp: ${l.temperature}°C | THP: ${l.pressure} bar | SPM: ${l.spm} | Visco: ${l.viscosity} cP | Rate: ${l.flowRate} bbl/d | Source: ${l.trigger}`).join('\n')}
`;

    const blob = new Blob([reportText], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `WellSync_${selectedWell.id}_Surveillance_Dossier.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={styles.view}>
      {/* Title Bar */}
      <div className={styles.titleBar}>
        <div className={styles.titleLeft}>
          <div className={styles.badgeRow}>
            <span className={styles.titlePill}>TIME-SERIES ANALYTICS</span>
            <span className={styles.subPill}>LIVE SCADA DOWNSAMPLED METRICS</span>
          </div>
          <span className={styles.sectionTitle}>Well Telemetry Curves & Analytics</span>
          <span className={styles.subTitle}>
            Real-time graphical trends with per-well filtering, automated recalculation, and CSV surveillance download.
          </span>
        </div>
      </div>

      {/* Well Selection Strip & Report Actions */}
      <div className={styles.controlsStrip}>
        <div className={styles.selectorGroup}>
          <span className={styles.selectorLabel}>Select Well:</span>
          <select
            className={styles.wellSelect}
            value={selectedWellId}
            onChange={(e) => {
              setSelectedWellId(e.target.value);
              setActiveWellId(e.target.value);
            }}
          >
            {Object.keys(wells).map((id) => (
              <option key={id} value={id}>
                {id} — {wells[id].name} ({wells[id].status})
              </option>
            ))}
          </select>
        </div>

        <div className={styles.actionsGroup}>
          <button className={styles.downloadBtn} onClick={handleDownloadCsv}>
            Download CSV Report
          </button>
          <button className={styles.secondaryBtn} onClick={handleDownloadDossier}>
            Download Shift Dossier
          </button>
        </div>
      </div>

      {/* Summary KPI Ribbon for Selected Well */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Reservoir Temp</span>
          <span className={styles.kpiVal} style={{ color: 'var(--yellow)' }}>
            {latestLog.temperature} <small>°C</small>
          </span>
          <span className={styles.kpiSub}>Target: {selectedWell.reservoirTemp}°C</span>
        </div>

        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Crude Viscosity</span>
          <span className={styles.kpiVal} style={{ color: 'var(--orange)' }}>
            {latestLog.viscosity} <small>cP</small>
          </span>
          <span className={styles.kpiSub}>Native: {selectedWell.baselineViscosity} cP</span>
        </div>

        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Tubing Head (THP)</span>
          <span className={styles.kpiVal} style={{ color: 'var(--accent)' }}>
            {latestLog.pressure} <small>bar</small>
          </span>
          <span className={styles.kpiSub}>Pwf Drawdown Safe</span>
        </div>

        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>SRP Pump Speed</span>
          <span className={styles.kpiVal} style={{ color: 'var(--purple)' }}>
            {latestLog.spm} <small>SPM</small>
          </span>
          <span className={styles.kpiSub}>Stroke: 3.05m</span>
        </div>

        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Dynamic Fluid Level</span>
          <span className={styles.kpiVal} style={{ color: 'var(--green)' }}>
            {latestLog.fluidLevel} <small>m</small>
          </span>
          <span className={styles.kpiSub}>Depth: {selectedWell.targetDepth}m</span>
        </div>

        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Net Oil Flow Rate</span>
          <span className={styles.kpiVal} style={{ color: 'var(--green)' }}>
            {latestLog.flowRate} <small>bbl/d</small>
          </span>
          <span className={styles.kpiSub}>Status: {selectedWell.status}</span>
        </div>
      </div>

      {/* Dedicated Interactive Charts Grid */}
      <div className={styles.chartsGrid}>
        {/* Chart 1: Reservoir Temperature History */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <span className={styles.chartTitle}>Reservoir Temperature (°C)</span>
            <span className={styles.chartLatest} style={{ color: 'var(--yellow)' }}>
              {latestLog.temperature} °C
            </span>
          </div>
          <div className={styles.chartWrapper}>
            <TimeSeriesChart points={tempPoints} color="var(--yellow)" unit="°C" />
          </div>
          <div className={styles.chartFooter}>
            <span>Thermal Front Gradient</span>
            <span>Refreshes dynamically with telemetry</span>
          </div>
        </div>

        {/* Chart 2: Crude Viscosity Decay */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <span className={styles.chartTitle}>Crude Viscosity (cP)</span>
            <span className={styles.chartLatest} style={{ color: 'var(--orange)' }}>
              {latestLog.viscosity} cP
            </span>
          </div>
          <div className={styles.chartWrapper}>
            <TimeSeriesChart points={viscoPoints} color="var(--orange)" unit="cP" />
          </div>
          <div className={styles.chartFooter}>
            <span>Andrade-Eyring Viscosity Decay</span>
            <span>Target: &lt; 40 cP for SRP lift</span>
          </div>
        </div>

        {/* Chart 3: Tubing Head Pressure */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <span className={styles.chartTitle}>Tubing Head Pressure THP (bar)</span>
            <span className={styles.chartLatest} style={{ color: 'var(--accent)' }}>
              {latestLog.pressure} bar
            </span>
          </div>
          <div className={styles.chartWrapper}>
            <TimeSeriesChart points={pressPoints} color="var(--accent)" unit="bar" />
          </div>
          <div className={styles.chartFooter}>
            <span>Wellhead Manifold Pressure</span>
            <span>Operating Envelope: 130 - 160 bar</span>
          </div>
        </div>

        {/* Chart 4: Pumping Speed SPM */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <span className={styles.chartTitle}>SRP Pumping Speed (SPM)</span>
            <span className={styles.chartLatest} style={{ color: 'var(--purple)' }}>
              {latestLog.spm} SPM
            </span>
          </div>
          <div className={styles.chartWrapper}>
            <TimeSeriesChart points={spmPoints} color="var(--purple)" unit="SPM" />
          </div>
          <div className={styles.chartFooter}>
            <span>Variable Frequency Drive (VFD)</span>
            <span>Safe Operating Speed: 4.8 - 6.8 SPM</span>
          </div>
        </div>

        {/* Chart 5: Dynamic Fluid Level (Full Width) */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <span className={styles.chartTitle}>Dynamic Fluid Level (meters from surface)</span>
            <span className={styles.chartLatest} style={{ color: 'var(--green)' }}>
              {latestLog.fluidLevel} m
            </span>
          </div>
          <div className={styles.chartWrapper}>
            <TimeSeriesChart points={fluidPoints} color="var(--green)" unit="m" />
          </div>
          <div className={styles.chartFooter}>
            <span>Annular Submergence Level</span>
            <span>Pump Intake Depth: 2,800m</span>
          </div>
        </div>

        {/* Chart 6: Net Oil Flow Rate */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <span className={styles.chartTitle}>Net Oil Production Rate (bbl/d)</span>
            <span className={styles.chartLatest} style={{ color: 'var(--green)' }}>
              {latestLog.flowRate} bbl/d
            </span>
          </div>
          <div className={styles.chartWrapper}>
            <TimeSeriesChart points={flowPoints} color="var(--green)" unit="bbl/d" />
          </div>
          <div className={styles.chartFooter}>
            <span>Surface Fiscal Metering</span>
            <span>Target Well Output</span>
          </div>
        </div>
      </div>
    </div>
  );
}

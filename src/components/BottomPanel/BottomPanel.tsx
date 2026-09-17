import { useState } from 'react';
import { useDigitalTwin } from '../../context/DigitalTwinContext';
import styles from './BottomPanel.module.css';

/* High-fidelity macOS Sparkline SVG */
function Sparkline({
  data,
  color,
  height = 54,
}: {
  data: number[];
  color: string;
  height?: number;
}) {
  const w = 380;
  const h = height;
  const safeData = data.length > 1 ? data : [10, 12, 11, 14, 13, 15, 14];
  const min = Math.min(...safeData);
  const max = Math.max(...safeData);
  const range = max - min || 1;
  const step = w / (safeData.length - 1);

  const points = safeData
    .map((v, i) => `${i * step},${h - ((v - min) / range) * (h - 14) - 7}`)
    .join(' ');

  const areaPoints = `0,${h} ${points} ${w},${h}`;
  const gradId = `grad-${color.replace(/[^a-zA-Z0-9]/g, '')}`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={styles.sparkline} preserveAspectRatio="none">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.01" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#${gradId})`} />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.75"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* Active Head Circle */}
      <circle
        cx={(safeData.length - 1) * step}
        cy={h - ((safeData[safeData.length - 1] - min) / range) * (h - 14) - 7}
        r="3.5"
        fill="#fff"
        stroke={color}
        strokeWidth="1.5"
      />
    </svg>
  );
}

export function BottomPanel() {
  const { telemetry, telemetryHistory } = useDigitalTwin();
  const [tab, setTab] = useState<'production' | 'pressure' | 'fluid' | 'power'>('production');

  // Derive historical streams from telemetryHistory
  const prodStream =
    telemetryHistory.length > 3
      ? telemetryHistory.map((t) => t.oilProductionRate)
      : [39.2, 40.1, 41.5, 41.2, 42.3, 41.8, 42.5];

  const pressStream =
    telemetryHistory.length > 3
      ? telemetryHistory.map((t) => t.tubingHeadPressure)
      : [147.2, 147.8, 148.5, 148.1, 148.9, 148.5];

  const fluidStream =
    telemetryHistory.length > 3
      ? telemetryHistory.map((t) => t.dynamicFluidLevel)
      : [1240, 1245, 1250, 1255, 1252, 1258];

  const powerStream =
    telemetryHistory.length > 3
      ? telemetryHistory.map((t) => t.motorPower)
      : [16.8, 17.1, 17.5, 16.9, 17.2, 17.0];

  const currentConfig = {
    production: {
      data: prodStream,
      color: 'var(--green)',
      label: 'Net Oil Production (bbl/d)',
      val: `${telemetry.oilProductionRate} bbl/d`,
    },
    pressure: {
      data: pressStream,
      color: 'var(--yellow)',
      label: 'Tubing Head Pressure (bar)',
      val: `${telemetry.tubingHeadPressure} bar`,
    },
    fluid: {
      data: fluidStream,
      color: 'var(--accent)',
      label: 'Dynamic Fluid Level (m)',
      val: `${telemetry.dynamicFluidLevel} m`,
    },
    power: {
      data: powerStream,
      color: 'var(--purple)',
      label: 'VFD Motor Power (kW)',
      val: `${telemetry.motorPower} kW`,
    },
  }[tab];

  const optimizationResults = [
    { metric: 'Production Rate', before: '38.2 bbl/d', after: `${telemetry.oilProductionRate} bbl/d`, delta: '+10.7%', good: true },
    { metric: 'Energy Demand', before: '184 kWh/d', after: `${(telemetry.motorPower * 9.5).toFixed(0)} kWh/d`, delta: '-18.0%', good: true },
    { metric: 'Pump Efficiency', before: '67.4%', after: `${telemetry.srpEfficiency}%`, delta: '+8.6%', good: true },
    { metric: 'Rod Shock Load', before: '21,400 lbs', after: `${telemetry.peakPolishedRodLoad} lbs`, delta: '-14.2%', good: true },
  ];

  return (
    <footer className={styles.panel}>
      {/* Dynamic Telemetry Sparkline Section */}
      <div className={styles.chartSection}>
        <div className={styles.chartHeader}>
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${tab === 'production' ? styles.tabActive : ''}`}
              onClick={() => setTab('production')}
            >
              Net Oil Rate
            </button>
            <button
              className={`${styles.tab} ${tab === 'pressure' ? styles.tabActive : ''}`}
              onClick={() => setTab('pressure')}
            >
              THP Pressure
            </button>
            <button
              className={`${styles.tab} ${tab === 'fluid' ? styles.tabActive : ''}`}
              onClick={() => setTab('fluid')}
            >
              Liquid Level
            </button>
            <button
              className={`${styles.tab} ${tab === 'power' ? styles.tabActive : ''}`}
              onClick={() => setTab('power')}
            >
              Motor kW
            </button>
          </div>

          <div className={styles.chartMeta}>
            <span
              style={{
                color: currentConfig.color,
                fontFamily: 'var(--font-mono)',
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              {currentConfig.val}
            </span>
            <span className={styles.chartUnit}>{currentConfig.label}</span>
            <span className={styles.liveTag}>LIVE SCADA</span>
          </div>
        </div>

        <div className={styles.chartBody}>
          <Sparkline data={currentConfig.data} color={currentConfig.color} height={60} />
        </div>
      </div>

      <div className={styles.separator} />

      {/* Casing Annular Pressure Trend */}
      <div className={styles.miniChartSection}>
        <div className={styles.miniHeader}>
          <span className={styles.miniTitle}>Casing Pressure (CHP)</span>
          <span className={styles.miniVal}>{telemetry.casingHeadPressure} bar</span>
        </div>
        <div className={styles.miniBody}>
          <Sparkline
            data={telemetryHistory.length > 2 ? telemetryHistory.map((t) => t.casingHeadPressure) : [90.8, 91.2, 91.0, 91.5, 91.2]}
            color="var(--accent)"
            height={60}
          />
        </div>
      </div>

      <div className={styles.separator} />

      {/* Autonomous AI Optimization Audit */}
      <div className={styles.auditSection}>
        <div className={styles.auditHeader}>
          <span className={styles.auditTitle}>CLOSED-LOOP AI OPTIMIZATION AUDIT</span>
          <span className={styles.auditSavings}>Estimated: ₹4,200 / day saved</span>
        </div>

        <div className={styles.auditGrid}>
          {optimizationResults.map((item) => (
            <div key={item.metric} className={styles.auditRow}>
              <span className={styles.auditMetric}>{item.metric}</span>
              <span className={styles.auditBefore}>{item.before}</span>
              <span className={styles.auditArrow}>→</span>
              <span className={styles.auditAfter}>{item.after}</span>
              <span
                className={styles.auditDelta}
                style={{ color: item.good ? 'var(--green)' : 'var(--red)' }}
              >
                {item.delta}
              </span>
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}

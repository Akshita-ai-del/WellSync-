import { useDigitalTwin } from '../../context/DigitalTwinContext';
import styles from './RightPanel.module.css';

export function RightPanel() {
  const { activeWell, telemetry, alerts, applyAlertAction, controls, updateControls } = useDigitalTwin();

  if (!telemetry || !activeWell) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', padding: '2rem', textAlign: 'center', color: '#888' }}>
        No telemetry data available. Awaiting connection to Digital Twin backend.
      </div>
    );
  }


  const kpis = [
    {
      label: 'Net Oil Production',
      value: `${telemetry.oilProductionRate} bbl/d`,
      delta: '+4.2%',
      positive: true,
      sub: `Gross: ${telemetry.grossRate} bbl/d`,
    },
    {
      label: 'Water Cut',
      value: `${telemetry.waterCut}%`,
      delta: '-0.8%',
      positive: true,
      sub: 'Formation water cut',
    },
    {
      label: 'Pump Fillage',
      value: `${telemetry.pumpFillage}%`,
      delta: telemetry.pumpFillage < 65 ? '-18.4%' : '+2.1%',
      positive: telemetry.pumpFillage >= 65,
      sub: telemetry.dynacardCondition,
    },
    {
      label: 'Motor Power Demand',
      value: `${telemetry.motorPower} kW`,
      delta: '-12.0%',
      positive: true,
      sub: `${telemetry.motorCurrent} A @ 42 Hz`,
    },
  ];

  return (
    <aside className={styles.panel}>
      {/* Real-time KPIs */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTitle}>MULTIDISCIPLINARY KPIS</span>
          <span className={styles.liveTag}>LIVE</span>
        </div>

        <div className={styles.kpiGrid}>
          {kpis.map((kpi) => (
            <div key={kpi.label} className={styles.kpiCard}>
              <span className={styles.kpiLabel}>{kpi.label}</span>
              <span className={styles.kpiValue}>{kpi.value}</span>
              <div className={styles.kpiFooter}>
                <span
                  className={styles.kpiDelta}
                  style={{ color: kpi.positive ? 'var(--green)' : 'var(--red)' }}
                >
                  {kpi.positive ? '▲' : '▼'} {kpi.delta}
                </span>
                <span className={styles.kpiSub}>{kpi.sub}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className={styles.divider} />

      {/* Autonomous AI Optimization Alerts */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTitle}>AI ANOMALY & OPTIMIZATION ADVISORIES</span>
          <span className={styles.alertCount}>{alerts.length} Active</span>
        </div>

        <div className={styles.alertList}>
          {alerts.map((alert) => {
            const isCritical = alert.severity === 'critical';
            const isWarning = alert.severity === 'warning';
            const isSuccess = alert.severity === 'success';

            const color = isCritical
              ? 'var(--red)'
              : isWarning
              ? 'var(--yellow)'
              : isSuccess
              ? 'var(--green)'
              : 'var(--accent)';

            const bg = isCritical
              ? 'var(--red-dim)'
              : isWarning
              ? 'var(--yellow-dim)'
              : isSuccess
              ? 'var(--green-dim)'
              : 'var(--accent-dim)';

            return (
              <div
                key={alert.id}
                className={styles.alertCard}
                style={{ borderLeftColor: color }}
              >
                <div className={styles.alertHeader}>
                  <span
                    className={styles.alertBadge}
                    style={{ color, background: bg, borderColor: color }}
                  >
                    [{alert.subsystem}] {alert.severity.toUpperCase()}
                  </span>
                  <span className={styles.alertTime}>{alert.timeAgo}</span>
                </div>

                <h4 className={styles.alertTitle}>{alert.title}</h4>
                <p className={styles.alertBody}>{alert.description}</p>

                <button
                  className={styles.actionBtn}
                  style={{ color, borderColor: color }}
                  onClick={() => applyAlertAction(alert)}
                >
                  {alert.actionLabel} →
                </button>
              </div>
            );
          })}
        </div>
      </section>

      <div className={styles.divider} />

      {/* Quick Scenario Injection */}
      <section className={styles.section}>
        <span className={styles.sectionTitle}>SIMULATION BENCH OVERRIDE</span>
        <div className={styles.overrideBox}>
          <div className={styles.overrideRow}>
            <span>Target Pumping Speed:</span>
            <span className={styles.overrideVal}>{controls.pumpSpeed} SPM</span>
          </div>
          <input
            type="range"
            min="4.0"
            max="8.0"
            step="0.1"
            value={controls.pumpSpeed}
            onChange={(e) => updateControls({ pumpSpeed: +e.target.value })}
            className={styles.slider}
          />
        </div>
      </section>
    </aside>
  );
}

import { useEffect, useState } from 'react';
import { useDigitalTwin } from '../../context/DigitalTwinContext';
import styles from './TopBar.module.css';

export function TopBar() {
  const { activeWell, telemetry, isStreaming, setIsStreaming } = useDigitalTwin();
  
  const [clock, setClock] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setClock(now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const id = setInterval(updateTime, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className={styles.bar}>
      {/* macOS Traffic Lights + Breadcrumb */}
      <div className={styles.left}>
        <div className={styles.brandGroup}>
          <span className={styles.brandTitle}>WellSync</span>
        </div>

        <div className={styles.breadcrumb}>
          <span className={styles.bcItem}>ONGC Rajasthan</span>
          <span className={styles.bcSep}>/</span>
          <span className={styles.bcItem}>{activeWell?.name || 'No Well'}</span>
          <span className={styles.bcSep}>/</span>
          <span className={styles.bcActive}>Multiphysics Twin</span>
        </div>
      </div>

      {/* Right side live telemetry readout */}
      <div className={styles.right}>
        <div className={styles.statPill}>
          <span className={styles.statLabel}>PORE PRESSURE</span>
          <span className={styles.statVal} style={{ color: 'var(--yellow)' }}>
            {telemetry?.porePressure || '-'} <small>bar</small>
          </span>
        </div>

        <div className={styles.statPill}>
          <span className={styles.statLabel}>FLOW RATE</span>
          <span className={styles.statVal} style={{ color: 'var(--green)' }}>
            {telemetry?.oilProductionRate || '-'} <small>bbl/d</small>
          </span>
        </div>

        <div className={styles.statPill}>
          <span className={styles.statLabel}>GOR</span>
          <span className={styles.statVal} style={{ color: 'var(--accent)' }}>
            {telemetry?.gasOilRatio || '-'} <small>scf/bbl</small>
          </span>
        </div>

        <div className={styles.statPill}>
          <span className={styles.statLabel}>FLUID LEVEL</span>
          <span className={styles.statVal}>
            {telemetry?.dynamicFluidLevel || '-'} <small>m</small>
          </span>
        </div>

        <button
          className={`${styles.streamBadge} ${isStreaming ? styles.streamLive : styles.streamPaused}`}
          onClick={() => setIsStreaming(!isStreaming)}
          title={isStreaming ? 'Click to Pause SCADA Stream' : 'Click to Resume Live Stream'}
        >
          <span className={styles.streamDot} />
          {isStreaming ? 'LIVE SCADA' : 'PAUSED'}
        </button>

        <div className={styles.clockBox}>
          <span className={styles.clockText}>{clock}</span>
        </div>
      </div>
    </header>
  );
}

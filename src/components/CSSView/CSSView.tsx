import { useState } from 'react';
import { useDigitalTwin } from '../../context/DigitalTwinContext';
import styles from './CSSView.module.css';

export function CSSView() {
  const { activeWell, telemetry, controls, updateControls } = useDigitalTwin();
  const [steamTemp, setSteamTemp] = useState(285);
  const [steamRate, setSteamRate] = useState(150);

  // Viscosity vs Temperature curve (Andrade-Eyring equation for heavy crude)
  const tempSteps = [30, 50, 70, 90, 120, 150, 180, 220, 280];
  const viscosityValues = tempSteps.map((t) => {
    // exponential decay from 180 cP at 30°C to 4 cP at 280°C
    return +(180 * Math.exp(-0.016 * (t - 30)) + 3).toFixed(1);
  });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <div className={styles.badgeRow}>
            <span className={styles.pill}>THERMAL EOR TWIN</span>
            <span className={styles.subPill}>CYCLIC STEAM STIMULATION (CSS)</span>
          </div>
          <h1 className={styles.title}>Reservoir Thermal Stimulation & Viscosity Model</h1>
          <p className={styles.subtitle}>
            Coupled thermodynamic reservoir simulation for heavy oil mobilization in the Jodhpur Sandstone formation ({activeWell.name}).
          </p>
        </div>

        <div className={styles.cycleBadge}>
          <span className={styles.cycleNumber}>Cycle #{activeWell.cssCycle}</span>
          <span className={styles.cyclePhase}>Production Phase · Day {controls.cssCycleDay} of 180</span>
        </div>
      </header>

      {/* Main Grid */}
      <div className={styles.grid}>
        {/* Steam Front Visualization */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>Radial Thermal Bank Propagation ($R_{'{'}th{'}'}$)</span>
            <span className={styles.cardTag}>Radius: {telemetry.steamZoneRadius} m</span>
          </div>

          <div className={styles.heatMapContainer}>
            <div className={styles.heatConcentric}>
              <div className={styles.zoneCore}>
                <span className={styles.coreLabel}>Wellbore</span>
                <span className={styles.coreTemp}>240°C</span>
              </div>
              <div className={styles.zoneNear}>
                <span className={styles.zoneLabel}>Steam Chamber (Viscosity: 22 cP)</span>
              </div>
              <div className={styles.zoneMid}>
                <span className={styles.zoneLabel}>Heated Mobile Oil Zone (Viscosity: 48 cP)</span>
              </div>
              <div className={styles.zoneOuter}>
                <span className={styles.zoneLabel}>Native Reservoir Rock (78.4°C · 145 cP)</span>
              </div>
            </div>

            <div className={styles.heatLegend}>
              <span className={styles.legendItem}>
                <span className={styles.legendDot} style={{ background: '#ff4b72' }} /> &gt;200°C Steam
              </span>
              <span className={styles.legendItem}>
                <span className={styles.legendDot} style={{ background: '#ff8c00' }} /> 120–200°C Mobile Zone
              </span>
              <span className={styles.legendItem}>
                <span className={styles.legendDot} style={{ background: '#ffc837' }} /> 85–120°C Heat Front
              </span>
              <span className={styles.legendItem}>
                <span className={styles.legendDot} style={{ background: '#00e5ff' }} /> 78°C Virgin Reservoir
              </span>
            </div>
          </div>
        </div>

        {/* Viscosity Reduction Curve */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>Crude Viscosity vs Formation Temperature</span>
            <span className={styles.cardTag}>Native: {activeWell.baselineViscosity} cP → Current: {telemetry.crudeViscosity} cP</span>
          </div>

          <div className={styles.chartBox}>
            <div className={styles.viscoGraph}>
              {tempSteps.map((temp, i) => {
                const visco = viscosityValues[i];
                const heightPct = Math.min(100, Math.max(8, (visco / 180) * 100));
                const isCurrent = temp >= 70 && temp <= 90;
                return (
                  <div key={temp} className={styles.viscoBarCol}>
                    <span className={styles.viscoVal}>{visco}</span>
                    <div
                      className={`${styles.viscoBar} ${isCurrent ? styles.viscoBarActive : ''}`}
                      style={{ height: `${heightPct}%` }}
                    />
                    <span className={styles.viscoTemp}>{temp}°C</span>
                  </div>
                );
              })}
            </div>
            <p className={styles.chartFootnote}>
              *Thermal stimulation achieves an <strong>82.4% viscosity reduction</strong> near the sandface, enabling the sucker rod pump to lift heavy crude without rod float.
            </p>
          </div>
        </div>
      </div>

      {/* Cycle Parameters & Interactive Simulator */}
      <div className={styles.bottomCard}>
        <div className={styles.bottomCardHeader}>
          <span className={styles.bottomTitle}>CSS Thermodynamic Parameters & Injection Controls</span>
          <span className={styles.formula}>Oil-Steam Ratio (OSR): <strong>{telemetry.cumulativeOSR} bbl/t</strong></span>
        </div>

        <div className={styles.simControls}>
          <div className={styles.simInputGroup}>
            <div className={styles.simLabelRow}>
              <span>Steam Generator Temp</span>
              <span className={styles.simValue}>{steamTemp} °C</span>
            </div>
            <input
              type="range"
              min="240"
              max="320"
              value={steamTemp}
              onChange={(e) => setSteamTemp(+e.target.value)}
              className={styles.rangeInput}
            />
          </div>

          <div className={styles.simInputGroup}>
            <div className={styles.simLabelRow}>
              <span>Steam Injection Rate</span>
              <span className={styles.simValue}>{steamRate} t/d</span>
            </div>
            <input
              type="range"
              min="80"
              max="240"
              value={steamRate}
              onChange={(e) => setSteamRate(+e.target.value)}
              className={styles.rangeInput}
            />
          </div>

          <div className={styles.simInputGroup}>
            <div className={styles.simLabelRow}>
              <span>Cycle Day Tracker</span>
              <span className={styles.simValue}>Day {controls.cssCycleDay}</span>
            </div>
            <input
              type="range"
              min="1"
              max="180"
              value={controls.cssCycleDay}
              onChange={(e) => updateControls({ cssCycleDay: +e.target.value })}
              className={styles.rangeInput}
            />
          </div>

          <div className={styles.simStats}>
            <div className={styles.simStatItem}>
              <span className={styles.sLabel}>Steam Quality</span>
              <span className={styles.sVal}>{telemetry.steamQuality}%</span>
            </div>
            <div className={styles.simStatItem}>
              <span className={styles.sLabel}>Cumulative Injected</span>
              <span className={styles.sVal}>4,850 tonnes</span>
            </div>
            <div className={styles.simStatItem}>
              <span className={styles.sLabel}>Incremental Recovery</span>
              <span className={styles.sVal} style={{ color: 'var(--green)' }}>+18,240 bbl</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

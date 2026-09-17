import { useEffect, useState } from 'react';
import { useDigitalTwin } from '../../context/DigitalTwinContext';
import styles from './SRPView.module.css';

export function SRPView() {
  const { telemetry, controls, updateControls } = useDigitalTwin();
  const [strokePhase, setStrokePhase] = useState(0); // 0 to 1 cycle

  // Reciprocating stroke cycle animation (0 to 2PI)
  useEffect(() => {
    let frameId: number;
    let start = performance.now();
    const cycleMs = (60 / controls.pumpSpeed) * 1000;

    const animate = (now: number) => {
      const elapsed = (now - start) % cycleMs;
      setStrokePhase(elapsed / cycleMs);
      frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [controls.pumpSpeed]);

  const isUpstroke = strokePhase < 0.5;
  const strokePosition = Math.sin(strokePhase * Math.PI * 2) * 0.5 + 0.5; // 0 to 1

  // Dynamometer Card SVG Generator
  // In a real SRP dynacard:
  // X = Position (0 to 120 in)
  // Y = Polished Rod Load (lbs)
  const isPound = telemetry.dynacardCondition === 'Fluid Pound';
  const isGas = telemetry.dynacardCondition === 'Gas Interference';

  // Surface Dynacard coordinates
  const surfacePoints = [
    { x: 10, y: 150 },
    { x: 30, y: 45 },
    { x: 90, y: 38 },
    { x: 190, y: 40 },
    { x: 270, y: 42 },
    { x: 290, y: 65 },
    { x: 270, y: 140 },
    // fluid pound creates a sharp notch / drop on downstroke
    { x: 180, y: isPound ? 155 : 142 },
    { x: 120, y: isPound ? 160 : 145 },
    { x: 40, y: isGas ? 130 : 148 },
    { x: 10, y: 150 },
  ];

  // Downhole Pump Card coordinates (Plunger load)
  const pumpPoints = [
    { x: 30, y: 140 },
    { x: 40, y: 60 },
    { x: 270, y: 58 },
    { x: 280, y: 138 },
    // If fluid pound, downhole card is truncated
    { x: isPound ? 160 : 270, y: 140 },
    { x: 30, y: 140 },
  ];

  const surfacePath = surfacePoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const pumpPath = pumpPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  // Current marker on dynacard along stroke
  const markerX = 20 + strokePosition * 260;
  const markerY = isUpstroke ? 42 : isPound && strokePosition > 0.4 ? 155 : 144;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <div className={styles.badgeRow}>
            <span className={styles.tag}>ARTIFICIAL LIFT DIGITAL TWIN</span>
            <span className={styles.subTag}>BEAM PUMPING UNIT · CLASS I LEVER</span>
          </div>
          <h1 className={styles.title}>Sucker Rod Pump (SRP) & Dynacard Diagnostic Lab</h1>
          <p className={styles.subtitle}>
            Coupled electromechanical simulation of surface walking beam, sucker rod string elasticity, and downhole pump barrel acoustics.
          </p>
        </div>

        <div className={styles.conditionBox}>
          <span className={styles.conditionLabel}>Pump Card Condition</span>
          <span
            className={styles.conditionVal}
            style={{
              color:
                telemetry.dynacardCondition === 'Normal Full Fillage'
                  ? 'var(--green)'
                  : telemetry.dynacardCondition === 'Fluid Pound'
                  ? 'var(--red)'
                  : 'var(--yellow)',
            }}
          >
            {telemetry.dynacardCondition}
          </span>
          <span className={styles.fillageVal}>Fillage: {telemetry.pumpFillage}%</span>
        </div>
      </header>

      {/* Main Grid */}
      <div className={styles.grid}>
        {/* Real-time Dynacard Plot */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardHeaderLeft}>
              <span className={styles.cardTitle}>Live Dynamometer Card (Load vs Position)</span>
              <span className={styles.cardSubtitle}>Surface vs Downhole Pump Card</span>
            </div>
            <div className={styles.cardLegend}>
              <span className={styles.legendItem}>
                <span className={styles.legendLine} style={{ background: 'var(--accent)' }} /> Surface Card
              </span>
              <span className={styles.legendItem}>
                <span className={styles.legendLine} style={{ background: 'var(--green)' }} /> Downhole Card
              </span>
            </div>
          </div>

          <div className={styles.dynacardPlotWrapper}>
            <svg viewBox="0 0 320 200" className={styles.dynacardSvg}>
              {/* Grid Lines */}
              <line x1="20" y1="20" x2="20" y2="180" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
              <line x1="85" y1="20" x2="85" y2="180" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
              <line x1="150" y1="20" x2="150" y2="180" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
              <line x1="215" y1="20" x2="215" y2="180" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
              <line x1="280" y1="20" x2="280" y2="180" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />

              <line x1="20" y1="40" x2="300" y2="40" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
              <line x1="20" y1="90" x2="300" y2="90" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
              <line x1="20" y1="140" x2="300" y2="140" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
              <line x1="20" y1="180" x2="300" y2="180" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />

              {/* Downhole Card (Green) */}
              <path d={pumpPath} fill="rgba(0, 242, 155, 0.08)" stroke="var(--green)" strokeWidth="1.5" />

              {/* Surface Card (Cyan) */}
              <path d={surfacePath} fill="rgba(0, 229, 255, 0.12)" stroke="var(--accent)" strokeWidth="2" />

              {/* Live Stroke Position Marker */}
              <circle cx={markerX} cy={markerY} r="5" fill="#fff" stroke="var(--accent)" strokeWidth="2">
                <animate attributeName="r" values="4;6;4" dur="1s" repeatCount="indefinite" />
              </circle>
            </svg>

            <div className={styles.axisLabels}>
              <span className={styles.yAxisTop}>PPRL: {telemetry.peakPolishedRodLoad} lbs</span>
              <span className={styles.yAxisBottom}>MPRL: {telemetry.minPolishedRodLoad} lbs</span>
              <span className={styles.xAxisLeft}>0 in (Bottom)</span>
              <span className={styles.xAxisRight}>120 in (Top)</span>
            </div>
          </div>

          <div className={styles.strokeBar}>
            <span className={styles.strokeLabel}>
              Reciprocating Stroke Cycle: <strong>{isUpstroke ? '▲ UPSTROKE (Fluid Lift)' : '▼ DOWNSTROKE (Barrel Refill)'}</strong>
            </span>
            <div className={styles.strokeTrack}>
              <div
                className={styles.strokeIndicator}
                style={{ left: `${strokePosition * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Mechanical Digital Twin & Valves */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>Subsurface Pump & Valve Dynamics</span>
            <span className={styles.cardTag}>{controls.pumpSpeed} SPM · {telemetry.strokeLength}m Stroke</span>
          </div>

          <div className={styles.mechGrid}>
            <div className={styles.valveCard}>
              <span className={styles.vTitle}>Traveling Valve (TV)</span>
              <span
                className={styles.vState}
                style={{ color: isUpstroke ? 'var(--red)' : 'var(--green)' }}
              >
                {isUpstroke ? '● CLOSED (Lifting Liquid)' : '○ OPEN (Refilling Barrel)'}
              </span>
              <span className={styles.vNote}>Location: Moving Plunger</span>
            </div>

            <div className={styles.valveCard}>
              <span className={styles.vTitle}>Standing Valve (SV)</span>
              <span
                className={styles.vState}
                style={{ color: isUpstroke ? 'var(--green)' : 'var(--red)' }}
              >
                {isUpstroke ? '○ OPEN (Reservoir Inflow)' : '● CLOSED (Holding Column)'}
              </span>
              <span className={styles.vNote}>Location: Stationary Barrel Base</span>
            </div>
          </div>

          <div className={styles.mechanicalHealthList}>
            <div className={styles.mechItem}>
              <span className={styles.mKey}>Rod String Stress Safety Factor</span>
              <span className={styles.mVal} style={{ color: isPound ? 'var(--red)' : 'var(--green)' }}>
                {isPound ? '1.14 (High Shock Fatigue)' : '1.82 (Good Margin)'}
              </span>
            </div>
            <div className={styles.mechItem}>
              <span className={styles.mKey}>Gearbox Rated Torque Loading</span>
              <span className={styles.mVal}>{isPound ? '88.4%' : '64.2%'}</span>
            </div>
            <div className={styles.mechItem}>
              <span className={styles.mKey}>Motor Power Consumption</span>
              <span className={styles.mVal} style={{ color: 'var(--yellow)' }}>
                {telemetry.motorPower} kW ({telemetry.motorCurrent} A)
              </span>
            </div>
            <div className={styles.mechItem}>
              <span className={styles.mKey}>Volumetric Lift Efficiency</span>
              <span className={styles.mVal} style={{ color: 'var(--accent)' }}>
                {telemetry.srpEfficiency}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive VFD Tuning & Anomaly Simulator */}
      <div className={styles.controlsBar}>
        <div className={styles.ctrlHeader}>
          <span className={styles.ctrlTitle}>VFD Speed Controller & Anomaly Test Bench</span>
          <span className={styles.ctrlTip}>Tune speed in real-time to watch dynacard response</span>
        </div>

        <div className={styles.ctrlRow}>
          <div className={styles.vfdSliderBox}>
            <div className={styles.vfdLabelRow}>
              <span>Adjust VFD Pumping Speed</span>
              <span className={styles.vfdVal}>{controls.pumpSpeed} SPM</span>
            </div>
            <input
              type="range"
              min="3.5"
              max="9.0"
              step="0.1"
              value={controls.pumpSpeed}
              onChange={(e) => updateControls({ pumpSpeed: +e.target.value })}
              className={styles.rangeInput}
            />
            <div className={styles.vfdRangeMarks}>
              <span>3.5 (Underpumping)</span>
              <span style={{ color: 'var(--green)' }}>5.6–6.0 (Optimal IPR)</span>
              <span style={{ color: 'var(--red)' }}>&gt;6.8 (Fluid Pound Risk)</span>
            </div>
          </div>

          <div className={styles.anomalyButtons}>
            <span className={styles.anomalyLabel}>Inject Test Scenarios:</span>
            <div className={styles.btnGroup}>
              <button
                className={`${styles.anomalyBtn} ${controls.injectedAnomaly === 'none' ? styles.btnActive : ''}`}
                onClick={() => updateControls({ injectedAnomaly: 'none', pumpSpeed: 5.8 })}
              >
                Optimal Baseline
              </button>
              <button
                className={`${styles.anomalyBtn} ${controls.injectedAnomaly === 'fluid_pound' ? styles.btnActiveRed : ''}`}
                onClick={() => updateControls({ injectedAnomaly: 'fluid_pound', pumpSpeed: 7.2 })}
              >
                Force Fluid Pound
              </button>
              <button
                className={`${styles.anomalyBtn} ${controls.injectedAnomaly === 'gas_interference' ? styles.btnActiveYellow : ''}`}
                onClick={() => updateControls({ injectedAnomaly: 'gas_interference' })}
              >
                Gas Interference
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

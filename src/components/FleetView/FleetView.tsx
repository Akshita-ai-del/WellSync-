import { useState, useMemo } from 'react';
import { useDigitalTwin, type WellConfig, type WellStatus } from '../../context/DigitalTwinContext';
import styles from './FleetView.module.css';

export function FleetView() {
  const { wells, activeWell, setActiveWellId, updateWellConfig, telemetry } = useDigitalTwin();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [editingWell, setEditingWell] = useState<WellConfig | null>(null);

  const wellList = useMemo(() => Object.values(wells), [wells]);

  const workingWellsCount = useMemo(() => {
    return wellList.filter((w) => w.status !== 'Shut-in / Workover').length;
  }, [wellList]);

  const filteredWells = useMemo(() => {
    return wellList.filter((w) => {
      const matchSearch =
        !searchQuery.trim() ||
        w.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.name.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchSearch) return false;

      if (filterStatus === 'working') return w.status !== 'Shut-in / Workover';
      if (filterStatus === 'producing') return w.status === 'Producing';
      if (filterStatus === 'soaking') return w.status === 'Steam Soaking';
      if (filterStatus === 'alert') return w.status === 'Optimization Alert';
      if (filterStatus === 'shutin') return w.status === 'Shut-in / Workover';

      return true;
    });
  }, [wellList, searchQuery, filterStatus]);

  const handleSaveParams = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWell) return;
    updateWellConfig(editingWell.id, {
      reservoirTemp: editingWell.reservoirTemp,
      baselineViscosity: editingWell.baselineViscosity,
      targetDepth: editingWell.targetDepth,
      targetRate: editingWell.targetRate,
      status: editingWell.status,
    });
    setEditingWell(null);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <div className={styles.badgeRow}>
            <span className={styles.tag}>ONGC RAJASTHAN ASSET</span>
            <span className={styles.fieldTag}>BAGHEWALA HEAVY OIL BASIN</span>
          </div>
          <h1 className={styles.title}>Field Multi-Well Fleet Digital Twin</h1>
          <p className={styles.subtitle}>
            Comprehensive 52-well telemetry monitoring system. Currently operating <strong>{workingWellsCount} active working wells</strong> with coupled multiphysics modeling.
          </p>
        </div>

        <div className={styles.statsStrip}>
          <div className={styles.statBox}>
            <span className={styles.statLabel}>Total Field Wells</span>
            <span className={styles.statNum}>52 <small>Total</small></span>
          </div>
          <div className={styles.statBox}>
            <span className={styles.statLabel}>Working Wells</span>
            <span className={styles.statNum} style={{ color: 'var(--green)' }}>
              {workingWellsCount} <small>Active</small>
            </span>
          </div>
          <div className={styles.statBox}>
            <span className={styles.statLabel}>Shut-in / Workover</span>
            <span className={styles.statNum} style={{ color: 'var(--text-muted)' }}>
              {52 - workingWellsCount} <small>Offline</small>
            </span>
          </div>
          <div className={styles.statBox}>
            <span className={styles.statLabel}>Active Digital Twin</span>
            <span className={styles.statNum} style={{ color: 'var(--accent)' }}>
              {activeWell.id}
            </span>
          </div>
        </div>
      </header>

      {/* Search & Filter Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <input
            type="text"
            placeholder="Search by Well ID (e.g. BW-07, BW-14, BW-34)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
          {searchQuery && (
            <button className={styles.clearBtn} onClick={() => setSearchQuery('')}>
              ✕
            </button>
          )}
        </div>

        <div className={styles.filterPills}>
          <button
            className={`${styles.filterPill} ${filterStatus === 'all' ? styles.pillActive : ''}`}
            onClick={() => setFilterStatus('all')}
          >
            All Wells (52)
          </button>
          <button
            className={`${styles.filterPill} ${filterStatus === 'working' ? styles.pillActive : ''}`}
            onClick={() => setFilterStatus('working')}
          >
            Working (34)
          </button>
          <button
            className={`${styles.filterPill} ${filterStatus === 'producing' ? styles.pillActive : ''}`}
            onClick={() => setFilterStatus('producing')}
          >
            Producing (26)
          </button>
          <button
            className={`${styles.filterPill} ${filterStatus === 'soaking' ? styles.pillActive : ''}`}
            onClick={() => setFilterStatus('soaking')}
          >
            Steam Soaking (5)
          </button>
          <button
            className={`${styles.filterPill} ${filterStatus === 'alert' ? styles.pillActive : ''}`}
            onClick={() => setFilterStatus('alert')}
          >
            Alert (3)
          </button>
          <button
            className={`${styles.filterPill} ${filterStatus === 'shutin' ? styles.pillActive : ''}`}
            onClick={() => setFilterStatus('shutin')}
          >
            Shut-in (18)
          </button>
        </div>
      </div>

      {/* Grid of 52 Wells */}
      <div className={styles.grid}>
        {filteredWells.map((well) => {
          const isActive = well.id === activeWell.id;
          const statusClass =
            well.status === 'Producing'
              ? styles.statusGreen
              : well.status === 'Optimization Alert'
              ? styles.statusRed
              : well.status === 'Steam Soaking'
              ? styles.statusYellow
              : styles.statusMuted;

          return (
            <div
              key={well.id}
              className={`${styles.card} ${isActive ? styles.activeCard : ''}`}
              onClick={() => setActiveWellId(well.id)}
            >
              <div className={styles.cardTop}>
                <div className={styles.wellTitleBlock}>
                  <div className={styles.macDotWell} />
                  <div>
                    <h3 className={styles.cardName}>{well.id}</h3>
                    <span className={styles.cardField}>{well.name}</span>
                  </div>
                </div>

                <span className={`${styles.statusPill} ${statusClass}`}>
                  <span className={styles.dot} />
                  {well.status}
                </span>
              </div>

              <div className={styles.metricsMatrix}>
                <div className={styles.metricItem}>
                  <span className={styles.mLabel}>Depth</span>
                  <span className={styles.mVal}>{well.targetDepth} m</span>
                </div>
                <div className={styles.metricItem}>
                  <span className={styles.mLabel}>Formation Temp</span>
                  <span className={styles.mVal}>{well.reservoirTemp}°C</span>
                </div>
                <div className={styles.metricItem}>
                  <span className={styles.mLabel}>Viscosity</span>
                  <span className={styles.mVal}>{well.baselineViscosity} cP</span>
                </div>
                <div className={styles.metricItem}>
                  <span className={styles.mLabel}>Target Rate</span>
                  <span className={styles.mVal} style={{ color: 'var(--accent)' }}>
                    {well.targetRate} bbl/d
                  </span>
                </div>
              </div>

              <div className={styles.wellFooter}>
                <button
                  className={styles.tuneBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingWell({ ...well });
                  }}
                  title="Tune & Set Parameters"
                >
                  Set Parameters ⚙
                </button>

                <button
                  className={`${styles.selectBtn} ${isActive ? styles.btnActive : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveWellId(well.id);
                  }}
                >
                  {isActive ? '● Live Active Twin' : 'Switch Twin →'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Well Parameter Setting Modal */}
      {editingWell && (
        <div className={styles.modalOverlay} onClick={() => setEditingWell(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Set Parameters for {editingWell.name}</h3>
              <button className={styles.closeBtn} onClick={() => setEditingWell(null)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveParams} className={styles.modalForm}>
              <div className={styles.inputGroup}>
                <label>Formation Temperature (°C)</label>
                <input
                  type="number"
                  step="0.1"
                  value={editingWell.reservoirTemp}
                  onChange={(e) =>
                    setEditingWell({ ...editingWell, reservoirTemp: +e.target.value })
                  }
                  className={styles.formInput}
                />
              </div>

              <div className={styles.inputGroup}>
                <label>Native Crude Viscosity (cP)</label>
                <input
                  type="number"
                  value={editingWell.baselineViscosity}
                  onChange={(e) =>
                    setEditingWell({ ...editingWell, baselineViscosity: +e.target.value })
                  }
                  className={styles.formInput}
                />
              </div>

              <div className={styles.inputGroup}>
                <label>Target Well Depth (m)</label>
                <input
                  type="number"
                  value={editingWell.targetDepth}
                  onChange={(e) =>
                    setEditingWell({ ...editingWell, targetDepth: +e.target.value })
                  }
                  className={styles.formInput}
                />
              </div>

              <div className={styles.inputGroup}>
                <label>Target Production Rate (bbl/d)</label>
                <input
                  type="number"
                  step="0.1"
                  value={editingWell.targetRate}
                  onChange={(e) =>
                    setEditingWell({ ...editingWell, targetRate: +e.target.value })
                  }
                  className={styles.formInput}
                />
              </div>

              <div className={styles.inputGroup}>
                <label>Operational Status</label>
                <select
                  value={editingWell.status}
                  onChange={(e) =>
                    setEditingWell({ ...editingWell, status: e.target.value as WellStatus })
                  }
                  className={styles.formSelect}
                >
                  <option value="Producing">Producing</option>
                  <option value="Optimization Alert">Optimization Alert</option>
                  <option value="Steam Soaking">Steam Soaking</option>
                  <option value="Shut-in / Workover">Shut-in / Workover</option>
                </select>
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setEditingWell(null)}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.saveBtn}>
                  Save & Sync to Live Twin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Active Well Spotlight HUD */}
      <div className={styles.spotlight}>
        <div className={styles.spotlightHeader}>
          <div className={styles.spotlightTitle}>
            <span className={styles.livePulse} />
            <span>Active Real-Time Telemetry Feed: {activeWell.name}</span>
          </div>
          <span className={styles.syncRate}>Telemetry rate: 1.8s · Coupled Multiphysics Loop</span>
        </div>

        <div className={styles.spotlightGrid}>
          <div className={styles.spotBox}>
            <span className={styles.spotLabel}>Pore Pressure ($P_{'{'}res{'}'}$)</span>
            <span className={styles.spotValue} style={{ color: 'var(--yellow)' }}>
              {telemetry.porePressure} <small>bar</small>
            </span>
            <span className={styles.spotSub}>BHP Drawdown: {telemetry.bottomholeDrawdown} bar</span>
          </div>
          <div className={styles.spotBox}>
            <span className={styles.spotLabel}>Tubing Head (THP)</span>
            <span className={styles.spotValue} style={{ color: 'var(--accent)' }}>
              {telemetry.tubingHeadPressure} <small>bar</small>
            </span>
            <span className={styles.spotSub}>Casing (CHP): {telemetry.casingHeadPressure} bar</span>
          </div>
          <div className={styles.spotBox}>
            <span className={styles.spotLabel}>Dynamic Liquid Level</span>
            <span className={styles.spotValue} style={{ color: 'var(--green)' }}>
              {telemetry.dynamicFluidLevel} <small>m</small>
            </span>
            <span className={styles.spotSub}>Pump Fillage: {telemetry.pumpFillage}%</span>
          </div>
          <div className={styles.spotBox}>
            <span className={styles.spotLabel}>Artificial Lift Speed</span>
            <span className={styles.spotValue} style={{ color: 'var(--purple)' }}>
              {telemetry.pumpSpeed} <small>SPM</small>
            </span>
            <span className={styles.spotSub}>Motor Power: {telemetry.motorPower} kW</span>
          </div>
        </div>
      </div>
    </div>
  );
}

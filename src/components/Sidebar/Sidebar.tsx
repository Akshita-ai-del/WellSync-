import type { ActiveView } from '../../App';
import { useDigitalTwin } from '../../context/DigitalTwinContext';
import styles from './Sidebar.module.css';

interface NavItem {
  id: ActiveView;
  label: string;
  badge?: string;
  category?: string;
}

const navSections: { category: string; items: NavItem[] }[] = [
  {
    category: 'DIGITAL TWIN',
    items: [
      { id: 'dashboard', label: 'Twin Schematic', badge: 'LIVE' },
      { id: 'wells', label: 'Well Fleet', badge: '52 Wells' },
      { id: 'analytics', label: 'Well Analytics', badge: 'GRAPHS' },
    ],
  },
  {
    category: 'SIMULATION LABS',
    items: [
      { id: 'css', label: 'CSS Thermal EOR', badge: 'Cycle 3' },
      { id: 'srp', label: 'SRP Dynacard', badge: 'VFD Lab' },
    ],
  },
  {
    category: 'INTELLIGENCE',
    items: [
      { id: 'ai', label: 'AI Copilot', badge: 'ADVISOR' },
      { id: 'reports', label: 'Surveillance Log', badge: 'DGH' },
    ],
  },
  {
    category: 'STORAGE & TIME-SERIES',
    items: [
      { id: 'database', label: 'TimescaleDB Vault', badge: 'HYPERTABLE' },
    ],
  },
];

interface Props {
  active: ActiveView;
  onNavigate: (v: ActiveView) => void;
}

export function Sidebar({ active, onNavigate }: Props) {
  const { activeWell, telemetry } = useDigitalTwin();

  return (
    <nav className={styles.sidebar} aria-label="macOS Lucid Navigation">
      <div className={styles.content}>
        {navSections.map((sec) => (
          <div key={sec.category} className={styles.section}>
            <span className={styles.sectionHeader}>{sec.category}</span>
            <div className={styles.list}>
              {sec.items.map((item) => {
                const isActive = active === item.id;
                return (
                  <button
                    key={item.id}
                    className={`${styles.item} ${isActive ? styles.active : ''}`}
                    onClick={() => onNavigate(item.id)}
                  >
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className={`${styles.badge} ${isActive ? styles.activeBadge : ''}`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className={styles.wellIndicator}>
        <div className={styles.wellIcon}>🛢️</div>
        <div className={styles.wellInfo}>
          <span className={styles.wellName}>{activeWell?.name || 'No Active Well'}</span>
          <span className={styles.wellDepth}>{activeWell?.targetDepth || 0}m · {telemetry?.oilProductionRate || '-'} bbl/d</span>
        </div>
      </div>
    </nav>
  );
}

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import apiClient from '../services/apiClient';

export type WellStatus = 'Producing' | 'Optimization Alert' | 'Steam Soaking' | 'Shut-in / Workover';

export interface WellConfig {
  id: string; // e.g. 'BW-07'
  name: string;
  field: string;
  block: string;
  status: WellStatus;
  liftMethod: 'SRP (Sucker Rod Pump)' | 'PCP' | 'ESP' | 'Gas Lift';
  targetDepth: number; // meters
  reservoirTemp: number; // °C
  oilGravity: string; // API
  baselineViscosity: number; // cP
  targetRate: number; // bbl/d
  cssCycle: number;
}

export interface TelemetryData {
  timestamp: string;
  porePressure: number;
  bottomholeFlowingPressure: number;
  reservoirTemperature: number;
  gasOilRatio: number;
  waterCut: number;
  crudeViscosity: number;
  tubingHeadPressure: number;
  casingHeadPressure: number;
  dynamicFluidLevel: number;
  bottomholeDrawdown: number;
  pumpSpeed: number;
  strokeLength: number;
  pumpFillage: number;
  peakPolishedRodLoad: number;
  minPolishedRodLoad: number;
  motorPower: number;
  motorCurrent: number;
  srpEfficiency: number;
  dynacardCondition: string;
  grossRate: number;
  oilProductionRate: number;
  gasProductionRate: number;
  dailyCumulativeOil: number;
  steamTemp: number;
  steamZoneRadius: number;
  steamQuality: number;
  cumulativeOSR: number;
}

export interface HistoricalTelemetryRecord {
  time: string;
  wellId: string;
  temperature: number;
  pressure: number;
  spm: number;
  viscosity: number;
  fluidLevel: number;
  flowRate: number;
  porePressure: number;
  trigger: string;
  deltaNote?: string;
}

export interface AnomalyAlert {
  id: string;
  severity: 'critical' | 'warning' | 'info' | 'success';
  title: string;
  description: string;
  subsystem: 'Reservoir' | 'Wellbore' | 'SRP Lift' | 'Surface' | 'Thermal EOR';
  actionLabel: string;
  actionPayload?: { type: string; value?: number };
  timeAgo: string;
}

export interface ScenarioControls {
  pumpSpeed: number;
  chokeSize: number;
  injectedAnomaly: 'none' | 'fluid_pound' | 'gas_interference' | 'casing_surge';
  cssCycleDay: number;
  steamTemp: number;
  steamRate: number;
}

interface DigitalTwinContextType {
  wells: Record<string, WellConfig>;
  activeWell: WellConfig | null;
  setActiveWellId: (id: string) => void;
  updateWellConfig: (id: string, partial: Partial<WellConfig>) => void;
  telemetry: TelemetryData | null;
  telemetryHistory: TelemetryData[];
  historicalLogs: HistoricalTelemetryRecord[];
  controls: ScenarioControls;
  updateControls: (partial: Partial<ScenarioControls>) => void;
  alerts: AnomalyAlert[];
  applyAlertAction: (alert: AnomalyAlert) => void;
  isStreaming: boolean;
  setIsStreaming: (v: boolean) => void;
  lastDashboardSyncNotice: string | null;
  setLastDashboardSyncNotice: (v: string | null) => void;
  addNewWell: (well: WellConfig) => void;
}

const DigitalTwinContext = createContext<DigitalTwinContextType | null>(null);

export function DigitalTwinProvider({ children }: { children: React.ReactNode }) {
  const [wells, setWells] = useState<Record<string, WellConfig>>({});
  const [activeWellId, setActiveWellId] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(true);
  const [lastDashboardSyncNotice, setLastDashboardSyncNotice] = useState<string | null>(null);

  // Awaiting backend websocket integration for these values
  // State for live telemetry and alerts
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [telemetryHistory] = useState<TelemetryData[]>([]);
  const [historicalLogs] = useState<HistoricalTelemetryRecord[]>([]);
  const [alerts, setAlerts] = useState<AnomalyAlert[]>([]);

  const [controls, setControls] = useState<ScenarioControls>({
    pumpSpeed: 6.2,
    chokeSize: 12,
    injectedAnomaly: 'none',
    cssCycleDay: 42,
    steamTemp: 285,
    steamRate: 150,
  });

  // Fetch real wells from Spring Boot backend on mount
  useEffect(() => {
    const fetchWellsFromBackend = async () => {
      try {
        const res = await apiClient.get<import('../types').Well[]>('/wells');
        const backendWells = res.data;
        
        if (backendWells && backendWells.length > 0) {
          setWells(() => {
            const map: Record<string, WellConfig> = {};
            
            backendWells.forEach((w, index: number) => {
              const i = index + 1;
              const id = w.wellCode;
              
              let statusStr: WellStatus = 'Producing';
              if (w.status === 'ACTIVE') statusStr = 'Producing';
              else if (w.status === 'SHUTDOWN') statusStr = 'Shut-in / Workover';
              else if (w.status === 'MAINTENANCE') statusStr = 'Optimization Alert';
              else if (w.status === 'INACTIVE') statusStr = 'Steam Soaking';

              const depth = 2750 + ((i * 31) % 190);
              const temp = statusStr === 'Steam Soaking' ? +(110.0 + ((i * 5) % 18)).toFixed(1) : +(76.0 + ((i * 3) % 8)).toFixed(1);
              const viscosity = statusStr === 'Steam Soaking' ? 38 : 125 + ((i * 11) % 55);
              const targetRate = statusStr === 'Shut-in / Workover' ? 0 : +(32 + ((i * 7) % 24)).toFixed(1);

              map[id] = {
                id,
                name: w.wellName,
                field: w.fieldName || 'Baghewala Heavy Oil Field',
                block: w.location || 'Rajasthan Block',
                status: statusStr,
                liftMethod: 'SRP (Sucker Rod Pump)',
                targetDepth: depth,
                reservoirTemp: temp,
                oilGravity: '17.2° API (Extra Heavy)',
                baselineViscosity: viscosity,
                targetRate,
                cssCycle: (i % 4) + 1,
              };
            });
            
            return map;
          });

          if (backendWells.length > 0) {
            setActiveWellId(backendWells[0].wellCode);
          }
        }
      } catch (err) {
        console.error('Failed to fetch wells from Spring Boot API:', err);
      }
    };

    fetchWellsFromBackend();
  }, []);

  // Fetch Live Telemetry, Alerts, and AI Recommendations from Backend
  useEffect(() => {
    let interval: number;

    const fetchLiveState = async () => {
      if (!isStreaming || !activeWellId) return;

      try {
        // Fetch Telemetry State
        const resTel = await apiClient.get<any>(`/telemetry/state/${activeWellId}`);
        const data = resTel.data;
        
        if (data) {
          const mappedTelemetry: TelemetryData = {
            timestamp: new Date().toISOString(),
            porePressure: 120.0, // Mocked for now
            bottomholeFlowingPressure: 85.0, // Mocked for now
            reservoirTemperature: data.temperatureC || 80.0,
            gasOilRatio: 110,
            waterCut: 5.2,
            crudeViscosity: data.viscosityCp || 125.0,
            tubingHeadPressure: 15.0,
            casingHeadPressure: 90.0,
            dynamicFluidLevel: 650.0,
            bottomholeDrawdown: 35.0,
            pumpSpeed: data.pumpRpm || 6.0,
            strokeLength: 144,
            pumpFillage: 82.5,
            peakPolishedRodLoad: data.rodLoadLbs || 11000,
            minPolishedRodLoad: 4500,
            motorPower: 22.5,
            motorCurrent: 35.0,
            srpEfficiency: 81.0,
            dynacardCondition: data.systemStatus || 'NORMAL',
            grossRate: 155,
            oilProductionRate: 146,
            gasProductionRate: 28,
            dailyCumulativeOil: 75.5,
            steamTemp: 285.0,
            steamZoneRadius: 12.0,
            steamQuality: 75.0,
            cumulativeOSR: 0.15,
          };
          setTelemetry(mappedTelemetry);
        }

        // Fetch Alerts
        const resAlerts = await apiClient.get<any[]>(`/alerts?wellId=${activeWellId}`);
        const unackedAlerts = (resAlerts.data || []).filter((a) => !a.acknowledgedBy);
        
        // Fetch Recommendations
        const resRecs = await apiClient.get<any[]>(`/recommendations?wellId=${activeWellId}`);
        const pendingRecs = (resRecs.data || []).filter((r) => r.status === 'PENDING');

        // Merge and Map to AnomalyAlert interface
        const mergedAlerts = [
          ...unackedAlerts.map(a => ({
            id: a.id || String(Date.now()),
            severity: a.severity?.toLowerCase() || 'warning',
            title: a.title || 'System Alert',
            description: a.description || 'Abnormal condition detected',
            subsystem: 'SRP Lift',
            actionLabel: 'Acknowledge',
            timeAgo: 'Just now',
          })),
          ...pendingRecs.map(r => ({
            id: r.id || String(Date.now() + 100),
            severity: 'info',
            title: 'AI Recommendation',
            description: r.recommendationText || 'Operational adjustment advised',
            subsystem: 'Reservoir',
            actionLabel: `Execute ${r.recommendationType || 'Action'}`,
            timeAgo: 'Just now',
          }))
        ];

        setAlerts(mergedAlerts as AnomalyAlert[]);

      } catch (err) {
        console.error('Failed to fetch live state from backend:', err);
      }
    };

    if (isStreaming && activeWellId) {
      fetchLiveState(); // Initial fetch
      interval = window.setInterval(fetchLiveState, 2000); // Poll every 2 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isStreaming, activeWellId]);

  const activeWell = activeWellId ? wells[activeWellId] || null : null;

  const updateControls = useCallback((partial: Partial<ScenarioControls>) => {
    setControls((prev) => ({ ...prev, ...partial }));
    // Awaiting backend ControlCommandController API to send changes
  }, []);

  const updateWellConfig = useCallback((id: string, partial: Partial<WellConfig>) => {
    setWells((prev) => {
      const current = prev[id];
      if (!current) return prev;
      return { ...prev, [id]: { ...current, ...partial } };
    });
    setLastDashboardSyncNotice(`✓ Well ${id} Parameters Updated Locally (Awaiting Backend Sync)`);
  }, []);

  const addNewWell = useCallback((newWell: WellConfig) => {
    setWells((prev) => ({ ...prev, [newWell.id]: newWell }));
    setActiveWellId(newWell.id);
  }, []);

  const applyAlertAction = useCallback((alert: AnomalyAlert) => {
    // Actions will be routed to backend command API eventually
    if (alert.actionPayload?.type === 'SET_SPM' && alert.actionPayload.value) {
      updateControls({ pumpSpeed: alert.actionPayload.value });
    }
  }, [updateControls]);

  return (
    <DigitalTwinContext.Provider
      value={{
        wells,
        activeWell,
        setActiveWellId,
        updateWellConfig,
        telemetry,
        telemetryHistory,
        historicalLogs,
        controls,
        updateControls,
        alerts,
        applyAlertAction,
        isStreaming,
        setIsStreaming,
        lastDashboardSyncNotice,
        setLastDashboardSyncNotice,
        addNewWell,
      }}
    >
      {children}
    </DigitalTwinContext.Provider>
  );
}

export function useDigitalTwin() {
  const ctx = useContext(DigitalTwinContext);
  if (!ctx) {
    throw new Error('useDigitalTwin must be used within DigitalTwinProvider');
  }
  return ctx;
}

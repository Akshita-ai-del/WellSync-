import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { timescaleDB, type TimescaleTelemetryRecord } from '../database/timescaleService';

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
  // Reservoir
  porePressure: number; // bar
  bottomholeFlowingPressure: number; // Pwf bar
  reservoirTemperature: number; // °C
  gasOilRatio: number; // scf/bbl
  waterCut: number; // %
  crudeViscosity: number; // cP

  // Wellbore
  tubingHeadPressure: number; // THP bar
  casingHeadPressure: number; // CHP bar
  dynamicFluidLevel: number; // meters from surface
  bottomholeDrawdown: number; // bar (Pres - Pwf)

  // SRP Artificial Lift
  pumpSpeed: number; // SPM
  strokeLength: number; // m
  pumpFillage: number; // %
  peakPolishedRodLoad: number; // lbs
  minPolishedRodLoad: number; // lbs
  motorPower: number; // kW
  motorCurrent: number; // A
  srpEfficiency: number; // %
  dynacardCondition: 'Normal Full Fillage' | 'Fluid Pound' | 'Gas Interference' | 'Traveling Valve Leak';

  // Surface Production
  grossRate: number; // bbl/d
  oilProductionRate: number; // bbl/d
  gasProductionRate: number; // Mscf/d
  dailyCumulativeOil: number; // bbl

  // Thermal EOR (CSS)
  steamTemp: number; // °C
  steamZoneRadius: number; // meters
  steamQuality: number; // %
  cumulativeOSR: number; // Oil-Steam Ratio bbl/tonne
}

export type HistoricalTelemetryRecord = TimescaleTelemetryRecord;

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
  pumpSpeed: number; // SPM (3 to 10)
  chokeSize: number; // mm (6 to 24)
  injectedAnomaly: 'none' | 'fluid_pound' | 'gas_interference' | 'casing_surge';
  cssCycleDay: number;
  steamTemp: number; // °C
  steamRate: number; // t/d
}

interface DigitalTwinContextType {
  wells: Record<string, WellConfig>;
  activeWell: WellConfig;
  setActiveWellId: (id: string) => void;
  updateWellConfig: (id: string, partial: Partial<WellConfig>) => void;
  telemetry: TelemetryData;
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
  directInsertTelemetryRecord: (data: {
    wellId: string;
    temperature: number;
    pressure: number;
    spm: number;
    viscosity: number;
    fluidLevel: number;
    flowRate: number;
    trigger: string;
    deltaNote?: string;
  }) => { record: HistoricalTelemetryRecord; sql: string };
  loadHistoricalStateIntoCockpit: (record: HistoricalTelemetryRecord) => void;
  addNewWell: (well: WellConfig) => void;
}

// Generate the full 52 wells of ONGC Baghewala Heavy Oil Field
export function generate52Wells(): Record<string, WellConfig> {
  const map: Record<string, WellConfig> = {};

  for (let i = 1; i <= 52; i++) {
    const id = `BW-${i.toString().padStart(2, '0')}`;
    let status: WellStatus;

    if (i === 7 || i === 14 || i === 29) {
      status = 'Optimization Alert'; // 3 wells
    } else if (i === 1 || i === 8 || i === 19 || i === 25 || i === 33) {
      status = 'Steam Soaking'; // 5 wells
    } else if (i > 34) {
      status = 'Shut-in / Workover'; // 18 non-working wells (35 to 52)
    } else {
      status = 'Producing'; // 26 working producing wells
    }

    const depth = 2750 + ((i * 31) % 190);
    const temp = status === 'Steam Soaking'
      ? +(110.0 + ((i * 5) % 18)).toFixed(1)
      : +(76.0 + ((i * 3) % 8)).toFixed(1);

    const viscosity = status === 'Steam Soaking' ? 38 : 125 + ((i * 11) % 55);
    const targetRate = status === 'Shut-in / Workover' ? 0 : +(32 + ((i * 7) % 24)).toFixed(1);

    map[id] = {
      id,
      name: `Well ${id}`,
      field: 'Baghewala Heavy Oil Field',
      block: 'ONGC Block RJ-ON-90/1 (Bikaner-Nagaur Basin)',
      status,
      liftMethod: 'SRP (Sucker Rod Pump)',
      targetDepth: depth,
      reservoirTemp: temp,
      oilGravity: '17.2° API (Extra Heavy)',
      baselineViscosity: viscosity,
      targetRate,
      cssCycle: (i % 4) + 1,
    };
  }

  return map;
}

const DigitalTwinContext = createContext<DigitalTwinContextType | null>(null);

export function DigitalTwinProvider({ children }: { children: React.ReactNode }) {
  const [wells, setWells] = useState<Record<string, WellConfig>>(() => generate52Wells());
  const [activeWellId, setActiveWellId] = useState<string>('BW-07');
  const [isStreaming, setIsStreaming] = useState(true);
  const [lastDashboardSyncNotice, setLastDashboardSyncNotice] = useState<string | null>(null);
  const [historicalLogs, setHistoricalLogs] = useState<HistoricalTelemetryRecord[]>(() =>
    timescaleDB.getAllRecords()
  );

  const [controls, setControls] = useState<ScenarioControls>({
    pumpSpeed: 6.2,
    chokeSize: 12,
    injectedAnomaly: 'none',
    cssCycleDay: 42,
    steamTemp: 285,
    steamRate: 150,
  });

  const activeWell = wells[activeWellId] || wells['BW-07'];

  // Base physics calculations linked together in a continuous feedback loop:
  // Reservoir -> Wellbore -> SRP -> Surface
  const computeTelemetry = useCallback((t: number, c: ScenarioControls, w: WellConfig): TelemetryData => {
    const wave = Math.sin(t * 0.5);

    // 1. Reservoir Physics (Vogel Inflow model)
    const basePres = 152.0;
    const porePressure = +(basePres - (t * 0.002) % 1.5 + wave * 0.3).toFixed(1);

    // Speed impact: higher pump speed draws down bottomhole pressure
    const speedRatio = c.pumpSpeed / 5.8;
    const bottomholeFlowingPressure = +(98.4 - (speedRatio - 1) * 12 + wave * 0.8).toFixed(1);
    const bottomholeDrawdown = +(porePressure - bottomholeFlowingPressure).toFixed(1);

    // Viscosity affected by steam temperature & heat front
    const tempEffect = Math.max(0.2, Math.min(1.0, (300 - c.steamTemp) / 220));
    const crudeViscosity = +(w.baselineViscosity * 0.22 * tempEffect + Math.sin(t * 0.1) * 1.5).toFixed(1);

    // 2. Wellbore Hydraulics
    let dynamicFluidLevel = +(1250 + (speedRatio - 1) * 90 + wave * 8).toFixed(0);
    let casingHeadPressure = +(91.2 + (c.chokeSize / 12) * 1.5 + Math.cos(t * 0.3) * 1.2).toFixed(1);
    let tubingHeadPressure = +(148.5 - (speedRatio - 1) * 4 + wave * 1.4).toFixed(1);

    // GOR and Water cut
    let gasOilRatio = +(312 + (speedRatio > 1.15 ? 35 : 0) + wave * 6).toFixed(0);
    let waterCut = +(28.4 + wave * 0.4).toFixed(1);

    // 3. SRP Lift Mechanics
    let pumpFillage = +(84.0 - Math.max(0, (c.pumpSpeed - 5.8) * 18) + wave * 2).toFixed(1);
    let dynacardCondition: TelemetryData['dynacardCondition'] = 'Normal Full Fillage';

    // Check anomalies
    if (c.injectedAnomaly === 'fluid_pound' || pumpFillage < 65 || c.pumpSpeed > 6.8) {
      dynacardCondition = 'Fluid Pound';
      pumpFillage = Math.min(pumpFillage, 52.0);
    } else if (c.injectedAnomaly === 'gas_interference' || gasOilRatio > 340) {
      dynacardCondition = 'Gas Interference';
      casingHeadPressure += 12.0;
    } else if (c.injectedAnomaly === 'casing_surge') {
      casingHeadPressure += 28.5;
    }

    const peakPolishedRodLoad = +(18200 + (c.pumpSpeed - 5.0) * 850 + (dynacardCondition === 'Fluid Pound' ? 1400 : 0)).toFixed(0);
    const minPolishedRodLoad = +(7100 - (c.pumpSpeed - 5.0) * 400).toFixed(0);
    const motorPower = +(16.2 + (c.pumpSpeed - 5.0) * 1.8 + (dynacardCondition === 'Fluid Pound' ? 2.5 : 0)).toFixed(1);
    const motorCurrent = +(motorPower * 1.82).toFixed(1);
    const srpEfficiency = +(Math.max(48, Math.min(88, pumpFillage * 0.88 - (c.pumpSpeed - 5.8) * 4))).toFixed(1);

    // 4. Surface Production
    const theoreticalRate = (c.pumpSpeed / 5.8) * w.targetRate * 1.1;
    const grossRate = +(theoreticalRate * (pumpFillage / 100)).toFixed(1);
    const oilProductionRate = +(grossRate * (1 - waterCut / 100)).toFixed(1);
    const gasProductionRate = +((oilProductionRate * gasOilRatio) / 1000).toFixed(2);
    const dailyCumulativeOil = +(38.2 + (t % 100) * 0.08).toFixed(1);

    // Thermal EOR (CSS)
    const steamZoneRadius = +(18.4 + ((c.steamTemp - 260) / 40) * 2.5 + Math.sin(t * 0.05) * 0.4).toFixed(1);
    const steamQuality = +(80.2 - (t % 20) * 0.05).toFixed(1);
    const cumulativeOSR = +(0.43 + wave * 0.01).toFixed(2);

    return {
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      porePressure,
      bottomholeFlowingPressure,
      reservoirTemperature: w.reservoirTemp,
      gasOilRatio,
      waterCut,
      crudeViscosity,
      tubingHeadPressure,
      casingHeadPressure,
      dynamicFluidLevel,
      bottomholeDrawdown,
      pumpSpeed: c.pumpSpeed,
      strokeLength: 3.05,
      pumpFillage,
      peakPolishedRodLoad,
      minPolishedRodLoad,
      motorPower,
      motorCurrent,
      srpEfficiency,
      dynacardCondition,
      grossRate,
      oilProductionRate,
      gasProductionRate,
      dailyCumulativeOil,
      steamTemp: c.steamTemp,
      steamZoneRadius,
      steamQuality,
      cumulativeOSR,
    };
  }, []);

  const [, setTick] = useState(0);
  const [telemetry, setTelemetry] = useState<TelemetryData>(() => computeTelemetry(0, controls, activeWell));
  const [telemetryHistory, setTelemetryHistory] = useState<TelemetryData[]>([]);

  // Update controls and append to historical log
  const updateControls = useCallback((partial: Partial<ScenarioControls>) => {
    setControls((prev) => {
      const next = { ...prev, ...partial };
      const now = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      let trigger = 'Engineer Parameter Adjustment';
      let delta = '';

      if (partial.pumpSpeed !== undefined) {
        setLastDashboardSyncNotice(`⚡ Dashboard Synced: Pumping Speed set to ${partial.pumpSpeed} SPM`);
        trigger = 'AI / Engineer Speed Tuning';
        delta = `SPM adjusted: ${prev.pumpSpeed} -> ${partial.pumpSpeed}`;
      } else if (partial.steamTemp !== undefined) {
        setLastDashboardSyncNotice(`♨️ Dashboard Synced: Steam Temp set to ${partial.steamTemp}°C`);
        trigger = 'Thermal Steam Setting';
        delta = `Steam temp adjusted: ${prev.steamTemp}°C -> ${partial.steamTemp}°C`;
      } else if (partial.chokeSize !== undefined) {
        setLastDashboardSyncNotice(`⚡ Dashboard Synced: Casing Choke set to ${partial.chokeSize} mm`);
        trigger = 'Choke Calibration';
        delta = `Choke set to ${partial.chokeSize} mm`;
      }

      timescaleDB.insertRecord({
        time: now,
        wellId: activeWell.id,
        temperature: activeWell.reservoirTemp,
        pressure: telemetry.tubingHeadPressure,
        spm: next.pumpSpeed,
        viscosity: telemetry.crudeViscosity,
        fluidLevel: telemetry.dynamicFluidLevel,
        flowRate: telemetry.oilProductionRate,
        porePressure: 152.0,
        trigger,
        deltaNote: delta,
      });
      setHistoricalLogs(timescaleDB.getAllRecords());

      return next;
    });
  }, [activeWell, telemetry]);

  const updateWellConfig = useCallback((id: string, partial: Partial<WellConfig>) => {
    setWells((prev) => {
      const current = prev[id];
      if (!current) return prev;
      const updated = { ...current, ...partial };

      const now = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      timescaleDB.insertRecord({
        time: now,
        wellId: id,
        temperature: updated.reservoirTemp,
        pressure: telemetry.tubingHeadPressure,
        spm: controls.pumpSpeed,
        viscosity: updated.baselineViscosity,
        fluidLevel: telemetry.dynamicFluidLevel,
        flowRate: updated.targetRate,
        porePressure: 152.0,
        trigger: 'Well Configuration Update',
        deltaNote: `Updated parameters for ${id} (Temp: ${updated.reservoirTemp}°C, Viscosity: ${updated.baselineViscosity} cP)`,
      });
      setHistoricalLogs(timescaleDB.getAllRecords());

      return {
        ...prev,
        [id]: updated,
      };
    });
    setLastDashboardSyncNotice(`✓ Well ${id} Parameters Updated & Synced to Live Twin`);
  }, [telemetry, controls.pumpSpeed]);

  const addNewWell = useCallback((newWell: WellConfig) => {
    setWells((prev) => ({
      ...prev,
      [newWell.id]: newWell,
    }));
    setActiveWellId(newWell.id);
    const now = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    timescaleDB.insertRecord({
      time: now,
      wellId: newWell.id,
      temperature: newWell.reservoirTemp,
      pressure: 148.0,
      spm: 5.8,
      viscosity: newWell.baselineViscosity,
      fluidLevel: 1250,
      flowRate: newWell.targetRate,
      porePressure: 152.0,
      trigger: 'New Well Commissioning',
      deltaNote: `Commissioned new well ${newWell.id} (${newWell.name})`,
    });
    setHistoricalLogs(timescaleDB.getAllRecords());
    setLastDashboardSyncNotice(`✓ Well ${newWell.id} (${newWell.name}) successfully added and commissioned to field.`);
  }, []);

  useEffect(() => {
    if (!isStreaming) return;
    const interval = setInterval(() => {
      setTick((prev) => {
        const next = prev + 1;
        const nextTelemetry = computeTelemetry(next, controls, activeWell);
        setTelemetry(nextTelemetry);
        setTelemetryHistory((hist) => [...hist.slice(-35), nextTelemetry]);

        // Automatically log periodic telemetry snapshot into the historical time-series database
        if (next % 4 === 0) {
          timescaleDB.insertRecord({
            time: nextTelemetry.timestamp,
            wellId: activeWell.id,
            temperature: nextTelemetry.reservoirTemperature,
            pressure: nextTelemetry.tubingHeadPressure,
            spm: nextTelemetry.pumpSpeed,
            viscosity: nextTelemetry.crudeViscosity,
            fluidLevel: nextTelemetry.dynamicFluidLevel,
            flowRate: nextTelemetry.oilProductionRate,
            porePressure: nextTelemetry.porePressure,
            trigger: 'Live SCADA Poll',
          });
          setHistoricalLogs(timescaleDB.getAllRecords());
        }

        return next;
      });
    }, 1800);

    return () => clearInterval(interval);
  }, [isStreaming, controls, activeWell, computeTelemetry]);

  // Direct Ingestion of Telemetry Record without opening database console
  const directInsertTelemetryRecord = useCallback(
    (data: {
      wellId: string;
      temperature: number;
      pressure: number;
      spm: number;
      viscosity: number;
      fluidLevel: number;
      flowRate: number;
      trigger: string;
      deltaNote?: string;
    }) => {
      const now = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const { record, sql } = timescaleDB.insertRecord({
        time: now,
        wellId: data.wellId,
        temperature: data.temperature,
        pressure: data.pressure,
        spm: data.spm,
        viscosity: data.viscosity,
        fluidLevel: data.fluidLevel,
        flowRate: data.flowRate,
        porePressure: 152.0,
        trigger: data.trigger || 'Direct Dashboard Insert',
        deltaNote: data.deltaNote,
      });

      setHistoricalLogs(timescaleDB.getAllRecords());

      // If inserted record belongs to active well, update live telemetry & well state immediately
      if (data.wellId === activeWell.id) {
        setTelemetry((prev) => ({
          ...prev,
          reservoirTemperature: data.temperature,
          tubingHeadPressure: data.pressure,
          pumpSpeed: data.spm,
          crudeViscosity: data.viscosity,
          dynamicFluidLevel: data.fluidLevel,
          oilProductionRate: data.flowRate,
        }));
        setControls((prev) => ({
          ...prev,
          pumpSpeed: data.spm,
        }));
        setWells((prev) => {
          const cur = prev[data.wellId];
          if (!cur) return prev;
          return {
            ...prev,
            [data.wellId]: {
              ...cur,
              reservoirTemp: data.temperature,
              baselineViscosity: data.viscosity,
            },
          };
        });
      }

      setLastDashboardSyncNotice(
        `✓ Committed to TimescaleDB Hypertable [well_telemetry] (${data.wellId} at ${now}) — Temp: ${data.temperature}°C, Visco: ${data.viscosity} cP, SPM: ${data.spm}`
      );

      return { record, sql };
    },
    [activeWell.id]
  );

  // Point-in-time state restore / inspection
  const loadHistoricalStateIntoCockpit = useCallback(
    (record: HistoricalTelemetryRecord) => {
      setActiveWellId(record.wellId);
      setTelemetry((prev) => ({
        ...prev,
        reservoirTemperature: record.temperature,
        tubingHeadPressure: record.pressure,
        pumpSpeed: record.spm,
        crudeViscosity: record.viscosity,
        dynamicFluidLevel: record.fluidLevel,
        oilProductionRate: record.flowRate,
      }));
      setControls((prev) => ({
        ...prev,
        pumpSpeed: record.spm,
      }));
      setLastDashboardSyncNotice(
        `⏮ Point-in-Time State Restored: ${record.wellId} at ${record.time} (Temp: ${record.temperature}°C, Viscosity: ${record.viscosity} cP, SPM: ${record.spm})`
      );
    },
    []
  );

  // Dynamic AI & Engineering Alerts based on the live multiphysics state
  const alerts = useMemo<AnomalyAlert[]>(() => {
    const list: AnomalyAlert[] = [];

    if (telemetry.dynacardCondition === 'Fluid Pound') {
      list.push({
        id: 'alt-pound',
        severity: 'critical',
        title: 'SRP Fluid Pound Anomaly Detected',
        description: `Pump fillage dropped to ${telemetry.pumpFillage}%. Incomplete liquid fillage causing polished rod impact shock (${telemetry.peakPolishedRodLoad} lbs). Auto-recommend reducing VFD speed to 5.6 SPM.`,
        subsystem: 'SRP Lift',
        actionLabel: 'Auto-Tune VFD to 5.6 SPM',
        actionPayload: { type: 'SET_SPM', value: 5.6 },
        timeAgo: 'Just now',
      });
    }

    if (telemetry.gasOilRatio > 330) {
      list.push({
        id: 'alt-gor',
        severity: 'warning',
        title: 'Gas-Oil Ratio Exceeding Bubble Point Curve',
        description: `GOR shifted to ${telemetry.gasOilRatio} scf/bbl. Free gas breakout occurring at pump suction inlet. Recommend checking casing annulus backpressure.`,
        subsystem: 'Wellbore',
        actionLabel: 'Open Casing Choke to 16mm',
        actionPayload: { type: 'ADJUST_CHOKE', value: 16 },
        timeAgo: '4m ago',
      });
    }

    if (telemetry.dynamicFluidLevel > 1280) {
      list.push({
        id: 'alt-drawdown',
        severity: 'warning',
        title: 'Depleted Submergence / Fluid Level Falling',
        description: `Dynamic fluid level is at ${telemetry.dynamicFluidLevel} m (submergence margin < 120m). Risk of pump intake cavitation.`,
        subsystem: 'Reservoir',
        actionLabel: 'Optimize Drawdown',
        actionPayload: { type: 'SET_SPM', value: 5.4 },
        timeAgo: '8m ago',
      });
    }

    list.push({
      id: 'alt-css',
      severity: 'info',
      title: 'CSS Cycle Thermal Front Status',
      description: `Steam bank radius at ${telemetry.steamZoneRadius} m. Near-wellbore viscosity reduced to ${telemetry.crudeViscosity} cP vs native ${activeWell.baselineViscosity} cP.`,
      subsystem: 'Thermal EOR',
      actionLabel: 'Inspect Steam Profile',
      timeAgo: '25m ago',
    });

    return list;
  }, [telemetry, activeWell]);

  const applyAlertAction = useCallback((alert: AnomalyAlert) => {
    if (alert.actionPayload?.type === 'SET_SPM' && alert.actionPayload.value) {
      updateControls({ pumpSpeed: alert.actionPayload.value, injectedAnomaly: 'none' });
    } else if (alert.actionPayload?.type === 'ADJUST_CHOKE' && alert.actionPayload.value) {
      updateControls({ chokeSize: alert.actionPayload.value });
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
        directInsertTelemetryRecord,
        loadHistoricalStateIntoCockpit,
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

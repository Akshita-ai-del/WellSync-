// ─── Core domain types ────────────────────────────────────────────────────────

export type Theme = 'light' | 'dark';

export type ProblemCategory =
  | 'Software'
  | 'Hardware'
  | 'AI/ML'
  | 'Blockchain'
  | 'IoT'
  | 'Robotics'
  | 'Other';

export type ProblemType = 'Software' | 'Hardware' | 'Both';

export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard';

export interface Organization {
  id: string;
  name: string;
  ministry: string;
}

export interface Department {
  id: string;
  name: string;
  organizationId: string;
}

export interface Problem {
  id: string;
  psId: string;           // SIH Problem Statement ID e.g. "SIH1234"
  title: string;
  description: string;
  backgroundContext: string;
  expectedSolution: string;
  organization: string;
  ministry: string;
  department: string;
  category: ProblemCategory;
  problemType: ProblemType;
  difficulty: DifficultyLevel;
  tags: string[];
  teamSize: string;        // e.g. "2-6 members"
  prizes: string;          // e.g. "₹1,00,000"
  postedAt: string;        // ISO date string
  deadline: string;        // ISO date string
  isBookmarked?: boolean;
}

// ─── UI state types ────────────────────────────────────────────────────────────

export interface FilterState {
  search: string;
  category: ProblemCategory | 'All';
  organization: string | 'All';
  ministry: string | 'All';
  problemType: ProblemType | 'All';
  difficulty: DifficultyLevel | 'All';
}

export interface AppState {
  selectedProblemId: string | null;
  theme: Theme;
  filters: FilterState;
  isDetailExpanded: boolean;
  isLoading: boolean;
  error: string | null;
}

// ─── WellSync Backend Domain Types ────────────────────────────────────────────

/** Common audit fields present on every backend entity. */
export interface BaseEntity {
  id: string; // UUID
  createdAt?: string; // ISO 8601
  updatedAt?: string; // ISO 8601
}

// --- Reservoir ---

export interface Reservoir extends BaseEntity {
  name: string;
  formation: string;
  lithology: string;
  apiGravity: number;
  initialTemperatureC: number;
  initialPressurePsi: number;
  oilViscosityCp: number;
  porosityPercent: number;
  permeabilityMd: number;
  depthM: number;
}

export type ReservoirPayload = Omit<Reservoir, 'id' | 'createdAt' | 'updatedAt'>;

// --- Well ---

export type BackendWellStatus = 'ACTIVE' | 'SHUTDOWN' | 'MAINTENANCE' | 'INACTIVE';

export interface Well extends BaseEntity {
  wellCode: string;
  wellName: string;
  fieldName: string;
  location: string;
  reservoirId: string;
  status: BackendWellStatus;
}

export type WellPayload = Omit<Well, 'id' | 'createdAt' | 'updatedAt'>;

// --- Completion ---

export interface Completion extends BaseEntity {
  wellId: string;
  completionType: string;
  tubingDepth: number;
  casingDepth: number;
  perforationTop: number;
  perforationBottom: number;
  pumpSettingDepth: number;
}

export type CompletionPayload = Omit<Completion, 'id' | 'createdAt' | 'updatedAt'>;

// --- SRP System ---

export interface SrpSystem extends BaseEntity {
  wellId: string;
  pumpType: string;
  pumpModel: string;
  rodType: string;
  rodStringLength: number;
  pumpDepth: number;
  minRpm: number;
  maxRpm: number;
  maxStrokeLength: number;
  maxRodLoad: number;
  status: BackendWellStatus;
}

export type SrpSystemPayload = Omit<SrpSystem, 'id' | 'createdAt' | 'updatedAt'>;

// --- SRP Operating Config ---

export interface SrpOperatingConfig extends BaseEntity {
  srpSystemId: string;
  strokeLength: number;
  spm: number;
  pumpRpm: number;
  vfdFrequency: number;
  targetRpm: number;
  pumpEfficiencyPercent: number;
}

export type SrpOperatingConfigPayload = Omit<SrpOperatingConfig, 'id' | 'createdAt' | 'updatedAt'>;

// --- CSS Cycle ---

export type CssStage = 'INJECTION' | 'SOAK' | 'PRODUCTION';
export type CssCycleStatus = 'PLANNED' | 'ACTIVE' | 'COMPLETED' | 'SUSPENDED';

export interface CssCycle extends BaseEntity {
  wellId: string;
  cycleNumber: number;
  stage: CssStage;
  status: CssCycleStatus;
  soakTimeMinutes: number;
  startTime: string;
  endTime: string | null;
  notes: string;
}

export type CssCyclePayload = Omit<CssCycle, 'id' | 'createdAt' | 'updatedAt'>;

// --- Steam Injection ---

export interface SteamInjection extends BaseEntity {
  cssCycleId: string;
  steamRateKgHr: number;
  steamVolumeKg: number;
  steamTemperatureC: number;
  injectionPressurePsi: number;
  injectionDurationMinutes: number;
  steamQualityPercent: number;
  startTime: string;
  endTime: string;
}

export type SteamInjectionPayload = Omit<SteamInjection, 'id' | 'createdAt' | 'updatedAt'>;

// --- Sensor Config ---

export type SensorType = 'TEMPERATURE' | 'PRESSURE' | 'VISCOSITY' | 'FLOW_RATE' | 'LOAD' | 'VIBRATION' | 'RPM';

export interface SensorConfig extends BaseEntity {
  wellId: string;
  sensorCode: string;
  sensorType: SensorType | string;
  unit: string;
  minValue: number;
  maxValue: number;
  samplingIntervalSeconds: number;
  isActive: boolean;
  lastSeenAt: string | null;
}

export type SensorConfigPayload = Omit<SensorConfig, 'id' | 'createdAt' | 'updatedAt'>;

// --- Well Target ---

export interface WellTarget extends BaseEntity {
  wellId: string;
  minRpm: number;
  maxRpm: number;
  targetRpm: number;
  minTemperatureC: number;
  maxViscosityCp: number;
  maxRodLoadLbs: number;
  targetOilRateBopd: number;
  maxEnergyKwh: number;
}

export type WellTargetPayload = Omit<WellTarget, 'id' | 'createdAt' | 'updatedAt'>;

// --- Production Record ---

export interface ProductionRecord extends BaseEntity {
  wellId: string;
  recordedAt: string;
  oilRateBopd: number;
  waterRateBwpd: number;
  gasRateMscfd: number;
  waterCutPercent: number;
  steamOilRatio: number;
  energyConsumptionKwh: number;
  pumpEfficiencyPercent: number;
}

export type ProductionRecordPayload = Omit<ProductionRecord, 'id' | 'createdAt' | 'updatedAt'>;


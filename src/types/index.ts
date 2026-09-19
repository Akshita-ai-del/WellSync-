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
  id: number;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

// --- Reservoir ---

export interface Reservoir extends BaseEntity {
  name: string;
  formation: string;
  lithology: string;
  depthTopFt: number;
  depthBottomFt: number;
  netPayFt: number;
  porosity: number;
  permeabilityMd: number;
  oilGravityApi: number;
  viscosityCp: number;
  initialPressurePsi: number;
  temperatureF: number;
  driveType: string;
}

export type ReservoirPayload = Omit<Reservoir, 'id' | 'createdAt' | 'updatedAt'>;

// --- Well ---

export type WellStatus = 'ACTIVE' | 'SHUT_IN' | 'ABANDONED' | 'DRILLING' | 'COMPLETING';

export interface Well extends BaseEntity {
  wellCode: string;
  wellName: string;
  reservoirId: number;
  status: WellStatus;
  spudDate: string;
  completionDate: string;
  totalDepthFt: number;
  latitude: number;
  longitude: number;
}

export type WellPayload = Omit<Well, 'id' | 'createdAt' | 'updatedAt'>;

// --- Completion ---

export interface Completion extends BaseEntity {
  wellId: number;
  completionType: string;
  tubingDepthFt: number;
  tubingSizIn: number;
  casingSizeIn: number;
  casingWeightLbPerFt: number;
  perforationTopFt: number;
  perforationBottomFt: number;
  openHole: boolean;
}

export type CompletionPayload = Omit<Completion, 'id' | 'createdAt' | 'updatedAt'>;

// --- SRP System ---

export interface SrpSystem extends BaseEntity {
  wellId: number;
  pumpType: string;
  manufacturer: string;
  pumpDepthFt: number;
  pumpBoreSizeIn: number;
  plungerSizeIn: number;
  strokeLengthIn: number;
  rodStringDescription: string;
  motorHp: number;
  motorType: string;
}

export type SrpSystemPayload = Omit<SrpSystem, 'id' | 'createdAt' | 'updatedAt'>;

// --- SRP Operating Config ---

export interface SrpOperatingConfig extends BaseEntity {
  srpSystemId: number;
  strokesPerMinute: number;
  effectiveStrokeLengthIn: number;
  pumpFillage: number;
  polishedRodLoadMax: number;
  polishedRodLoadMin: number;
  gearboxTorque: number;
  motorLoad: number;
}

export type SrpOperatingConfigPayload = Omit<SrpOperatingConfig, 'id' | 'createdAt' | 'updatedAt'>;

// --- CSS Cycle ---

export type CssCycleStatus = 'INJECTION' | 'SOAK' | 'PRODUCTION' | 'COMPLETED';

export interface CssCycle extends BaseEntity {
  wellId: number;
  cycleNumber: number;
  status: CssCycleStatus;
  startDate: string;
  endDate: string | null;
  injectionDays: number;
  soakDays: number;
  productionDays: number;
}

export type CssCyclePayload = Omit<CssCycle, 'id' | 'createdAt' | 'updatedAt'>;

// --- Steam Injection ---

export interface SteamInjection extends BaseEntity {
  cssCycleId: number;
  injectionDate: string;
  volumeColdWaterEquivalent: number;
  steamQuality: number;
  injectionPressurePsi: number;
  injectionTemperatureF: number;
  injectionRateBpd: number;
}

export type SteamInjectionPayload = Omit<SteamInjection, 'id' | 'createdAt' | 'updatedAt'>;

// --- Sensor Config ---

export type SensorType = 'PRESSURE' | 'TEMPERATURE' | 'FLOW_RATE' | 'VIBRATION' | 'LOAD';

export interface SensorConfig extends BaseEntity {
  wellId: number;
  sensorCode: string;
  sensorType: SensorType;
  manufacturer: string;
  model: string;
  installationDepthFt: number;
  installDate: string;
  isActive: boolean;
  readingIntervalSeconds: number;
}

export type SensorConfigPayload = Omit<SensorConfig, 'id' | 'createdAt' | 'updatedAt'>;

// --- Well Target ---

export interface WellTarget extends BaseEntity {
  wellId: number;
  targetOilRateBopd: number;
  targetWaterRateBwpd: number;
  targetGasRateMcfd: number;
  targetWaterCutPct: number;
  effectiveFrom: string;
  effectiveTo: string | null;
}

export type WellTargetPayload = Omit<WellTarget, 'id' | 'createdAt' | 'updatedAt'>;

// --- Production Record ---

export interface ProductionRecord extends BaseEntity {
  wellId: number;
  recordedAt: string;
  oilRateBopd: number;
  waterRateBwpd: number;
  gasRateMcfd: number;
  waterCutPct: number;
  casingPressurePsi: number;
  tubingPressurePsi: number;
  bottomholePressurePsi: number;
  chokeSize: number;
  runtime: number;
}

export type ProductionRecordPayload = Omit<ProductionRecord, 'id' | 'createdAt' | 'updatedAt'>;

import { LucideIcon } from "lucide-react";

// CAPA 1: DEFINICIONES DE TIPOS DE DATOS Y MAGNITUDES ELECTROMAGNÉTICAS
// Modela las estructuras del dominio físico: celda de la rejilla, propiedades dieléctricas,
// magnitudes de campo electromagnético (E, H, Vector de Poynting) y validación analítica.

export type SolverMethod = "jacobi" | "gauss-seidel" | "sor";

export type MaterialType = "air" | "drywall" | "brick" | "concrete" | "metal";

export interface MaterialProperties {
  id: MaterialType;
  name: string;
  color: string;
  attenuation: number;          // Coeficiente de absorción α ∈ [0, 1) para el esquema en diferencias finitas
  dbLoss: number;               // Pérdida física por transmisión en decibelios (dB) según ITU-R P.2040
  relativePermittivity: number; // Permitividad dieléctrica relativa ε_r (adimensional)
  conductivity: number;         // Conductividad eléctrica efectiva σ (S/m) en bandas UHF/SHF
  iconName: string;
}

export interface ElectromagneticMetrics {
  dbm: number;             // Nivel de potencia recibida en dBm
  powerMw: number;         // Potencia recibida en milivatios (mW)
  poyntingUwM2: number;    // Densidad de potencia / Magnitud media del Vector de Poynting <S> (µW/m²)
  electricFieldVm: number; // Intensidad de campo eléctrico eficaz E_rms (V/m)
  magneticFieldMam: number;// Intensidad de campo magnético eficaz H_rms (mA/m)
  wavelengthCm: number;    // Longitud de onda λ = c/f (cm)
}

export interface ValidationPoint {
  distanceM: number;
  numericalDbm: number;
  analyticalDbm: number;
  electricFieldVm: number;
  analyticalFieldVm: number;
  wallsCrossed: number;
}

export interface ValidationSummary {
  points: ValidationPoint[];
  rmseDb: number;
  maeDb: number;
  rSquared: number;
}

export type CellType = "empty" | "wall" | "router";

// Representación de un nodo discreto en la malla bidimensional de diferencias finitas
export interface Cell {
  x: number;
  y: number;
  type: CellType;
  material: MaterialType;
  attenuation: number; // Coeficiente local de atenuación dieléctrica α_{i,j}
  val: number;         // Potencial escalar normalizado de intensidad de radiación [0.0 - 100.0]
  fixed: boolean;      // Indica si la celda posee condición de frontera de Dirichlet fija
}

// Configuración de una fuente emisora de radiación electromagnética (Router UHF/SHF)
export interface RouterConfig {
  x: number;
  y: number;
  power: number; // Potencia normalizada de excitación en la fuente (base 100)
  ssid: string;
  frequency: "2.4 GHz" | "5 GHz";
  modelId?: string;
}

// Parámetros numéricos para el solucionador en Diferencias Finitas
export interface SimulationConfig {
  method: SolverMethod;
  tolerance: number;
  omega: number;
  maxIterations: number;
  animationDelay: number; // Tiempo de espera de refresco visual en milisegundos
}

// Resultado parcial emitido en cada iteración del lazo numérico
export interface IterationStepResult {
  grid: Cell[][];
  iteration: number;
  error: number;
  converged: boolean;
  timeMs: number;
}

// Registro histórico de la ejecución de una simulación numérica
export interface RunHistory {
  id: string;
  timestamp: string;
  method: SolverMethod;
  iterations: number;
  executionTimeMs: number;
  finalError: number;
  converged: boolean;
  omega: number;
  tolerance: number;
  gridSize: string;
  obstaclesCount: number;
  errorHistory: number[]; // Historial del residuo máximo ||r^{(k)}||_∞ por iteración
}

export type UserRole = "admin" | "standard";

// Red de cuadrícula guardada por el usuario para persistencia
export interface UserSavedNetwork {
  id: string;
  name: string;
  timestamp: string;
  walls: { x: number; y: number; material: MaterialType }[];
  routers: RouterConfig[];
  gridSize: { rows: number; cols: number };
}

// Perfil de sesión del usuario
export interface UserProfile {
  username: string;
  role: UserRole;
  savedNetworks: UserSavedNetwork[];
  password?: string;
}

import { LucideIcon } from "lucide-react";

// CAPA 1: DEFINICIONES DE TIPOS DE DATOS
// Modela todas las estructuras del dominio como la celda de la rejilla, configuraciones e historial de simulación.

export type SolverMethod = "sor";

export type MaterialType = "air" | "drywall" | "brick" | "concrete" | "metal";

export interface MaterialProperties {
  id: MaterialType;
  name: string;
  color: string;
  attenuation: number; // Coeficiente de absorción λ ∈ [0, 1) para la aproximación por diferencias finitas de Laplace
  dbLoss: number;      // Pérdida física estimada en decibelios (dB) para visualizaciones informativas
  iconName: string;
}

export type CellType = "empty" | "wall" | "router";

// Representación de una celda en la malla discreta de Laplace
export interface Cell {
  x: number;
  y: number;
  type: CellType;
  material: MaterialType;
  attenuation: number; // Copia local del coeficiente de atenuación del material correspondiente
  val: number;         // Valor normalizado del potencial de campo inalámbrico [0.0 - 100.0]
  fixed: boolean;      // Indica si la celda es una frontera inmutable (como las condiciones Dirichlet)
}

// Configuración de un emisor de señal electromagnética (Router)
export interface RouterConfig {
  x: number;
  y: number;
  power: number; // Potencia del enrutador, valor base por defecto de 100
  ssid: string;
  frequency: "2.4 GHz" | "5 GHz";
  modelId?: string;
}

// Parámetros de simulación numérica para el motor Laplaciano
export interface SimulationConfig {
  method: SolverMethod;
  tolerance: number;
  omega: number;
  maxIterations: number;
  animationDelay: number; // Tiempo de espera de refresco visual en milisegundos (0 para simulación inmediata sin animar)
}

// Resultado parcial emitido en cada iteración del lazo numérico
export interface IterationStepResult {
  grid: Cell[][];
  iteration: number;
  error: number;
  converged: boolean;
  timeMs: number;
}

// Registro histórico de la ejecución de una simulación
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
  errorHistory: number[]; // Historial de errores de cada iteración para análisis de curvas de convergencia
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

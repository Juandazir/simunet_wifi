import { LucideIcon } from "lucide-react";

export type SolverMethod = "sor";

export type MaterialType = "air" | "drywall" | "brick" | "concrete" | "metal";

export interface MaterialProperties {
  id: MaterialType;
  name: string;
  color: string;
  attenuation: number; // For the Laplace finite difference absorption λ ∈ [0, 1)
  dbLoss: number;      // Loss in dB for informational display
  iconName: string;
}

export type CellType = "empty" | "wall" | "router";

export interface Cell {
  x: number;
  y: number;
  type: CellType;
  material: MaterialType;
  attenuation: number; // Copy of material attenuation
  val: number;         // Signal value, [0.0 - 100.0]
  fixed: boolean;      // True if boundary or router
}

export interface RouterConfig {
  x: number;
  y: number;
  power: number; // Default 100
  ssid: string;
  frequency: "2.4 GHz" | "5 GHz";
  modelId?: string;
}

export interface SimulationConfig {
  method: SolverMethod;
  tolerance: number;
  omega: number;
  maxIterations: number;
  animationDelay: number; // in ms, 0 for instant
}

export interface IterationStepResult {
  grid: Cell[][];
  iteration: number;
  error: number;
  converged: boolean;
  timeMs: number;
}

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
  errorHistory: number[]; // log of error at each step
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: string;
}

export type UserRole = "admin" | "standard";

export interface UserSavedNetwork {
  id: string;
  name: string;
  timestamp: string;
  walls: { x: number; y: number; material: MaterialType }[];
  routers: RouterConfig[];
  gridSize: { rows: number; cols: number };
}

export interface UserProfile {
  username: string;
  role: UserRole;
  savedNetworks: UserSavedNetwork[];
  password?: string;
}


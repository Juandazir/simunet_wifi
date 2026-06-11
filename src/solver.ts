import { Cell, SolverMethod, MaterialType, RouterConfig } from "./types";

export interface RouterModel {
  id: string;
  name: string;
  brand: string;
  model: string;
  txPowerDbm: number;
  gainDbi: number;
  eirpDbm: number;
  frequency: "2.4 GHz" | "5 GHz";
  standard: string;
  reachMeters: number;
  description: string;
}

export const ROUTER_MODELS: Record<string, RouterModel> = {
  tplink: {
    id: "tplink",
    name: "TP-Link Archer C60",
    brand: "TP-Link",
    model: "Hogareño Estándar",
    txPowerDbm: 17,
    gainDbi: 5,
    eirpDbm: 22,
    frequency: "2.4 GHz",
    standard: "Wi-Fi 5 (802.11ac)",
    reachMeters: 25,
    description: "Router doméstico clásico MIMO 3x3 de banda estándar 2.4GHz con buena penetración de paredes pero menor velocidad."
  },
  ubiquiti: {
    id: "ubiquiti",
    name: "Ubiquiti UniFi U6 Pro",
    brand: "Ubiquiti",
    model: "Punto de Acceso Empresarial",
    txPowerDbm: 26,
    gainDbi: 6,
    eirpDbm: 32,
    frequency: "5 GHz",
    standard: "Wi-Fi 6 (802.11ax)",
    reachMeters: 45,
    description: "Punto de acceso premium empresarial con Wi-Fi 6 de alta densidad y excelente alcance balanceado en 5GHz."
  },
  asus: {
    id: "asus",
    name: "ASUS ROG GT-AX11000",
    brand: "ASUS ROG",
    model: "Gaming Ultra-Rendimiento",
    txPowerDbm: 30,
    gainDbi: 8,
    eirpDbm: 38,
    frequency: "5 GHz",
    standard: "Wi-Fi 6 (802.11ax)",
    reachMeters: 65,
    description: "Bestia de transmisión con 8 antenas externas, amplificación de hardware al límite regulatorio y rango superior."
  },
  google: {
    id: "google",
    name: "Google Nest Wifi (Mesh)",
    brand: "Google",
    model: "Nodo Inteligente de Malla",
    txPowerDbm: 20,
    gainDbi: 4,
    eirpDbm: 24,
    frequency: "5 GHz",
    standard: "Wi-Fi 5 (802.11ac)",
    reachMeters: 35,
    description: "Nodo decorativo estilizado ideal para redes malladas distribuidas y cobertura discreta de rango medio."
  }
};

export const MATERIALS = {
  air: {
    id: "air" as MaterialType,
    name: "Espacio Libre",
    color: "bg-transparent",
    attenuation: 0.0,
    dbLoss: 0,
    iconName: "Wind",
  },
  drywall: {
    id: "drywall" as MaterialType,
    name: "Pared de Yeso (Drywall)",
    color: "bg-slate-300 border-slate-400",
    attenuation: 0.20,
    dbLoss: 3,
    iconName: "Columns",
  },
  brick: {
    id: "brick" as MaterialType,
    name: "Pared de Ladrillo",
    color: "bg-amber-700 border-amber-800",
    attenuation: 0.50,
    dbLoss: 8,
    iconName: "Brick",
  },
  concrete: {
    id: "concrete" as MaterialType,
    name: "Pared de Concreto",
    color: "bg-gray-600 border-gray-700",
    attenuation: 0.80,
    dbLoss: 15,
    iconName: "SquareDot",
  },
  metal: {
    id: "metal" as MaterialType,
    name: "Pared de Metal (Blindaje)",
    color: "bg-zinc-400 border-zinc-500 animate-pulse",
    attenuation: 0.95,
    dbLoss: 35,
    iconName: "ShieldAlert",
  },
};

// Standard dimensions
export const DEFAULT_ROWS = 24;
export const DEFAULT_COLS = 24;

/**
 * Creates an empty grid initialized with boundaries and router states
 */
export function buildInitialGrid(
  rows: number,
  cols: number,
  routers: RouterConfig[],
  walls: { x: number; y: number; material: MaterialType }[],
  cellSize: number = 0.5
): Cell[][] {
  const grid: Cell[][] = [];

  for (let i = 0; i < rows; i++) {
    const row: Cell[] = [];
    for (let j = 0; j < cols; j++) {
      const isBoundary = i === 0 || i === rows - 1 || j === 0 || j === cols - 1;
      
      const wall = walls.find((w) => w.x === i && w.y === j);
      const router = routers.find((r) => r.x === i && r.y === j);

      let cellType: "empty" | "wall" | "router" = "empty";
      let material: MaterialType = "air";
      let attenuation = 0.015 * cellSize; // Base air loss per unit cell distance
      let initialVal = 0.0;
      let fixed = isBoundary;

      // Set initials
      if (isBoundary) {
        initialVal = 0.0;
      } else {
        initialVal = 10.0; // Seed value to encourage faster convergence
      }

      if (wall) {
        cellType = "wall";
        material = wall.material;
        
        let multiplier = 1.0;
        const activeRouter = routers[0];
        if (activeRouter) {
          if (activeRouter.frequency === "2.4 GHz") {
            multiplier = 0.70; // 2.4 GHz penetrates walls better
          } else {
            multiplier = 1.20; // 5 GHz gets highly attenuated by walls
          }
        }
        
        attenuation = MATERIALS[wall.material].attenuation * multiplier;
      }

      if (router) {
        cellType = "router";
        initialVal = router.power;
        fixed = true;
      }

      row.push({
        x: i,
        y: j,
        type: cellType,
        material,
        attenuation: Math.min(0.98, Math.max(0.0, attenuation)),
        val: initialVal,
        fixed,
      });
    }
    grid.push(row);
  }

  return grid;
}

/**
 * Computes a single iteration step on the grid using Successive Over-Relaxation (SOR) solver
 */
export function runSolverStep(
  currentGrid: Cell[][],
  method: SolverMethod,
  omega: number
): { grid: Cell[][]; error: number } {
  const rows = currentGrid.length;
  const cols = currentGrid[0].length;
  
  // Clone grid to prepare output
  const nextGrid = currentGrid.map((row) =>
    row.map((cell) => ({ ...cell }))
  );

  let maxError = 0;

  // SOR only
  for (let i = 1; i < rows - 1; i++) {
    for (let j = 1; j < cols - 1; j++) {
      const cell = nextGrid[i][j];
      if (cell.fixed) continue;

      const sum =
        nextGrid[i + 1][j].val +
        nextGrid[i - 1][j].val +
        nextGrid[i][j + 1].val +
        nextGrid[i][j - 1].val;

      const uGS = (1.0 - cell.attenuation) * (sum / 4.0);
      const newVal = (1.0 - omega) * cell.val + omega * uGS;
      const diff = Math.abs(newVal - cell.val);
      nextGrid[i][j].val = newVal;

      if (diff > maxError) {
        maxError = diff;
      }
    }
  }

  return { grid: nextGrid, error: maxError };
}

/**
 * Instantly solves the grid loop up to the convergence tolerance, or until max iterations is hit.
 * Useful for fast/interactive modes.
 */
export function solveInstant(
  initialGrid: Cell[][],
  method: SolverMethod,
  omega: number,
  tolerance: number,
  maxIterations: number
): { grid: Cell[][]; iterations: number; finalError: number; errorHistory: number[]; timeMs: number } {
  const start = performance.now();
  let currentGrid = initialGrid.map((row) => row.map((cell) => ({ ...cell })));
  let iterations = 0;
  let finalError = 1.0;
  const errorHistory: number[] = [];

  while (iterations < maxIterations && finalError >= tolerance) {
    const step = runSolverStep(currentGrid, method, omega);
    currentGrid = step.grid;
    finalError = step.error;
    iterations++;
    errorHistory.push(finalError);
  }

  const end = performance.now();

  return {
    grid: currentGrid,
    iterations,
    finalError,
    errorHistory,
    timeMs: Math.round((end - start) * 100) / 100,
  };
}

/**
 * Formats signal values (0 - 100) to dBm values representing typical network coverage
 * typical cell power scales from -90 dBm (noise floor) up to -30 dBm (perfect signal directly beside router)
 */
export function getDbmValue(val: number): number {
  if (val <= 0.05) return -90;
  // Normalized fit: val=100 -> -30dBm, val=0 -> -90dBm
  const dbm = -90 + (val / 100) * 60;
  return Math.round(dbm);
}

/**
 * Gets a textual quality label based on cellular/wifi dBm signal strength levels
 */
export function getSignalQuality(dbm: number): { text: string; color: string; bg: string } {
  if (dbm >= -50) {
    return { text: "Excelente (-30 a -50 dBm)", color: "text-emerald-500", bg: "bg-emerald-500" };
  } else if (dbm >= -65) {
    return { text: "Buena (-51 a -65 dBm)", color: "text-teal-500", bg: "bg-teal-500" };
  } else if (dbm >= -75) {
    return { text: "Regular (-66 a -75 dBm)", color: "text-amber-500", bg: "bg-amber-500" };
  } else if (dbm >= -85) {
    return { text: "Mala (-76 a -85 dBm)", color: "text-orange-500", bg: "bg-orange-500" };
  } else {
    return { text: "Sin Cobertura (<-85 dBm)", color: "text-rose-500", bg: "bg-rose-500" };
  }
}

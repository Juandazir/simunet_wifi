// CAPA 4 — NUMÉRICO: motor de malla Laplace y orquestación de métodos iterativos

import { Cell, SolverMethod, MaterialType, RouterConfig } from "../capa1-dominio";
import { MATERIALS } from "../capa1-dominio/modelos/materiales";
import { SOLVER_METHODS } from "./metodos";
import { convertirADbm, clasificarCalidadSenal } from "../capa5-servicios";

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
      let attenuation = 0.0012 * (cellSize / 0.5);
      let initialVal = isBoundary ? 0.0 : 20.0;
      let fixed = isBoundary;

      if (wall) {
        cellType = "wall";
        material = wall.material;
        let multiplier = 1.0;
        const activeRouter = routers[0];
        if (activeRouter) {
          multiplier = activeRouter.frequency === "2.4 GHz" ? 0.20 : 0.50;
        }
        attenuation = MATERIALS[wall.material].attenuation * multiplier * (cellSize / 0.5);
      }

      if (router) {
        cellType = "router";
        initialVal = router.power * 2.25;
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

export function runSolverStep(
  currentGrid: Cell[][],
  method: SolverMethod,
  omega: number
): { grid: Cell[][]; error: number } {
  return SOLVER_METHODS[method].run(currentGrid, omega);
}

export function methodUsesOmega(method: SolverMethod): boolean {
  return method === "sor";
}

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

  return {
    grid: currentGrid,
    iterations,
    finalError,
    errorHistory,
    timeMs: Math.round((performance.now() - start) * 100) / 100,
  };
}

export function getDbmValue(val: number): number {
  return convertirADbm(val);
}

export function getSignalQuality(dbm: number): { text: string; color: string; bg: string } {
  return clasificarCalidadSenal(dbm);
}

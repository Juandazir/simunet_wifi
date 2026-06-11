// CAPA 4 — Métodos numéricos iterativos

import { Cell } from "../../capa1-dominio";
import { runJacobiStep } from "./jacobi";
import { runGaussSeidelStep } from "./gauss-seidel";
import { runSorStep } from "./sor";

export type SolverStepFn = (
  grid: Cell[][],
  omega: number
) => { grid: Cell[][]; error: number };

export const SOLVER_METHODS = {
  jacobi: {
    label: "Jacobi",
    description: "Actualización paralela con valores de la iteración anterior.",
    run: (grid: Cell[][]) => runJacobiStep(grid),
  },
  "gauss-seidel": {
    label: "Gauss-Seidel",
    description: "Actualización secuencial in-place. Más rápido que Jacobi.",
    run: (grid: Cell[][]) => runGaussSeidelStep(grid),
  },
  sor: {
    label: "SOR",
    description: "Sobre-relajación con factor ω para acelerar convergencia.",
    run: (grid: Cell[][], omega: number) => runSorStep(grid, omega),
  },
} as const;

export { runJacobiStep, runGaussSeidelStep, runSorStep };

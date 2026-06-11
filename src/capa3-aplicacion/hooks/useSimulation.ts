import { useState, useEffect, useRef, useCallback } from "react";
import {
  Cell,
  MaterialType,
  RouterConfig,
  RunHistory,
  SimulationConfig,
  SolverMethod,
} from "../../capa1-dominio";
import { buildInitialGrid, runSolverStep, solveInstant } from "../../capa4-numerico";
import { buildRouterFromModel } from "../../capa1-dominio";

interface UseSimulationOptions {
  gridSize: { rows: number; cols: number };
  routers: RouterConfig[];
  walls: { x: number; y: number; material: MaterialType }[];
  cellSize: number;
}

export function useSimulation({
  gridSize,
  routers,
  walls,
  cellSize,
}: UseSimulationOptions) {
  const [grid, setGrid] = useState<Cell[][]>([]);
  const [config, setConfig] = useState<SimulationConfig>({
    method: "sor",
    tolerance: 0.001,
    omega: 1.25,
    maxIterations: 600,
    animationDelay: 10,
  });
  const [isRunning, setIsRunning] = useState(false);
  const [currentIteration, setCurrentIteration] = useState(0);
  const [currentError, setCurrentError] = useState(0);
  const [timeMs, setTimeMs] = useState(0);
  const [isConverged, setIsConverged] = useState(false);
  const [currentErrorHistory, setCurrentErrorHistory] = useState<number[]>([]);
  const [history, setHistory] = useState<RunHistory[]>([]);
  const startTimeRef = useRef<number | null>(null);

  const rebuildGrid = useCallback(() => {
    const initial = buildInitialGrid(
      gridSize.rows,
      gridSize.cols,
      routers,
      walls,
      cellSize
    );
    setGrid(initial);
    setCurrentIteration(0);
    setCurrentError(0);
    setTimeMs(0);
    setIsConverged(false);
    setCurrentErrorHistory([]);
  }, [gridSize, routers, walls, cellSize]);

  useEffect(() => {
    rebuildGrid();
  }, [rebuildGrid]);

  const recordRun = useCallback(
    (
      method: SolverMethod,
      iterations: number,
      elapsed: number,
      finalError: number,
      achievedConvergence: boolean,
      errorHist: number[]
    ) => {
      const newRun: RunHistory = {
        id: crypto.randomUUID(),
        timestamp: new Date().toLocaleTimeString(),
        method,
        iterations,
        executionTimeMs: elapsed,
        finalError,
        converged: achievedConvergence,
        omega: config.omega,
        tolerance: config.tolerance,
        gridSize: `${gridSize.rows}x${gridSize.cols}`,
        obstaclesCount: walls.length,
        errorHistory: errorHist,
      };
      setHistory((prev) => [newRun, ...prev]);
    },
    [config.omega, config.tolerance, gridSize, walls.length]
  );

  useEffect(() => {
    if (!isRunning) {
      startTimeRef.current = null;
      return;
    }

    if (startTimeRef.current === null) {
      startTimeRef.current = performance.now();
    }

    const timer = setTimeout(() => {
      const stepResult = runSolverStep(grid, config.method, config.omega);
      const newIteration = currentIteration + 1;
      const newError = stepResult.error;
      const elapsed = Math.round(performance.now() - (startTimeRef.current || 0));

      setGrid(stepResult.grid);
      setCurrentIteration(newIteration);
      setCurrentError(newError);
      setTimeMs(elapsed);

      const updatedErrorHist = [...currentErrorHistory, newError];
      setCurrentErrorHistory(updatedErrorHist);

      const achievedConvergence = newError < config.tolerance;
      const hitLimit = newIteration >= config.maxIterations;

      if (achievedConvergence || hitLimit) {
        setIsRunning(false);
        setIsConverged(achievedConvergence);
        recordRun(
          config.method,
          newIteration,
          elapsed,
          newError,
          achievedConvergence,
          updatedErrorHist
        );
      }
    }, config.animationDelay);

    return () => clearTimeout(timer);
  }, [
    isRunning,
    grid,
    currentIteration,
    config,
    currentErrorHistory,
    recordRun,
  ]);

  const solveInstantly = useCallback(() => {
    setIsRunning(false);
    const result = solveInstant(
      grid,
      config.method,
      config.omega,
      config.tolerance,
      config.maxIterations
    );
    const converged = result.finalError < config.tolerance;

    setGrid(result.grid);
    setCurrentIteration(result.iterations);
    setCurrentError(result.finalError);
    setTimeMs(result.timeMs);
    setIsConverged(converged);
    setCurrentErrorHistory(result.errorHistory);
    recordRun(
      config.method,
      result.iterations,
      result.timeMs,
      result.finalError,
      converged,
      result.errorHistory
    );
  }, [grid, config, recordRun]);

  const singleStep = useCallback(() => {
    setIsRunning(false);
    const stepResult = runSolverStep(grid, config.method, config.omega);
    setGrid(stepResult.grid);
    setCurrentIteration((prev) => prev + 1);
    setCurrentError(stepResult.error);
    setCurrentErrorHistory((prev) => [...prev, stepResult.error]);
  }, [grid, config]);

  const applySolvedGrid = useCallback(
    (
      solvedGrid: Cell[][],
      iterations: number,
      finalError: number,
      elapsed: number,
      errorHist: number[]
    ) => {
      setGrid(solvedGrid);
      setCurrentIteration(iterations);
      setCurrentError(finalError);
      setTimeMs(elapsed);
      setIsConverged(finalError < config.tolerance);
      setCurrentErrorHistory(errorHist);
    },
    [config.tolerance]
  );

  return {
    grid,
    config,
    setConfig,
    isRunning,
    setIsRunning,
    currentIteration,
    currentError,
    timeMs,
    isConverged,
    currentErrorHistory,
    history,
    setHistory,
    rebuildGrid,
    solveInstantly,
    singleStep,
    applySolvedGrid,
    buildGrid: () =>
      buildInitialGrid(gridSize.rows, gridSize.cols, routers, walls, cellSize),
    makeRouter: (x: number, y: number, modelId: string) =>
      buildRouterFromModel(modelId, x, y),
  };
}

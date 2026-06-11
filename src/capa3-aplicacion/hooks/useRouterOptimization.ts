import { useState, useCallback } from "react";
import { MaterialType, buildRouterFromModel } from "../../capa1-dominio";
import { buildInitialGrid, solveInstant } from "../../capa4-numerico";

export interface OptimizationResult {
  x: number;
  y: number;
  avgSignal: number;
  coveragePct: number;
  candidatesTested: number;
  topCandidates: Array<{
    x: number;
    y: number;
    avgSignal: number;
    coveragePct: number;
    score: number;
    zoneName: string;
  }>;
}

interface UseRouterOptimizationOptions {
  gridSize: { rows: number; cols: number };
  walls: { x: number; y: number; material: MaterialType }[];
  cellSize: number;
  selectedRouterModelId: string;
}

export function useRouterOptimization({
  gridSize,
  walls,
  cellSize,
  selectedRouterModelId,
}: UseRouterOptimizationOptions) {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationResult, setOptimizationResult] =
    useState<OptimizationResult | null>(null);

  const findBestLocation = useCallback(() => {
    setIsOptimizing(true);
    setOptimizationResult(null);

    setTimeout(() => {
      const { rows, cols } = gridSize;
      const step = rows <= 15 ? 1 : rows <= 25 ? 2 : 3;

      const candidatesList: OptimizationResult["topCandidates"] = [];

      const getZoneLabel = (r: number, c: number) => {
        const pctR = r / rows;
        const pctC = c / cols;
        const vert = pctR < 0.35 ? "Norte" : pctR > 0.65 ? "Sur" : "Centro";
        const horiz = pctC < 0.35 ? "Oeste" : pctC > 0.65 ? "Este" : "Centro";
        if (vert === "Centro" && horiz === "Centro") return "Zona Central";
        return `Zona ${vert}-${horiz}`;
      };

      for (let r = 2; r < rows - 2; r += step) {
        for (let c = 2; c < cols - 2; c += step) {
          if (walls.some((w) => w.x === r && w.y === c)) continue;

          const tempRouters = [buildRouterFromModel(selectedRouterModelId, r, c)];
          const tempGrid = buildInitialGrid(rows, cols, tempRouters, walls, cellSize);
          const solveResult = solveInstant(tempGrid, "sor", 1.25, 0.01, 25);

          let cellValsSum = 0;
          let coveredCellsCount = 0;
          let activeCellsCount = 0;

          for (let i = 1; i < rows - 1; i++) {
            for (let j = 1; j < cols - 1; j++) {
              const testCell = solveResult.grid[i][j];
              if (testCell.type !== "wall") {
                activeCellsCount++;
                cellValsSum += testCell.val;
                if (testCell.val >= 25) coveredCellsCount++;
              }
            }
          }

          if (activeCellsCount === 0) activeCellsCount = 1;
          const avgSignal = cellValsSum / activeCellsCount;
          const coveragePct = (coveredCellsCount / activeCellsCount) * 100;
          const score = avgSignal * 0.7 + coveragePct * 0.3;

          candidatesList.push({
            x: r,
            y: c,
            avgSignal: Math.round(avgSignal),
            coveragePct: Math.round(coveragePct),
            score,
            zoneName: getZoneLabel(r, c),
          });
        }
      }

      candidatesList.sort((a, b) => b.score - a.score);

      if (candidatesList.length === 0) {
        setIsOptimizing(false);
        return;
      }

      const best = candidatesList[0];
      const topCandidates: typeof candidatesList = [];
      for (const cand of candidatesList) {
        const tooClose = topCandidates.some(
          (e) => Math.abs(e.x - cand.x) + Math.abs(e.y - cand.y) < 4
        );
        if (!tooClose) topCandidates.push(cand);
        if (topCandidates.length >= 4) break;
      }

      setOptimizationResult({
        x: best.x,
        y: best.y,
        avgSignal: best.avgSignal,
        coveragePct: best.coveragePct,
        candidatesTested: candidatesList.length,
        topCandidates,
      });
      setIsOptimizing(false);
    }, 800);
  }, [gridSize, walls, cellSize, selectedRouterModelId]);

  const clearResult = useCallback(() => setOptimizationResult(null), []);

  return {
    isOptimizing,
    optimizationResult,
    findBestLocation,
    clearResult,
  };
}

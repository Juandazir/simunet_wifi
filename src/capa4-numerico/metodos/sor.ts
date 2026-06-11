import { Cell } from "../../capa1-dominio";

export function runSorStep(
  currentGrid: Cell[][],
  omega: number
): { grid: Cell[][]; error: number } {
  const rows = currentGrid.length;
  const cols = currentGrid[0].length;
  const nextGrid = currentGrid.map((row) => row.map((cell) => ({ ...cell })));
  let maxError = 0;

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
      if (diff > maxError) maxError = diff;
    }
  }

  return { grid: nextGrid, error: maxError };
}

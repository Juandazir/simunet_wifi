import { Cell } from "../types";

/**
 * CAPA 4: MÉTODOS NUMÉRICOS ITERATIVOS
 *
 * Método de Jacobi (Actualización Simultánea):
 * Calcula el nuevo valor potencial de cada nodo (i, j) en la iteración k+1 utilizando
 * exclusivamente los valores de sus 4 vecinos ortogonales de la iteración anterior k.
 */
export function runJacobiStep(
  currentGrid: Cell[][]
): { grid: Cell[][]; error: number } {
  const rows = currentGrid.length;
  const cols = currentGrid[0].length;

  const nextGrid = currentGrid.map((row) =>
    row.map((cell) => ({ ...cell }))
  );

  let maxError = 0;

  for (let i = 1; i < rows - 1; i++) {
    for (let j = 1; j < cols - 1; j++) {
      const cell = currentGrid[i][j];
      if (cell.fixed) continue;

      // En Jacobi se leen estrictamente los valores del estado previo (currentGrid)
      const sum =
        currentGrid[i + 1][j].val +
        currentGrid[i - 1][j].val +
        currentGrid[i][j + 1].val +
        currentGrid[i][j - 1].val;

      const newVal = (1.0 - cell.attenuation) * (sum / 4.0);
      const diff = Math.abs(newVal - cell.val);

      nextGrid[i][j].val = newVal;

      if (diff > maxError) {
        maxError = diff;
      }
    }
  }

  return { grid: nextGrid, error: maxError };
}

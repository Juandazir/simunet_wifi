import { Cell } from "../types";

/**
 * CAPA 4: MÉTODOS NUMÉRICOS ITERATIVOS
 * 
 * Método de Sobre-Relajación Sucesiva (SOR):
 * Aplica una corrección ponderada mediante el coeficiente óptimo 'omega' (ω) sobre la aproximación estándar 
 * de Gauss-Seidel. Si 1 < omega < 2, se realiza sobre-relajación para acelerar dramáticamente la
 * velocidad de convergencia al extrapolar la dirección de búsqueda del campo.
 */
export function runSorStep(
  currentGrid: Cell[][],
  omega: number
): { grid: Cell[][]; error: number } {
  const rows = currentGrid.length;
  const cols = currentGrid[0].length;
  
  // Clonar para disponer de una estructura de escritura limpia preservando condiciones fijas
  const nextGrid = currentGrid.map((row) =>
    row.map((cell) => ({ ...cell }))
  );

  let maxError = 0;

  // Ciclo interior de celdas bidimensionales
  for (let i = 1; i < rows - 1; i++) {
    for (let j = 1; j < cols - 1; j++) {
      const cell = nextGrid[i][j];
      if (cell.fixed) continue; // Salta enrutadores emisores fijos o paredes de borde Dirichlet

      const sum =
        nextGrid[i + 1][j].val +
        nextGrid[i - 1][j].val +
        nextGrid[i][j + 1].val +
        nextGrid[i][j - 1].val;

      const uGS = (1.0 - cell.attenuation) * (sum / 4.0);
      
      // Interpolación lineal ponderada usando la aproximación Gauss-Seidel y el valor previo
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


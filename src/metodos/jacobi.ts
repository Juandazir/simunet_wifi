// Importa la interfaz Cell que representa cada nodo discreto (i, j) de la malla bidimensional
import { Cell } from "../types";

/**
 * CAPA 4: MÉTODOS NUMÉRICOS ITERATIVOS
 *
 * Método de Jacobi (Desplazamientos Simultáneos):
 * Calcula el nuevo potencial escalar u_{i,j}^{(k+1)} de cada nodo interior (i, j) utilizando
 * exclusivamente los potenciales de sus 4 vecinos ortogonales en la iteración previa (k):
 *
 *   u_{i,j}^{(k+1)} = (1 - α_{i,j}) · [ u_{i+1,j}^{(k)} + u_{i-1,j}^{(k)} + u_{i,j+1}^{(k)} + u_{i,j-1}^{(k)} ] / 4
 *
 * @param currentGrid Matriz bidimensional con el estado de la malla en la iteración actual (k).
 * @returns Objeto con la nueva malla actualizada (k+1) y el error residual máximo ||u^{(k+1)} - u^{(k)}||_∞.
 */
export function runJacobiStep(
  currentGrid: Cell[][]
): { grid: Cell[][]; error: number } {
  // Obtiene el número total de filas N_y de la rejilla computacional
  const rows = currentGrid.length;
  // Obtiene el número total de columnas N_x de la rejilla computacional
  const cols = currentGrid[0].length;

  // Clona profundamente la malla actual para escribir los valores (k+1) sin alterar la lectura del estado (k)
  const nextGrid = currentGrid.map((row) =>
    row.map((cell) => ({ ...cell }))
  );

  // Inicializa en cero el acumulador de la norma infinito del error residual de esta iteración
  let maxError = 0;

  // Recorre las filas interiores (desde i = 1 hasta rows - 2), respetando la frontera exterior de Dirichlet
  for (let i = 1; i < rows - 1; i++) {
    // Recorre las columnas interiores (desde j = 1 hasta cols - 2), respetando la frontera exterior de Dirichlet
    for (let j = 1; j < cols - 1; j++) {
      // Referencia al nodo (i, j) leído desde la malla de la iteración previa (k)
      const cell = currentGrid[i][j];
      // Si el nodo tiene condición de frontera fija (ej. es un router emisor), su potencial no se modifica
      if (cell.fixed) continue;

      // Suma los potenciales de los 4 vecinos ortogonales leyendo estrictamente de currentGrid (iteración k)
      const sum =
        currentGrid[i + 1][j].val + // Vecino inferior / Sur (i+1, j) en el paso k
        currentGrid[i - 1][j].val + // Vecino superior / Norte (i-1, j) en el paso k
        currentGrid[i][j + 1].val + // Vecino derecho / Este (i, j+1) en el paso k
        currentGrid[i][j - 1].val;  // Vecino izquierdo / Oeste (i, j-1) en el paso k

      // Aplica el promedio de la estrella de 5 puntos ponderado por el factor de transmisión local (1 - α_{i,j})
      const newVal = (1.0 - cell.attenuation) * (sum / 4.0);
      // Calcula la magnitud absoluta de la variación nodal |u_{i,j}^{(k+1)} - u_{i,j}^{(k)}|
      const diff = Math.abs(newVal - cell.val);

      // Almacena el nuevo potencial calculado en la matriz de salida correspondiente a la iteración (k+1)
      nextGrid[i][j].val = newVal;

      // Actualiza el máximo error residual de la malla si el cambio en este nodo supera el máximo previo
      if (diff > maxError) {
        maxError = diff;
      }
    }
  }

  // Retorna la nueva matriz de celdas (k+1) y el error máximo registrado para evaluar el criterio de parada
  return { grid: nextGrid, error: maxError };
}

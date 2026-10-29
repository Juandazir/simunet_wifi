// Importa la interfaz Cell que modela cada nodo discreto (i, j) de la rejilla de simulación
import { Cell } from "../types";

/**
 * CAPA 4: MÉTODOS NUMÉRICOS ITERATIVOS
 *
 * Método de Gauss-Seidel (Desplazamientos Sucesivos, caso particular de SOR con ω = 1.0):
 * A diferencia de Jacobi, utiliza inmediatamente los valores ya actualizados en la misma iteración (k+1)
 * para los vecinos superior (i-1, j) e izquierdo (i, j-1), mientras usa los valores (k) de los vecinos
 * aún no visitados (i+1, j) e (i, j+1):
 *
 *   u_{i,j}^{(k+1)} = (1 - α_{i,j}) · [ u_{i+1,j}^{(k)} + u_{i-1,j}^{(k+1)} + u_{i,j+1}^{(k)} + u_{i,j-1}^{(k+1)} ] / 4
 *
 * Esto reduce el radio espectral de la matriz de iteración al cuadrado (ρ_GS = ρ_J²) y duplica la velocidad
 * asintótica de convergencia sin requerir memoria adicional para una segunda matriz de lectura.
 *
 * @param currentGrid Matriz bidimensional con el estado actual de la malla en la iteración (k).
 * @returns Objeto con la malla actualizada (k+1) y el error residual máximo ||u^{(k+1)} - u^{(k)}||_∞.
 */
export function runGaussSeidelStep(
  currentGrid: Cell[][]
): { grid: Cell[][]; error: number } {
  // Obtiene la cantidad total de filas N_y de la malla
  const rows = currentGrid.length;
  // Obtiene la cantidad total de columnas N_x de la malla
  const cols = currentGrid[0].length;

  // Crea una copia profunda de trabajo sobre la cual se leerán y sobrescribirán sucesivamente los nodos (in-place)
  const nextGrid = currentGrid.map((row) =>
    row.map((cell) => ({ ...cell }))
  );

  // Inicializa en cero el acumulador de la norma infinito del error residual en esta iteración
  let maxError = 0;

  // Recorre las filas interiores (1 <= i <= rows - 2) en orden lexicográfico de arriba hacia abajo
  for (let i = 1; i < rows - 1; i++) {
    // Recorre las columnas interiores (1 <= j <= cols - 2) de izquierda a derecha
    for (let j = 1; j < cols - 1; j++) {
      // Obtiene la referencia al nodo actual dentro de la malla de trabajo nextGrid
      const cell = nextGrid[i][j];
      // Si el nodo es fijo (condición de frontera de Dirichlet en el router), se salta sin alterarlo
      if (cell.fixed) continue;

      // Suma los 4 vecinos ortogonales leyendo directamente de nextGrid:
      // (i-1, j) e (i, j-1) ya contienen los valores recién calculados del paso (k+1)
      const sum =
        nextGrid[i + 1][j].val + // Vecino inferior / Sur (i+1, j) aún en estado (k)
        nextGrid[i - 1][j].val + // Vecino superior / Norte (i-1, j) ya actualizado a (k+1)
        nextGrid[i][j + 1].val + // Vecino derecho / Este (i, j+1) aún en estado (k)
        nextGrid[i][j - 1].val;  // Vecino izquierdo / Oeste (i, j-1) ya actualizado a (k+1)

      // Calcula el nuevo potencial amortiguado por el coeficiente de absorción dieléctrica α_{i,j} del nodo
      const newVal = (1.0 - cell.attenuation) * (sum / 4.0);
      // Evalúa la diferencia absoluta entre el nuevo potencial y el valor que tenía antes de actualizarse
      const diff = Math.abs(newVal - cell.val);

      // Sobrescribe inmediatamente el potencial del nodo en nextGrid para que sirva al siguiente vecino
      nextGrid[i][j].val = newVal;

      // Si el cambio absoluto en este nodo supera el error máximo registrado hasta ahora, lo actualiza
      if (diff > maxError) {
        maxError = diff;
      }
    }
  }

  // Devuelve la malla actualizada y el error residual máximo de la iteración
  return { grid: nextGrid, error: maxError };
}

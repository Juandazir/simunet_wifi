// Importa la interfaz Cell que define la estructura de cada nodo discreto de la malla
import { Cell } from "../types";

/**
 * CAPA 4: MÉTODOS NUMÉRICOS ITERATIVOS
 *
 * Método de Sobre-Relajación Sucesiva (SOR - Successive Over-Relaxation):
 * Acelera la convergencia del método de Gauss-Seidel extrapolando el nuevo valor en la dirección
 * del cambio mediante un factor de relajación espectral ω ∈ (1, 2):
 *
 *   ũ_{i,j} = (1 - α_{i,j}) · [ u_{i+1,j}^{(k)} + u_{i-1,j}^{(k+1)} + u_{i,j+1}^{(k)} + u_{i,j-1}^{(k+1)} ] / 4
 *   u_{i,j}^{(k+1)} = (1 - ω) · u_{i,j}^{(k)} + ω · ũ_{i,j}
 *
 * Por el Teorema de Kahan-Ostrowski-Reich, el método converge si y solo si 0 < ω < 2, alcanzando su
 * velocidad máxima cuando ω_opt = 2 / (1 + √(1 - ρ_J²)), reduciendo el orden de iteraciones de O(N²) a O(N).
 *
 * @param currentGrid Estado actual de la malla bidimensional en la iteración (k).
 * @param omega Coeficiente de relajación ω (sobre-relajación si 1 < ω < 2).
 * @returns Objeto con la nueva malla calculada (k+1) y el error residual máximo ||u^{(k+1)} - u^{(k)}||_∞.
 */
export function runSorStep(
  currentGrid: Cell[][],
  omega: number
): { grid: Cell[][]; error: number } {
  // Obtiene el número de filas N_y de la matriz de simulación
  const rows = currentGrid.length;
  // Obtiene el número de columnas N_x de la matriz de simulación
  const cols = currentGrid[0].length;

  // Clona la matriz actual para operar sobre una referencia inmutable respecto al estado de React
  const nextGrid = currentGrid.map((row) =>
    row.map((cell) => ({ ...cell }))
  );

  // Variable acumuladora para registrar la norma infinito (máximo valor absoluto) del residuo en la iteración
  let maxError = 0;

  // Recorre los nodos interiores por filas (excluyendo las filas de frontera 0 y rows - 1)
  for (let i = 1; i < rows - 1; i++) {
    // Recorre los nodos interiores por columnas (excluyendo las columnas de frontera 0 y cols - 1)
    for (let j = 1; j < cols - 1; j++) {
      // Obtiene el nodo actual (i, j) dentro de la malla de trabajo
      const cell = nextGrid[i][j];
      // Si el nodo posee condición de Dirichlet fija (fuente emisora activa), preserva su valor intacto
      if (cell.fixed) continue;

      // 1. Suma los potenciales de los 4 vecinos ortogonales (esquema en diferencias centrales de 5 puntos)
      const sum =
        nextGrid[i + 1][j].val + // Vecino inferior / Sur (i+1, j) en estado (k)
        nextGrid[i - 1][j].val + // Vecino superior / Norte (i-1, j) ya actualizado a (k+1)
        nextGrid[i][j + 1].val + // Vecino derecho / Este (i, j+1) en estado (k)
        nextGrid[i][j - 1].val;  // Vecino izquierdo / Oeste (i, j-1) ya actualizado a (k+1)

      // 2. Calcula el estimador intermedio de Gauss-Seidel ũ_{i,j} afectado por la absorción dieléctrica α_{i,j}
      const uGS = (1.0 - cell.attenuation) * (sum / 4.0);

      // 3. Aplica la combinación afín de sobre-relajación ponderada por el factor espectral ω
      const newVal = (1.0 - omega) * cell.val + omega * uGS;

      // 4. Calcula la magnitud absoluta del desplazamiento nodal |u_{i,j}^{(k+1)} - u_{i,j}^{(k)}|
      const diff = Math.abs(newVal - cell.val);

      // 5. Actualiza inmediatamente el potencial escalar del nodo en la malla para las siguientes celdas
      nextGrid[i][j].val = newVal;

      // 6. Registra si este nodo presenta la mayor variación residual de toda la malla en el paso actual
      if (diff > maxError) {
        maxError = diff;
      }
    }
  }

  // Devuelve la malla actualizada junto con el error residual máximo para comprobar convergencia
  return { grid: nextGrid, error: maxError };
}

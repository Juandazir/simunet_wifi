import { Cell } from "../types";

/**
 * CAPA 4: MÉTODOS NUMÉRICOS ITERATIVOS
 * 
 * Método de Sobre-Relajación Sucesiva (SOR):
 * Aplica una corrección ponderada mediante el coeficiente óptimo 'omega' (ω) sobre la aproximación estándar 
 * de Gauss-Seidel. Si 1 < omega < 2, se realiza sobre-relajación para acelerar dramáticamente la
 * velocidad de convergencia al extrapolar la dirección de búsqueda del campo.
 * 
 * @param currentGrid Estado actual de la malla de simulación bidimensional.
 * @param omega Coeficiente de relajación (ω) para modular el grado de extrapolación.
 * @returns Un objeto con la nueva configuración de la malla calculada y el error residual máximo de esta iteración.
 */
export function runSorStep(
  currentGrid: Cell[][],
  omega: number
): { grid: Cell[][]; error: number } {
  // Obtener las dimensiones (filas y columnas) de la malla de simulación
  const rows = currentGrid.length;
  const cols = currentGrid[0].length;
  
  // Realizar una copia profunda (clonación) para asegurar que el cálculo se efectúe sobre datos frescos
  // y evitar mutaciones directas de estado concurrentes durante las actualizaciones en la interfaz de React.
  const nextGrid = currentGrid.map((row) =>
    row.map((cell) => ({ ...cell }))
  );

  // Variable de control para registrar la diferencia o error residual máximo (Norma infinito L-inf)
  let maxError = 0;

  // Ciclo interior de celdas bidimensionales, evitando los límites exteriores (condición de frontera fija de Dirichlet)
  for (let i = 1; i < rows - 1; i++) {
    for (let j = 1; j < cols - 1; j++) {
      const cell = nextGrid[i][j];
      // Si el nodo es fijo (como un router emisor) o una frontera Dirichlet, se conserva intacto su potencial.
      if (cell.fixed) continue; 

      // 1. Obtener la suma de los valores de los 4 vecinos ortogonales inmediatos (arriba, abajo, izquierda, derecha)
      //    Esto discretiza la ecuación de Laplace en la rejilla usando un esquema de diferencias finitamente espaciado.
      const sum =
        nextGrid[i + 1][j].val + // Vecino inferior o sur (i+1, j)
        nextGrid[i - 1][j].val + // Vecino superior o norte (i-1, j)
        nextGrid[i][j + 1].val + // Vecino derecho o este (i, j+1)
        nextGrid[i][j - 1].val;  // Vecino izquierdo o oeste (i, j-1)

      // 2. Calcular la estimación del método de Gauss-Seidel (uGS) amortiguada por el coeficiente de atenuación
      //    de los materiales/obstáculos presentes en la celda computacional.
      const uGS = (1.0 - cell.attenuation) * (sum / 4.0);
      
      // 3. Interpolación lineal ponderada de sobre-relajación. Se combina el valor previo de la celda
      //    multiplicado por (1.0 - omega) con la nueva estimación Gauss-Seidel amplificada por omega (ω).
      const newVal = (1.0 - omega) * cell.val + omega * uGS;
      
      // 4. Determinar el módulo del cambio absoluto respecto al valor anterior de la celda.
      const diff = Math.abs(newVal - cell.val);
      
      // 5. Actualizar la celda de la rejilla con el nuevo potencial escalar escalar calculado.
      nextGrid[i][j].val = newVal;

      // 6. Monitorear si esta diferencia discreta supera el error residual máximo acumulado de la iteración.
      if (diff > maxError) {
        maxError = diff;
      }
    }
  }

  // Devolver la malla actualizada junto con el valor máximo de error residual para verificar la convergencia.
  return { grid: nextGrid, error: maxError };
}



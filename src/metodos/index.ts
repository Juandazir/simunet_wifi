/**
 * CAPA 4: MÉTODOS NUMÉRICOS ITERATIVOS - ÍNDICE DE EXPORTACIÓN
 * Centraliza y re-exporta los tres esquemas iterativos en Diferencias Finitas (FDM)
 * empleados para resolver la ecuación estacionaria de difusión-absorción 2D (∇²u - κ²u = 0):
 * - Jacobi (actualización síncrona sobre copia del estado previo k)
 * - Gauss-Seidel (relajación sucesiva inmediata in-place, equivalente a ω = 1.0)
 * - SOR (Sobre-Relajación Sucesiva con aceleración espectral óptima, 1 < ω < 2)
 */

// Importa el paso iterativo del método de Jacobi desde su módulo dedicado
import { runJacobiStep } from "./jacobi";
// Importa el paso iterativo del método de Gauss-Seidel desde su módulo dedicado
import { runGaussSeidelStep } from "./gauss-seidel";
// Importa el paso iterativo del método SOR (Successive Over-Relaxation) desde su módulo dedicado
import { runSorStep } from "./sor";

// Exporta los tres solucionadores para que sean consumidos por el controlador de la Capa 2
export {
  runJacobiStep,
  runGaussSeidelStep,
  runSorStep
};

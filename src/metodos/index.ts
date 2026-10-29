/**
 * CAPA 4: MÉTODOS NUMÉRICOS ITERATIVOS - ÍNDICE DE MÉTODOS
 * Exporta los tres métodos iterativos de diferencias finitas para problemas de valor en la frontera:
 * - Jacobi (actualización simultánea)
 * - Gauss-Seidel (relajación sucesiva estándar, ω = 1)
 * - SOR (Sobre-Relajación Sucesiva con aceleración espectral, 1 < ω < 2)
 */

import { runJacobiStep } from "./jacobi";
import { runGaussSeidelStep } from "./gauss-seidel";
import { runSorStep } from "./sor";

export {
  runJacobiStep,
  runGaussSeidelStep,
  runSorStep
};

import React, { useState } from "react";
import { BookOpen, HelpCircle, GraduationCap, ArrowRight, Sparkles, Check } from "lucide-react";

interface LaplaceDocProps {
  isDarkMode: boolean;
}

export default function LaplaceDoc({ isDarkMode }: LaplaceDocProps) {
  const [activeVariables, setActiveVariables] = useState<string | null>(null);

  const variablesExplanation = {
    u_ij: "Potencia o potencial eléctrico de la señal de Wi-Fi en el punto (i, j). Su escala es porcentual [0-100%]. Representa la variable u.",
    neighbors: "Los cuatro vecinos adyacentes: Superior u_{i-1,j}, Inferior u_{i+1,j}, Izquierdo u_{i,j-1}, Derecho u_{i,j+1}.",
    lambda: "Coeficiente de atenuación electromagnética (0 para el vacío/aire, hasta 0.95 para blindajes metálicos). Absorbe energía impidiendo la propagación.",
    omega: "Factor de relajación en SOR (0 < ω < 2). Un valor óptimo (ej. 1.25) sobre-aplica la corrección acelerando sustancialmente el número de iteraciones.",
  };

  return (
    <div className={`p-6 rounded-3xl border transition-all duration-300 ${
      isDarkMode 
        ? "bg-slate-900 border-slate-800 text-slate-100" 
        : "bg-white border-slate-200 text-slate-800 shadow-sm"
    }`}>
      <div className="flex items-center gap-2 mb-4">
        <GraduationCap className="w-5 h-5 text-indigo-500" />
        <h3 className="text-base font-bold tracking-tight">Ecuación de Laplace & Documentación</h3>
        <span className="text-[10px] bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 font-bold px-2.5 py-0.5 rounded-full ml-auto">
          Análisis Numérico
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
            La Ecuación Diferencial en 2D
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
            La distribución de la potencia electromagnética del Wi-Fi en régimen estacionario obedece a la <strong>Ecuación de Laplace</strong> modificada para incluir pérdidas por obstáculos materiales:
          </p>

          {/* Clean Formula Wrapper */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800/80 flex flex-col justify-center items-center gap-1.5 font-mono text-xs select-all text-center">
            <div className="text-indigo-600 dark:text-indigo-400 font-bold text-sm">
              ∇²u = 0  &rArr;  &part;²u/&part;x² + &part;²u/&part;y² = 0
            </div>
            <div className="text-[10px] text-slate-400">
              Estacionario sin fuentes internas (Leyes de Maxwell simplificadas)
            </div>
          </div>

          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mt-4 mb-2">
            Discretización Diferencias Finitas
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-3.5">
            Para resolverla numéricamente, aplicamos diferencias finitas centradas de segundo orden en una malla de {`i, j`}. El valor de cada celda se convierte en el promedio de sus vecinos multiplicado por la penetración material:
          </p>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800/80 font-mono text-center flex flex-col gap-2">
            <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold leading-relaxed">
              u<sub>i,j</sub><sup>(k+1)</sup> = (1 - &lambda;<sub>i,j</sub>) &times; [ u<sub>i+1,j</sub> + u<sub>i-1,j</sub> + u<sub>i,j+1</sub> + u<sub>i,j-1</sub> ] / 4
            </div>
            <div className="text-[10px] text-amber-600 dark:text-amber-400 italic">
              Con SOR: u<sup>(k+1)</sup> = (1 - &omega;)u<sup>(k)</sup> + &omega; &times; u<sub>GS</sub>
            </div>
          </div>
        </div>

        {/* Interactive Math Inspector */}
        <div className="flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
              Explorador Interactivo de Parámetros
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Haz clic en cualquier término de la fórmula de diferencias finitas para comprender su impacto físico y matemático en el Wi-Fi:
            </p>

            <div className="flex flex-wrap gap-1.5 mb-3.5">
              <button 
                onClick={() => setActiveVariables("u_ij")}
                className={`px-3 py-1.5 rounded-xl font-mono text-xs cursor-pointer border transition ${
                  activeVariables === "u_ij" 
                    ? "bg-indigo-600 border-indigo-600 text-white font-bold" 
                    : "bg-slate-100 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                }`}
              >
                u_ij (Señal)
              </button>
              <button 
                onClick={() => setActiveVariables("neighbors")}
                className={`px-3 py-1.5 rounded-xl font-mono text-xs cursor-pointer border transition ${
                  activeVariables === "neighbors" 
                    ? "bg-indigo-600 border-indigo-600 text-white font-bold" 
                    : "bg-slate-100 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                }`}
              >
                Vecinos 4-Conexos
              </button>
              <button 
                onClick={() => setActiveVariables("lambda")}
                className={`px-3 py-1.5 rounded-xl font-mono text-xs cursor-pointer border transition ${
                  activeVariables === "lambda" 
                    ? "bg-indigo-600 border-indigo-600 text-white font-bold" 
                    : "bg-slate-100 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                }`}
              >
                &lambda; (Atenuación)
              </button>
              <button 
                onClick={() => setActiveVariables("omega")}
                className={`px-3 py-1.5 rounded-xl font-mono text-xs cursor-pointer border transition ${
                  activeVariables === "omega" 
                    ? "bg-indigo-600 border-indigo-600 text-white font-bold" 
                    : "bg-slate-100 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                }`}
              >
                &omega; (Relaxation)
              </button>
            </div>

            <div className={`p-4 rounded-2xl text-xs leading-relaxed border transition-all duration-200 ${
              isDarkMode ? "bg-slate-950/60 border-slate-850" : "bg-slate-50 border-slate-200"
            }`}>
              {activeVariables ? (
                <div>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400 block mb-1">
                    {activeVariables === "u_ij" && "u(i, j) - Potencia de Señal"}
                    {activeVariables === "neighbors" && "Vecinos en Cruz"}
                    {activeVariables === "lambda" && "Coeficiente Lambda (λ)"}
                    {activeVariables === "omega" && "Factor de Relajación Omega (ω)"}
                  </span>
                  <span className="text-slate-600 dark:text-slate-300">{variablesExplanation[activeVariables as keyof typeof variablesExplanation]}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-slate-400 italic">
                  <HelpCircle className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Selecciona un parámetro arriba para ver la documentación explicativa en tiempo real.</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick guide list */}
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Instrucciones de Uso Rápido:</span>
            <ul className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
              <li className="flex items-start gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span>Haz clic en <strong>Router WiFi</strong> y colócalo en medio de la malla.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span>Pinta paredes (Concreto, Yeso, Ladrillo, Metal) para simular atenuación.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span>Usa <strong>SOR</strong> con &omega; = 1.35 para ver lo rápido que converge.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

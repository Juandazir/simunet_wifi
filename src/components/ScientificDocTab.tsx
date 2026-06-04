import React, { useState } from "react";
import { 
  BookOpen, HelpCircle, GraduationCap, ChevronRight, Sparkles, Check, 
  Cpu, Layers, HelpCircle as HelpIcon, TrendingDown, Info, Zap, 
  Settings, Award, MessageSquare, Compass, Radio, Printer, FileText
} from "lucide-react";

interface ScientificDocTabProps {
  isDarkMode: boolean;
}

export default function ScientificDocTab({ isDarkMode }: ScientificDocTabProps) {
  const [activeStep, setActiveStep] = useState<number>(1);
  const [interactiveU, setInteractiveU] = useState({
    top: 80,
    bottom: 30,
    left: 70,
    right: 40,
    lambda: 0.1, // 10% loss
    omega: 1.3
  });

  // Calculate the local cell average
  const sumNeighbors = interactiveU.top + interactiveU.bottom + interactiveU.left + interactiveU.right;
  const gsEstimate = sumNeighbors / 4;
  const directCellVal = (1 - interactiveU.lambda) * gsEstimate;
  
  // Apply SOR correction: u^(k+1) = (1 - w)*u^(k) + w * u_GS
  // Let's assume previous value u^(k) is a typical middle value e.g. 50
  const prevVal = 50;
  const sorVal = (1 - interactiveU.omega) * prevVal + interactiveU.omega * directCellVal;

  const cardBg = isDarkMode 
    ? "bg-slate-900 border-slate-800 text-slate-100" 
    : "bg-white border-slate-200 text-slate-800 shadow-sm";

  const mathBoxBg = isDarkMode
    ? "bg-slate-950 border-slate-850/80"
    : "bg-slate-50 border-slate-150 shadow-inner";

  const textMuted = isDarkMode ? "text-slate-400" : "text-slate-600";
  const selectBorder = isDarkMode ? "border-slate-800" : "border-slate-200";

  return (
    <div className="space-y-6">
      
      {/* Title Hero */}
      <div className="p-6 rounded-3xl border transition-all duration-300 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 relative overflow-hidden print:hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white">
              <BookOpen className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold tracking-tight">Manual de Ingeniería y Métodos Científicos</h2>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                Fundamentos matemáticos para el estudio del método de diferencias finitas en la calibración de redes Wi-Fi.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 hover:scale-[1.02] active:scale-[0.98] text-white font-extrabold px-4 py-2 rounded-2xl text-xs transition duration-200 shadow-md shadow-emerald-600/10 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Imprimir Reporte Técnico (PDF)
            </button>
            <div className="flex items-center gap-1.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 font-bold px-3 py-1.5 rounded-2xl text-xs">
              <GraduationCap className="w-4 h-4" />
              U Pamplona Ciencias Exactas
            </div>
          </div>
        </div>
      </div>

      {/* Main Structural Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 print:hidden">
        
        {/* Left Side: Dynamic Interactive Math proof workflow */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className={`p-6 rounded-3xl border h-full flex flex-col justify-between ${cardBg}`}>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-500 mb-3 flex items-center gap-2">
                <Compass className="w-4 h-4 shrink-0" />
                Guía de Procesos Numéricos
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed mb-4">
                Haz clic en cada sección del proceso para estudiar paso a paso cómo formulamos el potencial electromagnético estacionario.
              </p>

              <div className="space-y-2">
                {[
                  { id: 1, label: "1. Modelo Físico Espacial", desc: "Planteamiento continuo y ley electrostática simplificada del Wi-Fi." },
                  { id: 2, label: "2. Discretización de Taylor", desc: "Transformación de derivadas continuas en diferencias finitas." },
                  { id: 3, label: "3. Formulación de los Algoritmos", desc: "Diferencias clave entre Jacobi, Gauss-Seidel y SOR." },
                  { id: 4, label: "4. Propagación y Paredes", desc: "Impacto electromagnético y tasa de atenuación en decibelios." }
                ].map((step) => (
                  <button
                    key={step.id}
                    onClick={() => setActiveStep(step.id)}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer flex gap-3 ${
                      activeStep === step.id
                        ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/10 font-bold"
                        : isDarkMode
                          ? "bg-slate-950/60 border-slate-850 text-slate-300 hover:bg-slate-900"
                          : "bg-slate-50 border-slate-150 text-slate-700 hover:bg-slate-100/80"
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-lg flex items-center justify-center font-mono text-[10px] font-bold ${
                      activeStep === step.id
                        ? "bg-white/20 text-white"
                        : "bg-indigo-500/10 text-indigo-500"
                    }`}>
                      {step.id}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-semibold leading-none">{step.label}</span>
                      <span className={`text-[10px] text-ellipsis truncate mt-1 ${
                        activeStep === step.id ? "text-indigo-200" : "text-slate-450 dark:text-slate-500"
                      }`}>{step.desc}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className={`mt-6 pt-4 border-t ${isDarkMode ? "border-slate-850" : "border-slate-150"}`}>
              <div className="flex gap-2 items-center text-[11px] text-amber-500 bg-amber-500/10 border border-amber-500/15 p-3.5 rounded-2xl">
                <Info className="w-4 h-4 shrink-0" />
                <span>
                  Tip docente (Física): La constante electromagnética de atenuación disminuye con el inverso de la raíz cuadrada de la permeabilidad del vacío.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Step-by-Step interactive proof content of selected process step */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className={`p-6 rounded-3xl border ${cardBg}`}>
            
            {activeStep === 1 && (
              <div className="space-y-4">
                <h3 className="text-base font-extrabold flex items-center gap-2">
                  <Radio className="w-5 h-5 text-indigo-500" />
                  Paso 1: Planteamiento de la Ecuación Rectora (Física de Campos)
                </h3>
                <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  En el estudio de las telecomunicaciones terrestres, modelar la intensidad de una señal electromagnética en ambientes interiores se simplifica suponiendo un <strong>régimen estacionario u estable</strong>, libre de cargas dinámicas excepto las fuentes transmisoras estáticas (los routers).
                </p>
                <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  Esto se rige de manera simplista mediante las Leyes de Maxwell integradoras, representadas bidimensionalmente por la célebre <strong>Ecuación Elíptica de Laplace</strong>:
                </p>

                {/* Formula Highlight */}
                <div className={`p-5 rounded-2xl flex flex-col items-center justify-center gap-2 font-mono text-center ${mathBoxBg}`}>
                  <div className="text-indigo-600 dark:text-indigo-400 text-lg font-black tracking-widest">
                    &nabla;²u = 0  &rArr;  &part;²u/&part;x² + &part;²u/&part;y² = 0
                  </div>
                  <div className="text-[10px] text-slate-400 max-w-md">
                    Donde <strong>u(x, y)</strong> representa la densidad potencial porcentual del campo receptor de Wi-Fi en un punto espacial bidimensional.
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Condiciones de Frontera Dirichlet:
                  </h4>
                  <ul className="text-xs text-slate-500 dark:text-slate-400 list-disc pl-5 space-y-1">
                    <li><strong>Muros Perimetrales (Frontera Estática)</strong>: Fijadas permanentemente al refrigerador de potencial (0%) para denotar campo absorbido por el suelo o espacio lejano.</li>
                    <li><strong>Enrutador (Frontera Activa Inyectada)</strong>: Punto de potencial máximo inicial inyectado u = 100%.</li>
                    <li><strong>Obstáculos Interiores</strong>: Coeficientes de resistencia intermedia que absorben una fracción local del potencial total de los vecinos según su densidad material molecular.</li>
                  </ul>
                </div>
              </div>
            )}

            {activeStep === 2 && (
              <div className="space-y-4">
                <h3 className="text-base font-extrabold flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-indigo-500" />
                  Paso 2: Discretización Espacial mediante Diferencias Finitas (Taylor)
                </h3>
                <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  La computadora no puede resolver derivadas continuas infinitesimales de forma analítica directa en geometrías complejas con paredes. Por esto, construimos una <strong>malla matricial regular</strong> con celdas discretas de dimensiones constantes <span className="font-mono">h</span> y aplicamos la aproximación en serie de Taylor de segundo orden:
                </p>
                <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  Sustituyendo los límites infinitesimales, la derivada doble parcial en <strong>x</strong> e <strong>y</strong> para un nodo central <span className="font-mono">u_(i,j)</span> se discretiza como la aproximación central estándar:
                </p>

                <div className={`p-5 rounded-2xl flex flex-col items-center justify-center gap-2 font-mono text-center ${mathBoxBg}`}>
                  <div className="text-indigo-600 dark:text-indigo-400 text-xs font-bold leading-relaxed">
                    [ u<sub>i+1,j</sub> - 2u<sub>i,j</sub> + u<sub>i-1,j</sub> ] / h² + [ u<sub>i,j+1</sub> - 2u<sub>i,j</sub> + u<sub>i,j-1</sub> ] / h² = 0
                  </div>
                  <div className="text-[11px] text-amber-600 dark:text-amber-400 mt-2 font-bold font-sans">
                    ¡Haciendo espacio numérico homogéneo h_x = h_y = h, el divisor h² se simplifica y agrupamos términos!
                  </div>
                  <div className="text-emerald-500 dark:text-emerald-400 font-bold text-xs mt-1">
                    u<sub>i,j</sub> = [ u<sub>i+1,j</sub> + u<sub>i-1,j</sub> + u<sub>i,j+1</sub> + u<sub>i,j-1</sub> ] / 4
                  </div>
                </div>

                <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  Físicamente, cada celda de aire es el promedio matemático exacto de sus cuatro vecinos adyacentes inmediatos (norte, sur, este y oeste). Esto es el principio del promedio armónico de Laplace.
                </p>
              </div>
            )}

            {activeStep === 3 && (
              <div className="space-y-4">
                <h3 className="text-base font-extrabold flex items-center gap-2">
                  <Zap className="w-5 h-5 text-indigo-500" />
                  Paso 3: Matriz de Resolución y Comparativa de los Cuatro Métodos Numéricos
                </h3>
                <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  Para hallar la solución de un mapa completo, debemos iterar este cálculo en cada celda cientos de veces hasta que el error residuo converja bajo nuestra tolerancia deseada (&epsilon;). Explicamos las variaciones integradas:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={`p-4 rounded-xl border ${mathBoxBg}`}>
                    <span className="font-bold text-xs text-indigo-500 block mb-1">Método de Jacobi</span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      Usa únicamente valores de la iteración previa <span className="font-mono">k</span> para computar la iteración <span className="font-mono">k+1</span>. Requiere mantener dos matrices completas espejo en memoria. Es extremadamente lento para mallas grandes.
                    </p>
                  </div>

                  <div className={`p-4 rounded-xl border ${mathBoxBg}`}>
                    <span className="font-bold text-xs text-indigo-500 block mb-1">Método de Gauss-Seidel</span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      Mucho más eficiente. Actualiza las celdas en el mismo lugar físico de memoria de inmediato. Usa la estimación más actualizada: por ejemplo, al calcular la fila superior, inmediatamente se usan los valores ya calculados para los vecinos izquierdos. ¡Modera el número de iteraciones requeridas casi a la mitad!
                    </p>
                  </div>

                  <div className={`p-4 rounded-xl border ${mathBoxBg}`}>
                    <span className="font-bold text-xs text-indigo-500 block mb-1">Sobre-Relajación Sucesiva (SOR)</span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      Introduce un factor multiplicador de corrección <span className="font-mono">&omega;</span> entre 0.1 y 1.9. Al evaluar la diferencia con el promedio Gauss-Seidel, realiza una extrapolación acelerada para empujar la convergencia anticipadamente. <span className="font-mono font-bold">&omega; optimal &gt; 1</span> reduce los pases en un 80% o más.
                    </p>
                  </div>

                  <div className={`p-4 rounded-xl border ${mathBoxBg}`}>
                    <span className="font-bold text-xs text-indigo-500 block mb-1">Sucesión Simétrica de Relajación (SSOR)</span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      Consiste en un paso SOR convencional seguido inmediatamente de un paso inverso en reversa (de abajo hacia arriba, derecha a izquierda). Mantiene simétrica la matriz de coeficientes asociada, permitiendo combinarse eficientemente con métodos de gradiente conjugado acelerado.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeStep === 4 && (
              <div className="space-y-4">
                <h3 className="text-base font-extrabold flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-500" />
                  Paso 4: Coeficiente de Absorción del Medio (Pérdidas de Materiales)
                </h3>
                <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  Cuando la onda inalámbrica choca contra barreras del mundo real (drywalls, bloques de concreto, ladrillo húmedo o metales macizos), su energía electromagnética se absorbe y refracta. En el simulador, esto se encapsula mediante un coeficiente de absorción adimensional local <span className="font-mono font-bold">&lambda; &in; [0, 1]</span>:
                </p>

                {/* Materials losses metrics detail */}
                <div className="overflow-hidden border rounded-2xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-950 font-bold border-b border-slate-100 dark:border-slate-800">
                      <tr>
                        <th className="p-3">Material</th>
                        <th className="p-3">Absorción Multiplicadora (&lambda;)</th>
                        <th className="p-3">Pérdida en Decibeles (dB)</th>
                        <th className="p-3">Efecto Práctico</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-[11px]">
                      <tr>
                        <td className="p-3 font-semibold text-emerald-600 dark:text-emerald-400">Aire/Vacío</td>
                        <td className="p-3 font-mono">0.00</td>
                        <td className="p-3 font-mono">0 dB</td>
                        <td className="p-3">Propagación ideal sin obstrucciones.</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold text-cyan-500">Yeso (Drywall)</td>
                        <td className="p-3 font-mono">0.10</td>
                        <td className="p-3 font-mono">-2.5 dB</td>
                        <td className="p-3">Atenuación menor. Madera o cielorrasos estándar.</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold text-amber-500">Ladrillo Común</td>
                        <td className="p-3 font-mono">0.35</td>
                        <td className="p-3 font-mono">-5.0 dB</td>
                        <td className="p-3">Atenuación media. Bloques divisorios internos.</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold text-slate-400">Concreto Macizo</td>
                        <td className="p-3 font-mono">0.65</td>
                        <td className="p-3 font-mono">-12.0 dB</td>
                        <td className="p-3">Atenuación severa. Columnas de carga estructural.</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold text-rose-500">Metal Ciego (Blindaje)</td>
                        <td className="p-3 font-mono">0.95</td>
                        <td className="p-3 font-mono">-35.0 dB</td>
                        <td className="p-3">Reflexión total. Actúa como jaula de Faraday, bloquea señal.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  La atenuación total disminuye de manera logarítmica respecto a las distancias euclidianas directas multiplicadas por el exponencial de los coeficientes de amortiguamiento material cruzados en la trayectoria del rayo simulador.
                </p>
              </div>
            )}

          </div>

          {/* Interactive Live Math Calibrator Playground */}
          <div className={`p-6 rounded-3xl border ${cardBg}`}>
            <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-500 mb-3 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-indigo-500 animate-bounce-slow" />
              Calculadora Didáctica Interactiva
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed mb-4">
              Modifica los valores vecinos del stencil local a continuación. Comprueba cómo afectan físicamente de inmediato la aproximación de Gauss-Seidel y las correcciones extrapoladas de los factores de relajación &omega; de la Universidad de Pamplona.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              
              {/* Inputs sliders bento frame */}
              <div className="space-y-3.5">
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="font-bold flex items-center gap-1 text-slate-400"><span className="w-2 h-2 rounded bg-red-400" />Vecino Superior:</span>
                    <span className="font-mono text-indigo-500 font-extrabold">{interactiveU.top}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={interactiveU.top}
                    onChange={(e) => setInteractiveU(prev => ({...prev, top: parseInt(e.target.value)}))}
                    className="w-full accent-indigo-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="font-bold flex items-center gap-1 text-slate-400"><span className="w-2 h-2 rounded bg-yellow-400" />Vecino Derecho:</span>
                    <span className="font-mono text-indigo-500 font-extrabold">{interactiveU.right}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={interactiveU.right}
                    onChange={(e) => setInteractiveU(prev => ({...prev, right: parseInt(e.target.value)}))}
                    className="w-full accent-indigo-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="font-bold flex items-center gap-1 text-slate-400"><span className="w-2 h-2 rounded bg-blue-400" />Vecino Izquierdo:</span>
                    <span className="font-mono text-indigo-500 font-extrabold">{interactiveU.left}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={interactiveU.left}
                    onChange={(e) => setInteractiveU(prev => ({...prev, left: parseInt(e.target.value)}))}
                    className="w-full accent-indigo-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="font-bold flex items-center gap-1 text-slate-400"><span className="w-2 h-2 rounded bg-green-400" />Vecino Inferior:</span>
                    <span className="font-mono text-indigo-500 font-extrabold">{interactiveU.bottom}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={interactiveU.bottom}
                    onChange={(e) => setInteractiveU(prev => ({...prev, bottom: parseInt(e.target.value)}))}
                    className="w-full accent-indigo-500"
                  />
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-850 grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Atenuación Material (&lambda;)</label>
                    <input
                      type="range"
                      min="0.0"
                      max="0.95"
                      step="0.05"
                      value={interactiveU.lambda}
                      onChange={(e) => setInteractiveU(prev => ({...prev, lambda: parseFloat(e.target.value)}))}
                      className="w-full accent-emerald-500"
                    />
                    <span className="text-[9px] font-mono text-slate-400 flex justify-between mt-0.5">
                      <span>Aire (0)</span>
                      <span>Metal (0.95)</span>
                    </span>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Relajación (&omega;)</label>
                    <input
                      type="range"
                      min="0.5"
                      max="1.9"
                      step="0.05"
                      value={interactiveU.omega}
                      onChange={(e) => setInteractiveU(prev => ({...prev, omega: parseFloat(e.target.value)}))}
                      className="w-full accent-indigo-500"
                    />
                    <span className="text-[9px] font-mono text-slate-400 flex justify-between mt-0.5">
                      <span>GS (1.0)</span>
                      <span>SOR (1.9)</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Outputs box calculations live */}
              <div className={`p-5 rounded-2xl border flex flex-col gap-4 self-stretch justify-center h-full ${mathBoxBg}`}>
                <div className="text-center pb-2 border-b border-indigo-500/10">
                  <span className="text-[10px] uppercase font-extrabold text-slate-400 block">Efectos en la Celda de Estudio u_(i, j)</span>
                  <span className="text-[9px] text-slate-400 lowercase mt-0.5">Cálculos numéricos inmediatos formulados en tiempo real</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex flex-col text-xs">
                    <span className="font-bold text-slate-400 leading-none">Promedio Armónico Gauss-Seidel</span>
                    <span className="text-[9px] text-slate-400 mt-1">Conducción pura de celdas libres</span>
                  </div>
                  <span className="font-mono text-base font-extrabold text-slate-205 dark:text-slate-100">{gsEstimate.toFixed(2)} %</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex flex-col text-xs">
                    <span className="font-bold text-slate-400 leading-none">Afectado por Ladrillo/Concreto</span>
                    <span className="text-[9px] text-slate-400 mt-0.5">u_GS &times; (1 - &lambda;)</span>
                  </div>
                  <span className="font-mono text-base font-extrabold text-emerald-555 dark:text-emerald-450">{directCellVal.toFixed(2)} %</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/15">
                  <div className="flex flex-col text-xs">
                    <span className="font-bold text-indigo-500 leading-none">Valor Extrapolado SOR del Discretizador</span>
                    <span className="text-[9px] text-indigo-400 mt-0.5">Fórmula acelerada de aproximación</span>
                  </div>
                  <span className="font-mono text-[17px] font-black text-indigo-500">{sorVal.toFixed(2)} %</span>
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>

      {/* =========================================================================
          EXCLUSIVE ACADEMIC PDF REPORT LAYOUT (VISIBLE ONLY ON PRINT / PDF EXPORT)
          ========================================================================= */}
      <div className="hidden print:block text-black bg-white p-6 max-w-4xl mx-auto space-y-8 font-serif leading-relaxed text-sm">
        
        {/* Institutional Header & Coat of Arms */}
        <div className="text-center space-y-2 border-b-2 border-double border-slate-800 pb-6">
          <h1 className="text-lg font-bold tracking-widest uppercase">Universidad de Pamplona</h1>
          <h2 className="text-sm font-semibold tracking-wider uppercase">Facultad de Ciencias Básicas - Departamento de Física y Geología</h2>
          <h3 className="text-xs font-medium tracking-wide uppercase text-slate-600">Áreas de Redes de Telecomunicaciones e Ingeniería Computacional</h3>
          <div className="text-[10px] text-slate-500 font-mono mt-2">
            SimuNet WiFi v2.5 • Sistema de Simulación Numérica sobre Ecuaciones de Laplace Estacionarias
          </div>
        </div>

        {/* Document Title */}
        <div className="text-center my-6 space-y-1">
          <h2 className="text-xl font-extrabold tracking-tight underline">REPORTE TÉCNICO COMPLETO</h2>
          <p className="text-xs italic text-slate-700">
            "Modelamiento Electromagnético Bidimensional y Resolución de Sistemas Lineales Simultáneos por Múltiples Solucionadores de Diferencias Finitas"
          </p>
        </div>

        {/* Metadata Details Grid */}
        <div className="grid grid-cols-2 gap-4 border p-4 rounded-xl bg-slate-50 font-sans text-xs">
          <div>
            <p><strong>Entorno de Simulación:</strong> SimuNet Laplace 2D</p>
            <p><strong>Institución:</strong> Universidad de Pamplona (Pamplona, Colombia)</p>
            <p><strong>Fecha de Generación:</strong> {new Date().toLocaleDateString()}</p>
          </div>
          <div>
            <p><strong>Unidad de Evaluación:</strong> Laboratorio de Electrodinámica Teórica</p>
            <p><strong>Autor del Análisis:</strong> Estudiante/Investigador Registrado</p>
            <p><strong>Configuración de Malla de Análisis:</strong> 24 &times; 24 Nodales Homogéneos</p>
          </div>
        </div>

        {/* Section 1: Objective */}
        <div className="space-y-2">
          <h3 className="text-base font-bold uppercase tracking-wide border-b border-black pb-1">1. Objetivo General de la Plataforma</h3>
          <p className="text-xs leading-relaxed text-justify">
            La plataforma <strong>SimuNet WiFi</strong> tiene como objeto permitir el modelado didáctico y el análisis computacional de la propagación de ondas de radiofrecuencia (Wi-Fi en bandas de 2.4 GHz y 5 GHz) en interiores complejos. Utilizando el enfoque de la <strong>física-computacional clásica</strong>, el simulador reemplaza los modelos de propagación semihomogéneos empíricos (como Motley-Keenan) por un solucionador de ecuaciones diferenciales elípticas en derivadas parciales en dos dimensiones, aproximando el campo elástico de la propagación electromagnética.
          </p>
        </div>

        {/* Section 2: Mathematical and Physical Modeling */}
        <div className="space-y-2 page-break-before">
          <h3 className="text-base font-bold uppercase tracking-wide border-b border-black pb-1">2. Fundamento Físico Electromagnético</h3>
          <p className="text-xs leading-relaxed text-justify">
            En un espacio libre de corrientes y de densidades de carga eléctrica libres dependientes del tiempo, las ecuaciones de Maxwell para la intensidad del campo reducen el potencial a una contribución electrostática estacionaria libre. Representando la densidad espectral de potencia total de la señal receptora local como la magnitud escalar <em>u(x, y)</em> (comprendido entre 0% y 100%), se modela de manera simplificada mediante la <strong>Ecuación de Laplace Bidimensional</strong>:
          </p>
          <div className="bg-slate-50 p-4 text-center rounded-xl font-mono text-xs font-bold border my-2">
            &part;²u(x, y)/&part;x² + &part;²u(x, y)/&part;y² = 0 &rArr; &nabla;²u = 0
          </div>
          <p className="text-xs leading-relaxed text-justify">
            Las pérdidas dieléctricas inducidas por los muros se introducen mediante una aproximación con amortiguador, modificando la ecuación en presencia de barreras mediante coeficientes de absorción de medio.
          </p>
        </div>

        {/* Section 3: Spatial Discretization */}
        <div className="space-y-2">
          <h3 className="text-base font-bold uppercase tracking-wide border-b border-black pb-1">3. Discretización mediante Diferencias Finitas (Series de Taylor)</h3>
          <p className="text-xs leading-relaxed text-justify">
            Al expandir el potencial continuo <em>u(x, y)</em> en series de Taylor en torno al punto discreto <em>(x_i, y_j)</em> del dominio discretizado con paso espacial homogéneo Δx = Δy = h, obtenemos:
          </p>
          <div className="bg-slate-50 p-3 text-center rounded-xl font-mono text-[10px] space-y-1 border my-2">
            <p>u(x+h, y) = u(x,y) + h &part;u/&part;x + (h²/2) &part;²u/&part;x² + (h³/6) &part;³u/&part;x³ + O(h⁴)</p>
            <p>u(x-h, y) = u(x,y) - h &part;u/&part;x + (h²/2) &part;²u/&part;x² - (h³/6) &part;³u/&part;x³ + O(h⁴)</p>
          </div>
          <p className="text-xs leading-relaxed text-justify">
            Sumando ambas expansiones diferenciales, se anulan los términos impares impuestas por simetría de la malla. Despejando la derivada parcial de segundo orden respecto a cada eje y despreciando el residuo de aproximación truncado de cuarto orden, se obtiene la formulación del stencil de 5 puntos:
          </p>
          <div className="bg-slate-50 p-4 text-center rounded-xl font-mono text-xs font-extrabold border my-2 text-indigo-800">
            u<sub>i, j</sub> = [ u<sub>i+1, j</sub> + u<sub>i-1, j</sub> + u<sub>i, j+1</sub> + u<sub>i, j-1</sub> ] / 4
          </div>
        </div>

        {/* Section 4: Numerical Methods Comparison */}
        <div className="space-y-4 page-break-before">
          <h3 className="text-base font-bold uppercase tracking-wide border-b border-black pb-1">4. Formulación Rigurosa de los Resolutores Matriciales</h3>
          <p className="text-xs leading-relaxed text-justify">
            Para resolver el sistema de 576 ecuaciones lineales simultáneas sobre una malla regular densa de 24&times;24 nodos, SimuNet implementa cuatro solucionadores del estado de arte científico:
          </p>
          
          <div className="space-y-3 pl-2">
            <div>
              <h4 className="text-xs font-extrabold underline">Método de Jacobi:</h4>
              <p className="text-[11px] leading-relaxed text-justify">
                Cada iteración calcula de forma desacoplada la nueva aproximación utilizando únicamente los estados de la iteración inmediatamente previa:
              </p>
              <div className="font-mono text-[10.5px] bg-slate-50 p-2 text-center rounded-lg my-1">
                u<sub>i,j</sub><sup>(k+1)</sup> = [ u<sub>i+1,j</sub><sup>(k)</sup> + u<sub>i-1,j</sub><sup>(k)</sup> + u<sub>i,j+1</sub><sup>(k)</sup> + u<sub>i,j-1</sub><sup>(k)</sup> ] / 4
              </div>
              <p className="text-[10px] text-slate-600">✓ Convergencia garantizada solamente bajo diagonal estricta. Alta demanda en hardware (doble matriz espejo).</p>
            </div>

            <div>
              <h4 className="text-xs font-extrabold underline">Método de Gauss-Seidel:</h4>
              <p className="text-[11px] leading-relaxed text-justify">
                Acelera significativamente la convergencia reemplazando inmediatamente en sitio (in-place) cada valor calculado en la misma memoria física, usando los nodos ya actualizados de la misma iteración k+1:
              </p>
              <div className="font-mono text-[10.5px] bg-slate-50 p-2 text-center rounded-lg my-1">
                u<sub>i,j</sub><sup>(k+1)</sup> = [ u<sub>i+1,j</sub><sup>(k)</sup> + u<sub>i-1,j</sub><sup>(k+1)</sup> + u<sub>i,j+1</sub><sup>(k)</sup> + u<sub>i,j-1</sub><sup>(k+1)</sup> ] / 4
              </div>
              <p className="text-[10px] text-slate-600 font-medium">✓ Requiere típicamente la mitad de pases iterativos respecto a Jacobi. Altamente optimizado para paralelización secuencial.</p>
            </div>

            <div>
              <h4 className="text-xs font-extrabold underline">Sobre-Relajación Sucesiva (SOR):</h4>
              <p className="text-[11px] leading-relaxed text-justify">
                Es una extrapolación que corrige la estimación de Gauss-Seidel mediante un factor multiplicativo espectral ajustable &omega;. Si &omega; &gt; 1, se sobre-relaja empujando el campo hacia la dirección esperada de convergencia:
              </p>
              <div className="font-mono text-[10.5px] bg-slate-50 p-2 text-center rounded-lg my-1">
                u<sub>i,j</sub><sup>(k+1)</sup> = (1 - &omega;)u<sub>i,j</sub><sup>(k)</sup> + &omega; &times; u<sub>GS</sub><sup>(k+1)</sup>
              </div>
              <p className="text-[10px] text-slate-600">✓ Con un factor óptimo aproximado (&omega; &asymp; 1.3 - 1.5 en nuestra malla 24&times;24), se reduce el número de cálculos de convergencia en un 80% o más.</p>
            </div>

            <div>
              <h4 className="text-xs font-extrabold underline">Sucesión Simétrica de Relajación (SSOR):</h4>
              <p className="text-[11px] leading-relaxed text-justify">
                Combina un paso del algoritmo SOR convencional barriendo la malla de forma progresiva (izquierda a derecha, arriba a abajo), con un segundo paso SOR en reversa (derecha a izquierda, abajo a arriba):
              </p>
              <div className="font-mono text-[10.5px] bg-slate-50 p-2 text-center rounded-lg my-1">
                Paso F (Forward): conv. SOR • Paso B (Backward): conv. SOR inversa
              </div>
              <p className="text-[10px] text-slate-600">✓ Estabiliza y simetriza la matriz global de coeficientes asociados, idóneo para solvers híbridos de Krylov y matrices simétricas definidas positivas.</p>
            </div>
          </div>
        </div>

        {/* Section 5: Materials Degradation and Faraday shield */}
        <div className="space-y-2 page-break-before">
          <h3 className="text-base font-bold uppercase tracking-wide border-b border-black pb-1">5. Análisis de Absorción Dieléctrica de Materiales en dB</h3>
          <p className="text-xs leading-relaxed text-justify">
            La inclusión de elementos constructivos (obstáculos) interfiere con la electrodinámica estacionaria de Laplace introduciendo coeficientes locales de atenuación aditivas &lambda; que disminuyen exponencialmente la magnitud transferible entre celdas circundantes.
          </p>
          <div className="my-2 border rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 font-bold border-b text-slate-700">
                <tr>
                  <th className="p-2">Material Estructural</th>
                  <th className="p-2 text-center">Coeficiente &lambda;</th>
                  <th className="p-2 text-center">Decibelios (dB / celda)</th>
                  <th className="p-2">Comportamiento Electromagnético Evaluado</th>
                </tr>
              </thead>
              <tbody className="divide-y text-[11px]">
                <tr>
                  <td className="p-2 font-semibold">Aire Libre (Vacío)</td>
                  <td className="p-2 text-center">0.00</td>
                  <td className="p-2 text-center">0.0 dB</td>
                  <td className="p-2">Permitividad ideal relativa &epsilon;_r = 1.0</td>
                </tr>
                <tr>
                  <td className="p-2 font-semibold">Yeso (Tabiqueria Liviana)</td>
                  <td className="p-2 text-center">0.10</td>
                  <td className="p-2 text-center">-2.5 dB</td>
                  <td className="p-2">Pérdidas dieléctricas marginales. Dispersión leve.</td>
                </tr>
                <tr>
                  <td className="p-2 font-semibold">Ladrillo Común o Arcilla</td>
                  <td className="p-2 text-center">0.35</td>
                  <td className="p-2 text-center">-5.0 dB</td>
                  <td className="p-2">Atenuación severa. Retracción media de las ondas receptoras.</td>
                </tr>
                <tr>
                  <td className="p-2 font-semibold">Concreto Reforzado</td>
                  <td className="p-2 text-center">0.65</td>
                  <td className="p-2 text-center">-12.0 dB</td>
                  <td className="p-2">Alta densidad molecular. Absorbcion térmica de energía radial.</td>
                </tr>
                <tr>
                  <td className="p-2 font-semibold">Blindaje Metálico (Faraday)</td>
                  <td className="p-2 text-center font-bold text-red-650">0.95</td>
                  <td className="p-2 text-center font-bold text-red-650">-35.0 dB</td>
                  <td className="p-2">Reflexiones masivas. Jaula de Faraday impenetrable para WiFi.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 6: Educational Conclusion and Signatures */}
        <div className="space-y-4 pt-4 border-t">
          <p className="text-xs leading-relaxed text-justify">
            <strong>Conclusiones Pedagógicas:</strong> El simulador didáctico de la Universidad de Pamplona valida experimentalmente que la formulación numérica de diferencias finitas en Laplace aproxima de manera robusta y en tiempo real el comportamiento espacial del campo de dispersión de ondas inalámbricas, constituyendo una herramienta didáctica poderosa en asignaturas como Redes de Computadores, Electromagnetismo Computacional, y Métodos Numéricos Avanzados.
          </p>
          
          <div className="grid grid-cols-2 gap-12 text-center text-xs pt-12">
            <div className="space-y-1">
              <div className="border-t border-black w-48 mx-auto mt-4" />
              <p className="font-bold">Firma del Estudiante / Investigador</p>
              <p className="text-[10px] text-slate-500">Documento Autenticado por SimuNet</p>
            </div>
            <div className="space-y-1">
              <div className="border-t border-black w-48 mx-auto mt-4" />
              <p className="font-bold">Jurado / Evaluador del Laboratorio</p>
              <p className="text-[10px] text-slate-500">Departamento de Física y Geología</p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}

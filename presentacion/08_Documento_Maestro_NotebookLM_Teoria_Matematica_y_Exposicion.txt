# DOCUMENTO MAESTRO DE ESTUDIO PROFUNDO, TEORÍA FÍSICA, DEMOSTRACIÓN DE FÓRMULAS Y EXPOSICIÓN ORAL (ESPECIAL PARA GOOGLE NOTEBOOKLM)

**Título Oficial del Proyecto:**  
*Modelado computacional de la propagación e intensidad de campo electromagnético UHF/SHF en recintos con materiales dieléctricos*

**Autores y Filiación Institucional:**  
1. **Juan David Conde Duarte** — Programa de Ingeniería de Sistemas, Facultad de Ingenierías y Arquitectura, Universidad de Pamplona, Pamplona, Colombia (`juan.conde2@unipamplona.edu.co`).  
2. **Gladys Liliana Bautista Wilches** — Programa de Física, Departamento de Física, Facultad de Ciencias Básicas, Universidad de Pamplona, Pamplona, Colombia (`gladys.bautista@unipamplona.edu.co`).

**Evento Académico:** Feria de la Física 2026 — Departamento de Física, Universidad de Pamplona.  
**Modalidad:** Computacional.  
**Software Desarrollado:** *SimuNet Física* (Simulador bidimensional interactivo en Diferencias Finitas y Sobre-Relajación Sucesiva SOR).

---

## NOTA DE INSTRUCCIÓN PARA GENERACIÓN DE AUDIO EN GOOGLE NOTEBOOKLM

> **Contexto para el Resumen de Audio (Audio Overview / Deep Dive):**  
> Este documento contiene toda la fundamentación teórica, física, matemática, numérica y experimental del proyecto de investigación presentado por **Juan David Conde Duarte** y **Gladys Liliana Bautista Wilches** en la Feria de la Física 2026 de la Universidad de Pamplona.  
> Al generar el resumen de audio, por favor desarrollen una explicación extensa, pedagógica, rigurosa y dinámica que recorra:
> 1. La física electromagnética detrás de las ondas de microondas en las bandas UHF (2.4 gigahercios) y SHF (5.0 gigahercios).
> 2. El significado físico y matemático de cada una de las ecuaciones del póster (Vector de Poynting, Campo Eléctrico Eficaz, Impedancia del vacío, Ley de Beer-Lambert, Ecuación Diferencial Parcial Elíptica de Difusión-Absorción, Esténcil de 5 puntos en Diferencias Finitas y algoritmo SOR).
> 3. El papel de las propiedades constitutivas de los materiales constructivos (permitividad relativa y conductividad eléctrica en aire, yeso, ladrillo, concreto y metal) según el estándar internacional ITU-R P.2040, incluyendo qué es el Coeficiente Base de atenuación y por qué ocurre el efecto de Jaula de Faraday con su espesor pelicular (*skin depth*).
> 4. La comparación numérica entre los métodos iterativos de Jacobi, Gauss-Seidel y Sobre-Relajación Sucesiva (SOR con factor óptimo omega igual a 1.45), y la validación frente al modelo analítico internacional ITU-R P.1238.
> 5. Consejos prácticos de exposición y posibles preguntas de los jurados evaluadores.

---

## MÓDULO 1: PLANTEAMIENTO DEL PROBLEMA, MOTIVACIÓN Y OBJETIVOS DEL PROYECTO

### 1.1 ¿Cuál es el problema físico real que resolvemos?
En la vida cotidiana y en la ingeniería moderna, estamos rodeados de ondas electromagnéticas de alta frecuencia —específicamente en el rango de las microondas— emitidas por antenas de telecomunicaciones y puntos de acceso inalámbricos (routers Wi-Fi) que operan en dos bandas principales:
- **Banda UHF (*Ultra High Frequency* / Frecuencia Ultra Alta):** centrada en **$2.4\text{ GHz}$** ($2.4 \times 10^9\text{ Hz}$), cuya longitud de onda en el aire es de **$12.5\text{ cm}$**.
- **Banda SHF (*Super High Frequency* / Frecuencia Súper Alta):** centrada en **$5.0\text{ GHz}$** ($5.0 \times 10^9\text{ Hz}$), cuya longitud de onda en el aire es de **$6.0\text{ cm}$**.

Cuando una antena emite estas ondas en el espacio libre (sin obstáculos), la energía viaja libremente y sólo disminuye porque el frente de onda se expande geométricamente como una esfera o un cilindro a medida que nos alejamos de la fuente. En ese caso ideal y homogéneo, bastaría usar una fórmula analítica sencilla (como la ecuación de transmisión de Friis) para saber cuánta potencia llega a cualquier punto.

Sin embargo, **dentro de una edificación real** (un laboratorio, una casa, una oficina o un salón de clases de la Universidad de Pamplona), el medio **no es homogéneo**. Existen paredes de yeso (*drywall*), muros de ladrillo, columnas gruesas de concreto reforzado (hormigón) y estructuras o recubrimientos metálicos. Cuando la onda electromagnética choca contra estos materiales y los atraviesa, ocurren fenómenos físicos complejos gobernados por las **Ecuaciones de Maxwell en medios materiales**:
1. **Desfase y refracción por polarización dieléctrica:** Caracterizada por la **permitividad eléctrica relativa ($\varepsilon_r$)** del material. Las moléculas polares del muro (como las trazas de agua y silicatos en el concreto o el ladrillo) intentan alinearse miles de millones de veces por segundo con el campo eléctrico oscilante de la onda.
2. **Disipación óhmica (Efecto Joule microscópico):** Caracterizada por la **conductividad eléctrica efectiva ($\sigma$)** medida en siemens por metro ($\text{S/m}$). El campo eléctrico induce microcorrientes de conducción ($\mathbf{J} = \sigma \mathbf{E}$) dentro del muro, transformando parte de la energía electromagnética de la onda en calor y restándole potencia a la señal que logra pasar al otro lado.
3. **Apantallamiento por reflexión en conductores (Jaula de Faraday):** Si el obstáculo es un metal con una conductividad altísima ($\sigma \approx 3.5 \times 10^7\text{ S/m}$), los electrones libres en la superficie del metal se reorganizan casi instantáneamente cancelando el campo eléctrico en el interior y reflejando la onda, de modo que la señal no puede penetrar más allá de una capa microscópica llamada **profundidad pelicular (*skin depth*)**.

Como las fórmulas analíticas simples de espacio libre no pueden resolver la interacción acoplada de múltiples muros en dos dimensiones con diferentes geometrías, **se requiere el modelado computacional mediante métodos numéricos** (específicamente el Método de Diferencias Finitas Centradas resuelto mediante Sobre-Relajación Sucesiva, SOR).

### 1.2 Objetivos del Trabajo
- **Objetivo General:**  
  Modelar y validar numéricamente la distribución espacial de potencia recibida ($P_{\text{rx}}$), la magnitud media del vector de Poynting ($\langle S \rangle$) y la intensidad de campo eléctrico eficaz ($E_{\text{rms}}$) en las bandas de $2.4\text{ GHz}$ y $5.0\text{ GHz}$ dentro de recintos bidimensionales con materiales dieléctricos y conductores mediante el método de diferencias finitas y relajación SOR.
- **Objetivos Específicos:**
  1. **Discretizar el dominio espacial 2D** ($12\text{ m} \times 12\text{ m}$ en mallas de $24 \times 24$ nodos) aplicando el esquema de diferencias finitas centradas de 5 puntos y resolver el sistema algebraico comparando los métodos iterativos de Jacobi, Gauss-Seidel y Sobre-Relajación Sucesiva (SOR).
  2. **Cuantificar la absorción dieléctrica local** en función de la frecuencia ($2.4\text{ GHz}$ vs. $5.0\text{ GHz}$), la permitividad relativa ($\varepsilon_r$) y la conductividad ($\sigma$) de cinco medios (aire, yeso, ladrillo, concreto y metal) siguiendo la recomendación internacional **ITU-R P.2040**.
  3. **Modelar el blindaje electromagnético de Jaula de Faraday** y validar la precisión física del perfil radial numérico frente al modelo analítico internacional **ITU-R P.1238**, midiendo el error cuadrático medio ($\text{RMSE}$) y el coeficiente de determinación ($R^2$).

---

## MÓDULO 2: DICCIONARIO COMPLETO DE VARIABLES, SÍMBOLOS Y CONSTANTES FÍSICAS

Para comprender cada ecuación del póster y exponer con absoluta seguridad ante cualquier jurado, a continuación se define **cada letra, símbolo matemático y constante física** empleada en el proyecto:

### 2.1 Variables Electromagnéticas y Ondulatorias
1. **$f$ (Frecuencia):** Número de oscilaciones completas del campo electromagnético por segundo. Se mide en hercios ($\text{Hz}$) o gigahercios ($1\text{ GHz} = 10^9\text{ Hz}$). En el proyecto estudiamos $f_1 = 2.4\text{ GHz}$ y $f_2 = 5.0\text{ GHz}$.
2. **$\omega_{\text{ang}} = 2\pi f$ (Frecuencia angular):** Rapidez de cambio de fase en radianes por segundo ($\text{rad/s}$). *(Nota: no confundir con el factor de relajación numérico $\omega$ del método SOR).*
3. **$c$ (Velocidad de la luz en el vacío):** Velocidad a la que se propagan las ondas electromagnéticas en el vacío o en el aire. Su valor es $c = \frac{1}{\sqrt{\mu_0\varepsilon_0}} \approx 2.9979 \times 10^8\text{ m/s}$ (aproximadamente $300,000\text{ km/s}$).
4. **$\lambda$ (Letra griega *lambda* — Longitud de onda):** Distancia física entre dos crestas consecutivas de la onda sinusoidal. Se calcula como $\lambda = \frac{c}{f}$.
   - Para $2.4\text{ GHz}$: $\lambda = 0.125\text{ m} = 12.5\text{ cm}$.
   - Para $5.0\text{ GHz}$: $\lambda = 0.060\text{ m} = 6.0\text{ cm}$.
5. **$\varepsilon_0$ (*Épsilon sub cero* — Permitividad eléctrica del vacío):** Constante física fundamental que mide cómo el vacío permite la formación de campos eléctricos. Vale $\varepsilon_0 \approx 8.854 \times 10^{-12}\text{ F/m}$ (faradios por metro).
6. **$\varepsilon_r$ (*Épsilon sub erre* — Permitividad relativa o constante dieléctrica):** Número adimensional ($\varepsilon_r = \varepsilon / \varepsilon_0$) que indica cuántas veces más se polariza eléctricamente un material en comparación con el vacío. Por ejemplo: en el aire vale $1.0006$, en el yeso $2.8$, en el ladrillo $4.5$ y en el concreto $6.5$.
7. **$\mu_0$ (*Mu sub cero* — Permeabilidad magnética del vacío):** Constante fundamental que relaciona el campo magnético con las corrientes eléctricas en el vacío. Vale $\mu_0 = 4\pi \times 10^{-7}\text{ H/m} \approx 1.2566 \times 10^{-6}\text{ H/m}$ (henrios por metro). En materiales de construcción no ferromagnéticos (yeso, ladrillo, concreto, aluminio/cobre), la permeabilidad relativa es $\mu_r \approx 1$, por lo que $\mu \approx \mu_0$.
8. **$\sigma$ (Letra griega *sigma* — Conductividad eléctrica efectiva):** Capacidad de un material para dejar pasar corriente eléctrica o disipar energía ante un campo eléctrico ($\mathbf{J} = \sigma \mathbf{E}$). Se mide en siemens por metro ($\text{S/m}$). En el aire es $0\text{ S/m}$, en el concreto es $0.085\text{ S/m}$, y en un metal conductor se dispara a $3.5 \times 10^7\text{ S/m}$ ($35$ millones de siemens por metro).
9. **$\eta_0$ (Letra griega *eta sub cero* — Impedancia intrínseca del espacio libre):** Es la resistencia u oposición característica que presenta el vacío o el aire a la propagación de una onda electromagnética, definida como el cociente entre la amplitud del campo eléctrico y la amplitud del campo magnético ($\eta_0 = E / H = \sqrt{\mu_0 / \varepsilon_0}$). Su valor exacto es $\eta_0 \approx 376.73\,\Omega$ (ohmios), que equivale matemáticamente a $120\pi\,\Omega$.
10. **$P_{\text{rx}}$ (Potencia electromagnética recibida):** Cantidad de energía por unidad de tiempo que capta una antena receptora ubicada en un punto del espacio.
    - En telecomunicaciones suele medirse en **$\text{dBm}$** (decibelios referidos a $1$ milivatio), que es una escala logarítmica.
    - En las fórmulas físicas de Maxwell y Poynting debe convertirse siempre a **vatios ($\text{W}$)** o **milivatios ($\text{mW}$)**.
11. **$A_{\text{eff}}$ (Área o apertura efectiva isotrópica):** Área equivalente de captura de energía que tiene una antena ideal isotrópica (que recibe igual en todas las direcciones). Depende del cuadrado de la longitud de onda: $A_{\text{eff}} = \frac{\lambda^2}{4\pi}$, medida en metros cuadrados ($\text{m}^2$).
12. **$\mathbf{S}$ y $\langle S \rangle$ (Vector de Poynting y su magnitud media temporal):**
    - $\mathbf{S} = \mathbf{E} \times \mathbf{H}$ es el vector que apunta en la dirección en que viaja la energía electromagnética y cuya magnitud indica cuánta potencia atraviesa cada metro cuadrado de área.
    - Los corchetes angulares $\langle S \rangle$ significan **"promedio en el tiempo"** (valor medio temporal a lo largo de un ciclo de oscilación). Se mide en vatios por metro cuadrado ($\text{W/m}^2$) o, para señales de radiofrecuencia interiores, en **microvatios por metro cuadrado ($\mu\text{W/m}^2$, donde $1\,\mu\text{W/m}^2 = 10^{-6}\text{ W/m}^2$)**.
13. **$E_{\text{rms}}$ (Campo Eléctrico Eficaz o *Root Mean Square*):** Como el campo eléctrico de una onda alterna entre valores positivos y negativos miles de millones de veces por segundo, su promedio simple sería cero. Por eso usamos el **valor eficaz o cuadrático medio ($E_{\text{rms}} = E_{\text{pico}}/\sqrt{2}$)**, que representa el campo constante equivalente capaz de transportar la misma potencia energética. Se mide en **voltios por metro ($\text{V/m}$)** o milivoltios por metro ($\text{mV/m}$).
14. **$H_{\text{rms}}$ (Campo Magnético Eficaz):** Valor cuadrático medio de la intensidad de campo magnético asociado a la onda. Se relaciona directamente con el campo eléctrico mediante $H_{\text{rms}} = \frac{E_{\text{rms}}}{\eta_0}$ y se mide en **amperios por metro ($\text{A/m}$)** o miliamperios por metro ($\text{mA/m}$).
15. **$\alpha$ (Letra griega *alfa* — Constante de atenuación de Beer-Lambert):** Tasa espacial con la que decae exponencialmente un campo eléctrico al penetrar dentro de un material con pérdidas según $E(x) = E_0 e^{-\alpha x}$. Se mide en nepers por metro ($\text{Np/m}$).
16. **$\delta$ (Letra griega *delta* — Profundidad de penetración pelicular o *Skin Depth*):** Distancia dentro de un conductor metálico en la cual la amplitud del campo electromagnético cae a $1/e$ (aproximadamente el $36.8\%$) de su valor en la superficie. Es el inverso de $\alpha$ ($\delta = 1/\alpha$). En metales a $2.4\text{ GHz}$ vale apenas $\delta \approx 1.3\,\mu\text{m}$ ($1.3$ micrómetros).

### 2.2 Variables Matemáticas y Computacionales (Diferencias Finitas y SOR)
17. **$\Omega$ (*Omega mayúscula*) y $\partial\Omega$:** $\Omega$ representa el recinto interior bidimensional completo que estamos simulando ($12\text{ m} \times 12\text{ m}$), y $\partial\Omega$ (leído *"frontera de Omega"*) representa los bordes o paredes exteriores del mapa.
18. **$u(x,y)$ y $u_{i,j}$ (Potencial escalar normalizado de intensidad energética):** Es la variable matemática principal que resuelve nuestra Ecuación Diferencial Parcial en cada coordenada $(x,y)$ o nodo discreto $(i,j)$ de la malla. Está escalada de $0$ a $100$:
    - $u = 100$ equivale a la potencia máxima en la fuente ($\approx -20\text{ dBm}$).
    - $u = 0$ equivale al piso mínimo de sensibilidad o frontera exterior ($\approx -100\text{ dBm}$).
19. **$\nabla^2 u$ (Operador Laplaciano de $u$, leído *"Nabla cuadrado de u"*):** Es la suma de las segundas derivadas parciales respecto a las coordenadas espaciales: $\nabla^2 u = \frac{\partial^2 u}{\partial x^2} + \frac{\partial^2 u}{\partial y^2}$. Físicamente mide la **concavidad o diferencia entre el valor de un punto y el promedio de sus vecinos inmediatos**, gobernando cómo se difunde espacialmente la energía desde las zonas de alta concentración (la antena) hacia las zonas de baja concentración.
20. **$\kappa(x,y)$ (Letra griega *kappa* — Coeficiente espacial de absorción/disipación):** Término de la ecuación diferencial ($\nabla^2 u - \kappa^2 u = 0$) que cuantifica cuánta energía es absorbida localmente en el punto $(x,y)$ debido a los muros o al aire.
21. **$\alpha_{i,j}$ (`Base Coeff.` / Coeficiente de atenuación nodal):** Es la traducción discreta de $\kappa^2(x,y)$ en cada celda $(i,j)$ de nuestra cuadrícula computacional. Es un número adimensional entre $0$ y $1$ que indica qué fracción de la energía que entra al nodo $(i,j)$ se pierde por absorción dieléctrica en ese paso espacial.
22. **$h$ (Paso espacial de malla, $h = \Delta x = \Delta y$):** Distancia física real entre dos nodos vecinos de la cuadrícula. En nuestra malla estándar de $24 \times 24$ nodos para un recinto de $12\text{ m} \times 12\text{ m}$, cada celda mide $h = \frac{12\text{ m}}{24} = 0.5\text{ m}$ ($50\text{ cm}$).
23. **$i, j$ (Índices espaciales de fila y columna):** Números enteros ($i, j \in \{0, 1, \dots, N-1\}$) que identifican la posición de cada nodo en la matriz bidimensional. Sus cuatro vecinos ortogonales son:
    - Derecha: $(i+1, j)$
    - Izquierda: $(i-1, j)$
    - Arriba: $(i, j+1)$
    - Abajo: $(i, j-1)$
24. **$k$ (Superíndice de iteración):** Escrito entre paréntesis como $u_{i,j}^{(k)}$, indica el número de barrido o ciclo iterativo del algoritmo ($k = 0, 1, 2, \dots$). No es un exponente algebraico, sino el contador de pasos del método numérico.
25. **$\omega$ (Letra griega *omega minúscula* — Factor de relajación SOR):** Número real adimensional que multiplica la corrección de Gauss-Seidel para acelerar la convergencia del sistema de ecuaciones.
    - Si $\omega = 1.00$, el método es exactamente **Gauss-Seidel**.
    - Si $1 < \omega < 2$, se denomina **Sobre-Relajación Sucesiva (SOR)**. En nuestro proyecto, el valor óptimo demostrado experimentalmente es **$\omega_{\text{opt}} = 1.45$**.
26. **$\varepsilon$ (Tolerancia de parada numérica):** Error máximo permitido entre una iteración y la siguiente para declarar que la solución ya convergió al estado estacionario. En el póster y el simulador usamos $\varepsilon = 10^{-4}$ ($0.0001$).

---

## MÓDULO 3: EXPLICACIÓN EXHAUSTIVA DE CADA FÓRMULA DEL PÓSTER Y DEL PROYECTO

A continuación se explican **una por una todas las ecuaciones del póster**, incluyendo cómo se leen en voz alta, de dónde provienen físicamente, cómo se despejan y un ejemplo numérico paso a paso.

---

### FÓRMULA 1 (Ecuación 1 del Póster): Vector de Poynting, Campo Eléctrico Eficaz y Campo Magnético

$$\langle S \rangle = \frac{E_{\text{rms}}^2}{\eta_0} = \frac{4\pi\,P_{\text{rx}}}{\lambda^2} \implies E_{\text{rms}} = \sqrt{\frac{4\pi\,\eta_0\,P_{\text{rx}}}{\lambda^2}}, \qquad H_{\text{rms}} = \frac{E_{\text{rms}}}{\eta_0} \qquad (1)$$

#### 1. ¿Cómo se lee esta ecuación en voz alta?
> *"La magnitud media temporal del vector de Poynting, ese promedio, es igual al campo eléctrico eficaz al cuadrado dividido entre la impedancia intrínseca del vacío eta sub cero; lo cual a su vez es igual a cuatro pi por la potencia recibida P sub erre equis dividida entre la longitud de onda lambda al cuadrado. De esta igualdad se deduce que el campo eléctrico eficaz E sub erre eme ese es igual a la raíz cuadrada de cuatro pi por eta sub cero por la potencia recibida, todo dividido entre lambda al cuadrado; y el campo magnético eficaz H sub erre eme ese es igual al campo eléctrico eficaz dividido entre eta sub cero."*

#### 2. ¿De dónde sale físicamente esta ecuación? (Deducción paso a paso)
Esta es la ecuación más importante para conectar la **ingeniería de telecomunicaciones** (que mide potencia en $\text{dBm}$) con la **física electromagnética pura de Maxwell** (que mide campos en $\text{V/m}$, $\text{A/m}$ y flujo de Poynting en $\text{W/m}^2$):
- **Paso A (Relación entre el Vector de Poynting y el Campo Eléctrico):**  
  Por el Teorema de Poynting, el flujo instantáneo de energía es $\mathbf{S} = \mathbf{E} \times \mathbf{H}$. En una onda electromagnética plana en el aire, el campo magnético es perpendicular al eléctrico y su magnitud cumple $H = \frac{E}{\eta_0}$. Por tanto, la magnitud instantánea es $S(t) = \frac{E^2(t)}{\eta_0}$.  
  Si el campo oscila sinusoidalmente como $E(t) = E_{\text{pico}} \cos(\omega t - kz)$, el promedio de $\cos^2(\omega t - kz)$ en un ciclo completo es exactamente $\frac{1}{2}$. Así:
  $$\langle S \rangle = \frac{E_{\text{pico}}^2}{2\,\eta_0}$$
  Como por definición el valor eficaz (*RMS*) de una onda sinusoidal es $E_{\text{rms}} = \frac{E_{\text{pico}}}{\sqrt{2}}$, al elevarlo al cuadrado tenemos $E_{\text{rms}}^2 = \frac{E_{\text{pico}}^2}{2}$. Sustituyendo esto obtenemos la primera mitad de la Ecuación (1):
  $$\langle S \rangle = \frac{E_{\text{rms}}^2}{\eta_0}$$
- **Paso B (Relación entre la Potencia Recibida $P_{\text{rx}}$ y el Vector de Poynting):**  
  Cuando una antena receptora isotrópica está inmersa en un flujo de energía $\langle S \rangle$ ($\text{W/m}^2$), la potencia total $P_{\text{rx}}$ (en vatios) que logra capturar es igual a la densidad de flujo multiplicada por el **área efectiva de captura ($A_{\text{eff}}$)** de la antena:
  $$P_{\text{rx}} = \langle S \rangle \cdot A_{\text{eff}}$$
  Por la teoría electromagnética de antenas (deducida de la radiación de dipolos y termodinámica de radiación), el área efectiva de un radiador isotrópico a longitud de onda $\lambda$ es:
  $$A_{\text{eff}} = \frac{\lambda^2}{4\pi}$$
  Despejando $\langle S \rangle = \frac{P_{\text{rx}}}{A_{\text{eff}}}$, obtenemos la segunda igualdad de la Ecuación (1):
  $$\langle S \rangle = \frac{4\pi\,P_{\text{rx}}}{\lambda^2}$$
- **Paso C (Despeje del Campo Eléctrico Eficaz $E_{\text{rms}}$):**  
  Igualando ambas expresiones para $\langle S \rangle$:
  $$\frac{E_{\text{rms}}^2}{\eta_0} = \frac{4\pi\,P_{\text{rx}}}{\lambda^2} \implies E_{\text{rms}}^2 = \frac{4\pi\,\eta_0\,P_{\text{rx}}}{\lambda^2} \implies E_{\text{rms}} = \sqrt{\frac{4\pi\,\eta_0\,P_{\text{rx}}}{\lambda^2}}$$

#### 3. Conversión previa indispensable: de $\text{dBm}$ a Vatios ($\text{W}$)
Antes de meter $P_{\text{rx}}$ en la Ecuación (1), recordemos que el simulador entrega la potencia en decibelios-milivatio ($\text{dBm}$). La conversión logarítmica inversa es:
$$P_{\text{rx}}\text{ [mW]} = 10^{\left(\frac{P_{\text{rx}}\text{ [dBm]}}{10}\right)}, \qquad P_{\text{rx}}\text{ [W]} = 10^{\left(\frac{P_{\text{rx}}\text{ [dBm]} - 30}{10}\right)}$$

#### 4. Ejemplo Numérico Real (Verificación de la Tabla 2 del Póster a $r = 3.0\text{ m}$)
Tomemos el dato exacto de la **Tabla 2 del póster** para el escenario con muros de concreto a $r = 3.0\text{ m}$ de distancia en la banda de $2.4\text{ GHz}$ ($\lambda = 0.125\text{ m}$), donde la potencia convergida por SOR es **$P_{\text{rx}} = -56.5\text{ dBm}$**:
1. **Pasamos $-56.5\text{ dBm}$ a Vatios:**
   $$P_{\text{rx}}\text{ [W]} = 10^{(-56.5 - 30)/10} = 10^{-8.65} \approx 2.2387 \times 10^{-9}\text{ W} \quad (2.24\text{ nanovatios})$$
2. **Calculamos el Vector de Poynting $\langle S \rangle$:**
   $$\langle S \rangle = \frac{4\pi \times (2.2387 \times 10^{-9}\text{ W})}{(0.125\text{ m})^2} = \frac{2.813 \times 10^{-8}}{0.015625} \approx 1.80 \times 10^{-6}\text{ W/m}^2 = \mathbf{1.80\,\mu\text{W/m}^2}$$
   *(¡Exactamente el valor $1.80\,\mu\text{W/m}^2$ reportado en la Tabla 2 del póster!).*
3. **Calculamos el Campo Eléctrico Eficaz $E_{\text{rms}}$:**
   $$E_{\text{rms}} = \sqrt{\eta_0 \cdot \langle S \rangle} = \sqrt{376.73\,\Omega \times 1.80 \times 10^{-6}\text{ W/m}^2} = \sqrt{6.781 \times 10^{-4}} \approx \mathbf{0.0260\text{ V/m}} \quad (26.0\text{ mV/m})$$
   *(¡Exactamente el valor $0.0260\text{ V/m}$ reportado en la Tabla 2 del póster!).*
4. **Calculamos el Campo Magnético Eficaz $H_{\text{rms}}$:**
   $$H_{\text{rms}} = \frac{0.0260\text{ V/m}}{376.73\,\Omega} \approx 6.90 \times 10^{-5}\text{ A/m} = \mathbf{0.069\text{ mA/m}}$$

---

### FÓRMULA 2: Ley de Atenuación Exponencial de Beer-Lambert y Constante de Atenuación Dieléctrica

$$E(x) = E_0\,e^{-\alpha x}, \qquad \alpha = \omega_{\text{ang}}\sqrt{\frac{\mu\varepsilon}{2}\left[\sqrt{1 + \left(\frac{\sigma}{\omega_{\text{ang}}\varepsilon}\right)^2} - 1\right]}$$

#### 1. ¿Cómo se lee en voz alta?
> *"La amplitud del campo eléctrico a una distancia equis dentro de un material, E de equis, es igual al campo incidente E sub cero multiplicado por la exponencial elevada a la menos alfa por equis, donde alfa es el coeficiente de atenuación que depende de la frecuencia angular, la permeabilidad magnética mu, la permitividad eléctrica épsilon y la conductividad eléctrica sigma del material."*

#### 2. ¿Qué significa físicamente?
Cuando una onda electromagnética entra en una pared de espesor $x$, no pierde energía de forma lineal, sino **exponencial** (en escala lineal de campo) o **lineal en decibelios ($\text{dB}$)**.
- El cociente $\tan\delta_e = \frac{\sigma}{\omega_{\text{ang}}\varepsilon}$ se conoce en electromagnetismo como la **tangente de pérdidas (*loss tangent*)** del material:
  - **En un dieléctrico perfecto (como el vacío):** $\sigma = 0 \implies \alpha = 0 \implies e^0 = 1$, por lo que no hay absorción del material.
  - **En un dieléctrico con pérdidas (como yeso, ladrillo o concreto):** $\sigma > 0$ y $\varepsilon = \varepsilon_r \varepsilon_0$. Parte de la onda se absorbe y se convierte en calor. Además, como $\omega_{\text{ang}} = 2\pi f$ multiplica toda la raíz y las moléculas de agua en los poros del concreto presentan relajación dipolar más intensa a mayores frecuencias, **a $5.0\text{ GHz}$ el coeficiente $\alpha$ es sustancialmente mayor que a $2.4\text{ GHz}$**.

---

### FÓRMULA 3: Profundidad de Penetración Pelicular (*Skin Depth*) y Efecto Jaula de Faraday

$$\delta = \frac{1}{\alpha} = \sqrt{\frac{2}{\omega_{\text{ang}}\,\mu_0\,\sigma}}$$

#### 1. ¿Cómo se lee en voz alta?
> *"El espesor pelicular o profundidad de penetración delta es igual a uno sobre alfa, que en un buen conductor equivale a la raíz cuadrada de dos dividido entre el producto de la frecuencia angular omega, la permeabilidad magnética mu sub cero y la conductividad eléctrica sigma."*

#### 2. ¿Por qué explica la Jaula de Faraday (Figura 1c del Póster)?
En un metal conductor (como el cobre, aluminio o acero de una Jaula de Faraday), la conductividad es gigantesca: $\sigma \approx 3.5 \times 10^7\text{ S/m}$.
Calculemos cuánto vale $\delta$ a $f = 2.4\text{ GHz}$ ($\omega_{\text{ang}} = 2\pi \times 2.4 \times 10^9 \approx 1.508 \times 10^{10}\text{ rad/s}$):
$$\delta = \sqrt{\frac{2}{(1.508 \times 10^{10}\text{ rad/s}) \times (4\pi \times 10^{-7}\text{ H/m}) \times (3.5 \times 10^7\text{ S/m})}} = \sqrt{\frac{2}{6.632 \times 10^{11}}} \approx 1.73 \times 10^{-6}\text{ m} \approx \mathbf{1.3\text{ a }1.7\,\mu\text{m}}$$
¡Esto significa que a tan solo **$1.3$ micrómetros** de profundidad (menos de una décima parte del grosor de un cabello humano), la onda electromagnética ya fue amortiguada! Una lámina metálica de pocos milímetros es miles de veces más gruesa que $\delta$, bloqueando por completo la transmisión hacia el exterior ($\text{pérdida} \ge 35\text{ dB}$, dejando el campo eléctrico exterior en $E_{\text{rms}} = 0.0009\text{ V/m} = 0.9\text{ mV/m} < 1\text{ mV/m}$, como se reporta en la Tabla 2 y Figura 1c).

---

### FÓRMULA 4 (Ecuación 2 del Póster): Ecuación Diferencial Parcial Elíptica Estacionaria y Condiciones de Frontera de Dirichlet

$$\nabla^2 u(x,y) - \kappa^2(x,y)\,u(x,y) = 0 \quad \text{en } \Omega \qquad (2)$$
$$\text{sujeta a:} \quad u(x_0, y_0) = u_{\text{PIRE}} \quad (\text{en la fuente}), \qquad u\big|_{\partial\Omega} = 0 \quad (\text{en los bordes exteriores})$$

#### 1. ¿Cómo se lee en voz alta?
> *"El laplaciano del potencial de intensidad u de equis coma ye, menos el coeficiente espacial de disipación kappa al cuadrado de equis coma ye multiplicado por u de equis coma ye, es igual a cero en todo el dominio bidimensional Omega; sujeta a condiciones de frontera de Dirichlet fijas en la fuente radiante u de equis sub cero coma ye sub cero igual a u sub PIRE, y fronteras absorbentes nulas en el perímetro exterior parcial de Omega igual a cero."*

#### 2. ¿Qué significa cada término y por qué es una EDP Elíptica?
En física matemática, las ecuaciones diferenciales parciales de segundo orden se clasifican en hiperbólicas (ondas viajeras en el tiempo), parabólicas (difusión térmica transitoria) y **elípticas (estados estacionarios o de equilibrio espacial, como las ecuaciones de Laplace, Poisson y Helmholtz modificada)**.
- Nosotros buscamos el **estado estacionario de la envolvente de energía**: es decir, una vez encendido el router Wi-Fi, ¿cómo queda distribuido el mapa promedio de intensidad de señal en toda la habitación?
- **Primer término ($\nabla^2 u = \frac{\partial^2 u}{\partial x^2} + \frac{\partial^2 u}{\partial y^2}$):** Modela el **esparcimiento o difusión espacial** de la energía en 2D desde la fuente hacia todos los rincones del recinto.
- **Segundo término ($-\kappa^2(x,y)\,u(x,y)$):** Actúa como un **sumidero o término de absorción espacial**. Donde hay aire, $\kappa^2(x,y)$ es muy pequeño ($0.0012$); donde hay un muro de concreto, $\kappa^2(x,y)$ es alto ($0.1500$), drenando rápidamente el valor de $u(x,y)$ al cruzar el muro.
- **¿Qué son las Condiciones de Frontera de Dirichlet?**  
  En cálculo diferencial, una **condición de Dirichlet** consiste en fijar el **valor exacto de la función** en ciertos puntos o bordes del dominio:
  1. **Dirichlet en la fuente $(x_0, y_0)$:** El nodo donde está ubicado el router mantiene su valor fijo e inalterable $u(x_0, y_0) = u_{\text{PIRE}}$ durante todas las iteraciones, porque el router está inyectando energía constantemente a potencia constante.
  2. **Dirichlet en el borde exterior ($\partial\Omega$):** Los nodos del marco perimetral exterior se fijan en $u = 0$ (equivalente a $-100\text{ dBm}$) para simular que la energía que escapa hacia afuera del edificio se pierde en el entorno abierto y no rebota infinitamente.

---

### FÓRMULA 5 (Ecuación 3 del Póster): Discretización en Diferencias Finitas Centradas (Esténcil de 5 Puntos)

$$u_{i,j}^{\text{GS}} = \big(1 - \alpha_{i,j}\big)\,\frac{u_{i+1,j} + u_{i-1,j} + u_{i,j+1} + u_{i,j-1}}{4} \qquad (3)$$

#### 1. ¿Cómo se lee en voz alta?
> *"El valor estimado de Gauss-Seidel en el nodo i coma jota, u sub i coma jota superíndice ge ese, es igual a uno menos el coeficiente local de absorción alfa sub i coma jota, multiplicado por el promedio aritmético de sus cuatro nodos vecinos ortogonales: u sub i más uno coma jota, más u sub i menos uno coma jota, más u sub i coma jota más uno, más u sub i coma jota menos uno, todo dividido entre cuatro."*

#### 2. ¿Cómo se deduce matemáticamente a partir de Series de Taylor? (Preguntado frecuentemente por jurados de Física y Matemáticas)
Una computadora no puede calcular derivadas continuas ($\frac{\partial^2 u}{\partial x^2}$) directamente; necesita convertirlas en sumas y restas algebraicas sobre una cuadrícula de puntos separados por una distancia $h$.
Usando el **Teorema de Taylor** alrededor del nodo $(x_i, y_j)$:
- Hacia adelante ($x_i + h$):
  $$u(x_i + h, y_j) = u_{i,j} + h\frac{\partial u}{\partial x} + \frac{h^2}{2}\frac{\partial^2 u}{\partial x^2} + \frac{h^3}{6}\frac{\partial^3 u}{\partial x^3} + \mathcal{O}(h^4)$$
- Hacia atrás ($x_i - h$):
  $$u(x_i - h, y_j) = u_{i,j} - h\frac{\partial u}{\partial x} + \frac{h^2}{2}\frac{\partial^2 u}{\partial x^2} - \frac{h^3}{6}\frac{\partial^3 u}{\partial x^3} + \mathcal{O}(h^4)$$
Si sumamos ambas ecuaciones, las derivadas impares ($\frac{\partial u}{\partial x}$ y $\frac{\partial^3 u}{\partial x^3}$) se cancelan exactamente, y al despejar la segunda derivada obtenemos la **fórmula de diferencias finitas centradas de segundo orden**:
$$\frac{\partial^2 u}{\partial x^2} \approx \frac{u_{i+1,j} - 2u_{i,j} + u_{i-1,j}}{h^2}$$
Haciendo exactamente lo mismo en el eje vertical $y$:
$$\frac{\partial^2 u}{\partial y^2} \approx \frac{u_{i,j+1} - 2u_{i,j} + u_{i,j-1}}{h^2}$$
Sumando ambas para formar el Laplaciano $\nabla^2 u$ en la Ecuación (2):
$$\frac{u_{i+1,j} + u_{i-1,j} + u_{i,j+1} + u_{i,j-1} - 4u_{i,j}}{h^2} - \kappa_{i,j}^2\,u_{i,j} = 0$$
Si despejamos el nodo central $u_{i,j}$:
$$u_{i,j} = \frac{1}{1 + \frac{h^2 \kappa_{i,j}^2}{4}} \left( \frac{u_{i+1,j} + u_{i-1,j} + u_{i,j+1} + u_{i,j-1}}{4} \right)$$
Definiendo el factor local de atenuación $\alpha_{i,j} = 1 - \frac{1}{1 + h^2\kappa_{i,j}^2 / 4}$ (de modo que $1 - \alpha_{i,j} = \frac{1}{1 + h^2\kappa_{i,j}^2 / 4}$), obtenemos de forma exacta nuestra **Ecuación (3) del póster**:
$$u_{i,j}^{\text{GS}} = \big(1 - \alpha_{i,j}\big)\,\frac{u_{i+1,j} + u_{i-1,j} + u_{i,j+1} + u_{i,j-1}}{4}$$

#### 3. Interpretación intuitiva (El "Esténcil de 5 Puntos")
Se llama **esténcil de 5 puntos** porque para calcular el nodo del centro $(i,j)$ usamos una cruz formada por 5 celdas: el centro y sus 4 vecinos (norte, sur, este y oeste).
Físicamente dice algo hermosamente simple:
> *"La energía en cualquier punto del cuarto es igual al promedio de la energía que le llega desde sus 4 vecinos inmediatos, descontando el porcentaje de pérdida $\alpha_{i,j}$ que absorbe el material que está en esa celda."*

---

### FÓRMULA 6 (Ecuación 4 del Póster): Algoritmo de Sobre-Relajación Sucesiva (SOR) y Criterio de Convergencia

$$u_{i,j}^{(k+1)} = (1 - \omega)\,u_{i,j}^{(k)} + \omega\,u_{i,j}^{\text{GS}} \qquad (4)$$
$$\text{Criterio de parada:} \quad \max_{i,j} \left| u_{i,j}^{(k+1)} - u_{i,j}^{(k)} \right| = \left\| u^{(k+1)} - u^{(k)} \right\|_\infty < \varepsilon \quad (\varepsilon = 10^{-4})$$

#### 1. ¿Cómo se lee en voz alta?
> *"El potencial del nodo i coma jota en la iteración k más uno es igual a uno menos omega multiplicado por el valor anterior del nodo en la iteración k, más el factor de relajación omega multiplicado por el valor estimado de Gauss-Seidel u sub i coma jota superíndice ge ese. El proceso iterativo se detiene cuando la norma infinito de la diferencia entre la iteración k más uno y la iteración k es menor que la tolerancia épsilon igual a diez a la menos cuatro."*

#### 2. ¿Por qué SOR es mucho más rápido que Jacobi y Gauss-Seidel?
Podemos reescribir la Ecuación (4) agrupando $u_{i,j}^{(k)}$:
$$u_{i,j}^{(k+1)} = u_{i,j}^{(k)} + \omega\,\underbrace{\left( u_{i,j}^{\text{GS}} - u_{i,j}^{(k)} \right)}_{\text{Dirección de cambio }\Delta u}$$
- Si $\omega = 1.00$ (**Gauss-Seidel**), damos exactamente el paso $\Delta u$ sugerido por el promedio de los vecinos.
- Como la difusión en una malla avanza en la misma dirección iteración tras iteración, si elegimos un **$\omega > 1$** (por ejemplo, **$\omega = 1.45$**), estamos **extrapolando o amplificando un $45\%$ adicional** el paso en la dirección correcta hacia el equilibrio. Esto reduce drásticamente el radio espectral de la matriz de iteración $\rho(\mathbf{T}_\omega)$, logrando que la onda "llene" la malla en **66 iteraciones ($2.8\text{ ms}$)** en lugar de las **251 iteraciones ($11.4\text{ ms}$)** de Jacobi.
- **Condición matemática de estabilidad (Teorema de Kahan / Ostrowski-Reich):** Para que SOR converja, es obligatorio que $0 < \omega < 2$. Si $\omega \ge 2$, las oscilaciones se amplifican y el método diverge a infinito.

---

### FÓRMULA 7: Modelo Analítico de Validación Log-Distancia Multi-Muro (Norma Internacional ITU-R P.1238)

$$P_{\text{rx}}(d) = P_0(d_0) - 10\,n\,\log_{10}\!\left(\frac{d}{d_0}\right) - \sum_{m} L_{\text{muro}, m} \qquad [\text{en dBm}]$$

#### 1. ¿Cómo se lee en voz alta?
> *"La potencia recibida en decibelios milivatio a una distancia d es igual a la potencia de referencia P sub cero medida a la distancia de referencia d sub cero de un metro, menos diez veces el exponente de pérdida de trayectoria ene por el logaritmo en base diez de d sobre d sub cero, menos la sumatoria de las pérdidas por inserción L sub muro de cada pared atravesada en línea recta."*

#### 2. ¿Qué significa cada término?
- **$d$:** Distancia euclidiana en metros desde la antena transmisora hasta el nodo evaluado: $d = \sqrt{(x - x_0)^2 + (y - y_0)^2}$.
- **$d_0 = 1.0\text{ m}$:** Distancia de referencia estándar a un metro del transmisor.
- **$P_0(d_0)$:** Potencia recibida a $1\text{ m}$ de la antena ($\text{PIRE} - \text{FSPL}(1\text{ m})$, donde la pérdida en espacio libre a $1\text{ m}$ es $40.05\text{ dB}$ en $2.4\text{ GHz}$ y $46.42\text{ dB}$ en $5.0\text{ GHz}$).
- **$n$:** Exponente de pérdida por distancia (*path-loss exponent*), que vale $n = 2.0$ en espacio libre y entre $2.2$ y $3.0$ en interiores según la recomendación **ITU-R P.1238-12** de la Unión Internacional de Telecomunicaciones.
- **$\sum L_{\text{muro}, m}$:** Suma de los decibelios que resta cada muro que se interpone en el segmento de línea recta entre el router y el receptor (determinado computacionalmente en nuestro código mediante el **algoritmo de trazado de rayos en cuadrícula de Bresenham**):
  - Pared de Yeso (*Drywall*): resta $3\text{ dB}$.
  - Pared de Ladrillo: resta $8\text{ dB}$.
  - Muro de Concreto: resta $15\text{ dB}$ (a $2.4\text{ GHz}$).
  - Blindaje de Metal: resta $\ge 35\text{ dB}$.

---

## MÓDULO 4: PROPIEDADES DE LOS MATERIALES (TABLA 1 DEL PÓSTER, ITU-R P.2040 Y QUÉ ES EL `BASE COEFF.`)

En la sección 3 del póster (*Descripción del sistema modelado*), presentamos la **Tabla 1**, basada en el estándar internacional **ITU-R P.2040-3** (*Efectos de los materiales y estructuras de construcción en la propagación de ondas radioeléctricas por encima de 100 MHz*):

| Material / Medio | Permitividad Relativa ($\varepsilon_r$) | Conductividad Efectiva $\sigma$ ($\text{S/m}$) | Pérdida por Inserción ($\text{dB}$) | Coeficiente Base $\alpha_{i,j}$ (`Base Coeff.`) |
| :--- | :---: | :---: | :---: | :---: |
| **Aire (Espacio libre)** | $1.0006$ | $0.000$ | $0\text{ dB}$ | $0.0012$ |
| **Yeso (Drywall)** | $2.8$ | $0.015$ | $3\text{ dB}$ | $0.0200$ |
| **Ladrillo** | $4.5$ | $0.038$ | $8\text{ dB}$ | $0.0800$ |
| **Concreto (Hormigón)** | $6.5$ | $0.085$ | $15\text{ dB}$ | $0.1500$ |
| **Metal (Jaula Faraday)** | — (Tiende a $\infty$ efectivo) | $3.5 \times 10^7$ | $\ge 35\text{ dB}$ | $0.2500$ |

### 4.1 ¿Qué es exactamente el `Base Coeff.` ($\alpha_{i,j}$ Base) y cómo funciona?
Esta es una pregunta clave de sustentación:
- **Nombre técnico:** Coeficiente Base de Absorción Dieléctrica Nodal ($\alpha_{\text{base}}$ o $\alpha_{i,j}$).
- **¿Qué representa físicamente?**  
  En la ecuación en diferencias finitas $u_{i,j}^{\text{GS}} = (1 - \alpha_{i,j}) \times \text{PromedioVecinos}$, el número $\alpha_{i,j}$ representa **la fracción o porcentaje de energía electromagnética que se disipa localmente al atravesar un nodo de ese material** en la banda base de **$2.4\text{ GHz}$**:
  1. **En el Aire ($\alpha_{\text{base}} = 0.0012$):** Solo se pierde el $0.12\%$ por paso nodal, lo cual modela la suave caída natural por expansión geométrica en el espacio libre.
  2. **En el Yeso / Drywall ($\alpha_{\text{base}} = 0.0200$):** Al tener baja permitividad ($\varepsilon_r = 2.8$) y baja conductividad ($\sigma = 0.015\text{ S/m}$), solo absorbe el $2\%$ en cada paso, causando una atenuación leve de unos $3\text{ dB}$ (la mitad de la potencia).
  3. **En el Ladrillo ($\alpha_{\text{base}} = 0.0800$):** Con $\varepsilon_r = 4.5$ y $\sigma = 0.038\text{ S/m}$ (arcilla cocida porosa), absorbe el $8\%$ local, atenuando unos $8\text{ dB}$.
  4. **En el Concreto / Hormigón ($\alpha_{\text{base}} = 0.1500$):** Debido a su alta densidad, silicatos, humedad retenida y malla de acero interna, tiene una permitividad alta ($\varepsilon_r = 6.5$) y una conductividad de $\sigma = 0.085\text{ S/m}$. Disipa el $15\%$ por nodo, produciendo una caída severa de $15\text{ dB}$ (reduce la potencia en más de $30$ veces).
  5. **En el Metal / Jaula de Faraday ($\alpha_{\text{base}} = 0.2500$):** Con $\sigma = 3.5 \times 10^7\text{ S/m}$, el amortiguamiento nodal trunca la propagación provocando una caída superior a $35\text{ dB}$ (más de $3,000$ veces menos potencia), anulando el campo exterior.

- **¿Por qué se llama "Base" (`Base Coeff.`)?**  
  Porque ese es su valor de referencia para la frecuencia base de **$2.4\text{ GHz}$**. Cuando el usuario cambia el simulador a la banda de **$5.0\text{ GHz}$**, el motor físico aplica automáticamente un **factor de escalamiento por frecuencia de $1.4\times$**:
  $$\alpha_{i,j}(5.0\text{ GHz}) = 1.4 \times \alpha_{\text{base}}(2.4\text{ GHz})$$
  Por ejemplo, para el concreto pasa de $0.1500$ a $0.2100$. Esto reproduce el hecho físico real de que a $5.0\text{ GHz}$ ($\lambda = 6.0\text{ cm}$) la onda interactúa mucho más fuertemente con las inhomogeneidades del muro y sufre $8.5\text{ dB}$ adicionales de pérdida respecto a $2.4\text{ GHz}$.

---

## MÓDULO 5: DIFERENCIA ENTRE SOLUCIÓN NUMÉRICA VS. MODELO ANALÍTICO

Esta distinción es fundamental para explicar la **Figura 2(a)** del póster:

### 5.1 ¿Qué es el Modelo Analítico (Línea punteada / curva teórica ITU-R P.1238)?
- Es una **fórmula algebraica cerrada** ($P_{\text{rx}}(d) = P_0 - 10n\log_{10}(d/d_0) - \sum L_{\text{muro}}$) que evalúa cada punto de manera aislada trazando una línea recta imaginaria desde el router hasta el punto receptor.
- **Ventaja:** Es un estándar internacional de referencia empírica rápida dictado por la Unión Internacional de Telecomunicaciones (UIT).
- **Limitación:** Es "ciego" al entorno lateral. No sabe si a $20\text{ cm}$ del muro hay una puerta abierta por donde la onda puede rodear el obstáculo por difracción, ni resuelve ecuaciones diferenciales en 2D.

### 5.2 ¿Qué es la Solución Numérica (Curva continua / Mapa 2D de *SimuNet Física*)?
- Es el resultado de resolver un sistema acoplado de **$576$ ecuaciones algebraicas simultáneas** ($24 \times 24$ nodos) derivado de la **Ecuación Diferencial Parcial $\nabla^2 u - \kappa^2 u = 0$** mediante Diferencias Finitas y el algoritmo iterativo SOR.
- **Ventaja física superior:** En la solución numérica, cada nodo depende de sus 4 vecinos. Por lo tanto, la energía **sí puede rodear esquinas (difracción en bordes), fluir a través de pasillos o aberturas, formar sombras electromagnéticas suaves detrás de los muros de concreto y encerrarse dentro de una Jaula de Faraday**.

### 5.3 ¿Por qué los comparamos y qué significan $\text{RMSE} = 1.84\text{ dB}$ y $R^2 = 0.978$?
En física computacional, todo simulador numérico nuevo debe validarse contra un patrón de referencia conocido (*benchmark*). Al comparar nuestro perfil radial numérico contra la norma internacional **ITU-R P.1238**, obtenemos dos métricas estadísticas sobresalientes:
1. **$\text{RMSE} = 1.84\text{ dB}$ (*Root Mean Square Error* / Error Cuadrático Medio):**  
   Calculado como $\text{RMSE} = \sqrt{\frac{1}{M}\sum_{m=1}^{M} \left(P_{\text{num}, m} - P_{\text{ITU}, m}\right)^2}$.  
   Un error promedio de apenas $1.84\text{ dB}$ en un rango dinámico de $80\text{ dB}$ (de $-20\text{ dBm}$ a $-100\text{ dBm}$) equivale a una desviación relativa menor al **$2.3\%$**, lo cual en ingeniería de radiofrecuencia se considera una concordancia excelente (los errores aceptables en interiores suelen ser de hasta $4\text{ a }6\text{ dB}$).
2. **$R^2 = 0.978$ (Coeficiente de Determinación):**  
   Indica que el **$97.8\%$ de la variación espacial real de la energía electromagnética** predicha por la norma internacional está explicada directamente por nuestro modelo en diferencias finitas.

---

## MÓDULO 6: ANÁLISIS DETALLADO DE LOS RESULTADOS DEL PÓSTER (FIGURAS 1 Y 2, Y TABLA 2)

En la columna derecha del póster (Sección 5: *Resultados y discusión*) se presentan tres elementos visuales clave que debes señalar con la mano durante tu exposición:

### 6.1 Figura 1: Mapas de Campo 2D en Diferencias Finitas
Consta de tres paneles comparativos $(a)$, $(b)$ y $(c)$:
- **Panel (a) — $2.4\text{ GHz}$ en recinto con muros de concreto:**  
  Se observa cómo la onda UHF ($\lambda = 12.5\text{ cm}$) logra atravesar las paredes de concreto manteniendo niveles útiles de señal ($-50\text{ a }-65\text{ dBm}$, colores verdes y amarillos) en las habitaciones contiguas.
- **Panel (b) — $5.0\text{ GHz}$ en el mismo recinto de concreto:**  
  Al reducir la longitud de onda a la mitad ($\lambda = 6.0\text{ cm}$), la absorción dieléctrica del concreto aumenta en **$8.5\text{ dB}$ adicionales**. Visualmente, el mapa se torna azul oscuro detrás de los muros, demostrando por qué el Wi-Fi de $5.0\text{ GHz}$ tiene menor alcance a través de paredes aunque tenga mayor ancho de banda cerca del router.
- **Panel (c) — Blindaje Metálico (Jaula de Faraday):**  
  Al encerrar la región en paredes metálicas ($\sigma = 3.5 \times 10^7\text{ S/m}$, espesor pelicular $\delta \approx 1.3\,\mu\text{m}$), toda la energía queda confinada adentro y en el exterior el campo eléctrico cae por debajo de **$1\text{ mV/m}$ ($0.0009\text{ V/m}$, $-85\text{ dBm}$)**, comprobando computacionalmente el principio de la Jaula de Faraday descubierta por Michael Faraday en 1836.

### 6.2 Figura 2: Validación Analítica y Curvas de Convergencia Numérica
- **Figura 2(a) — Perfil Radial de Potencia ($P_{\text{rx}}$ vs. Distancia $r$):**  
  Muestra cómo decae la potencia desde $-20\text{ dBm}$ en el router ($r = 0\text{ m}$) hasta $-80\text{ dBm}$ en los bordes ($r = 6\text{ m}$). Se ve claramente el escalón abrupto de caída de $15\text{ dB}$ justo en la posición del muro de concreto ($r \approx 2.5\text{ m}$), donde la curva numérica sigue fielmente a la curva analítica ITU-R P.1238 ($R^2 = 0.978$, $\text{RMSE} = 1.84\text{ dB}$).
- **Figura 2(b) — Velocidad de Convergencia (Error Máximo en escala logarítmica vs. Iteraciones):**  
  Compara las tres curvas iterativas bajando hasta el umbral de tolerancia $\varepsilon = 10^{-4}$:
  - La curva roja (**Jacobi**) baja lentamente y tarda **251 iteraciones**.
  - La curva azul (**Gauss-Seidel**, $\omega = 1.00$) baja al doble de velocidad y tarda **138 iteraciones**.
  - La curva verde/dorada (**SOR Óptimo**, $\omega = 1.45$) cae en picada vertical y converge en tan solo **66 iteraciones**.

### 6.3 Tabla 2: Desempeño Numérico y Magnitudes Electromagnéticas a $r = 3.0\text{ m}$

| Método / Escenario evaluado a $r = 3.0\text{ m}$ | Iteraciones para converger | Tiempo de Cómputo | Potencia $P_{\text{rx}}$ ($\text{dBm}$) | Vector de Poynting $\langle S \rangle$ ($\mu\text{W/m}^2$) | Campo Eléctrico $E_{\text{rms}}$ ($\text{V/m}$) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Jacobi ($\omega = 1.00$, simultáneo)** | $251$ | $11.4\text{ ms}$ | $-56.5$ | $1.80$ | $0.0260$ |
| **Gauss-Seidel ($\omega = 1.00$, sucesivo)** | $138$ | $6.2\text{ ms}$ | $-56.5$ | $1.80$ | $0.0260$ |
| **SOR Óptimo ($\omega = 1.45$)** | **$66$ ($-73.7\%$)** | **$2.8\text{ ms}$** | **$-56.5$** | **$1.80$** | **$0.0260$** |
| **Espacio libre ($2.4\text{ GHz}$, sin muros)** | $66$ | $2.8\text{ ms}$ | $-42.5$ | $45.30$ | $0.1306$ |
| **Exterior Jaula Faraday ($\sigma = 3.5 \times 10^7$)** | $66$ | $2.8\text{ ms}$ | $-85.0$ | $0.002$ | $0.0009$ |

**Tres conclusiones clave que debes destacar al explicar la Tabla 2:**
1. **Invarianza de la solución física:** Observa que tanto Jacobi (251 iteraciones), como Gauss-Seidel (138 iteraciones), como SOR (66 iteraciones) llegan **exactamente a los mismos valores físicos**: $-56.5\text{ dBm}$, $1.80\,\mu\text{W/m}^2$ y $0.0260\text{ V/m}$. Esto demuestra que el factor $\omega = 1.45$ de SOR **no altera la física del problema**, sino que únicamente acelera el camino algebraico para llegar a la respuesta **$3.8$ veces más rápido** (reduciendo el $73.7\%$ de las iteraciones).
2. **Impacto del muro de concreto:** Comparando a $3\text{ m}$ el *Espacio libre sin muros* ($-42.5\text{ dBm}$, $\langle S \rangle = 45.30\,\mu\text{W/m}^2$, $E_{\text{rms}} = 0.1306\text{ V/m}$) contra el escenario *con muro de concreto* ($-56.5\text{ dBm}$, $\langle S \rangle = 1.80\,\mu\text{W/m}^2$, $E_{\text{rms}} = 0.0260\text{ V/m}$), vemos que un solo muro de hormigón reduce el flujo de energía de Poynting de $45.30$ a $1.80\,\mu\text{W/m}^2$ (¡una caída de **$25$ veces en la densidad de potencia** y de **$5$ veces en el campo eléctrico**!).
3. **Aislamiento de la Jaula de Faraday:** En el exterior de la Jaula de Faraday, la potencia cae a $-85.0\text{ dBm}$, el flujo de Poynting se desploma a $0.002\,\mu\text{W/m}^2$ (más de $22,000$ veces menor que en espacio libre) y el campo eléctrico baja a $0.0009\text{ V/m}$ ($0.9\text{ mV/m}$), confirmando el apantallamiento total.

---

## MÓDULO 7: CÓMO ESTÁ ESTRUCTURADO EL SOFTWARE (*SIMUNET FÍSICA*)

Si un jurado o visitante te pide mostrar la aplicación en vivo o pregunta cómo está programada:
1. **Arquitectura Limpia y Modular (TypeScript + React + Vite):**
   - `src/types.ts`: Define las estructuras de datos para nodos, routers múltiples, materiales dieléctricos y métricas electromagnéticas.
   - `src/metodos/jacobi.ts`, `src/metodos/gauss-seidel.ts` y `src/metodos/sor.ts`: Implementan de manera pura y comentada línea por línea los tres motores numéricos sobre la matriz bidimensional $N \times N$, respetando las celdas fuente (condición de Dirichlet fija) y aplicando el esténcil de 5 puntos con el coeficiente de absorción $\alpha_{i,j}$.
   - `src/servicios.ts`: Contiene las funciones físicas `calcularMagnitudesElectromagneticas()` (que aplica la Ecuación 1 del póster para hallar $P_{\text{rx}}$ en vatios, $\langle S \rangle$, $E_{\text{rms}}$ y $H_{\text{rms}}$ en cada celda), `obtenerPropiedadesMaterial()` (que implementa la Tabla 1 de la norma ITU-R P.2040) y `calcularValidacionAnaliticaITU()` (que ejecuta el trazado de rayos de Bresenham y calcula el $\text{RMSE}$ y el $R^2$ frente a ITU-R P.1238).
   - `src/controlador.ts`: Orquesta el estado de la simulación, el buscador automático del $\omega_{\text{opt}}$ empírico y los escenarios preconfigurados (Espacio Libre, Muros de Concreto y Jaula de Faraday).

---

## MÓDULO 8: GUION ESTRUCTURADO DE EXPOSICIÓN ORAL (PASO A PASO FRENTE AL PÓSTER)

### Fase 1: Apertura e Introducción (Minuto 0:00 a 1:00)
> *"Buenos días, estimado jurado y asistentes. Mi nombre es **Juan David Conde Duarte**, trabajo realizado junto a la profesora **Gladys Liliana Bautista Wilches** del Departamento de Física de la Universidad de Pamplona. Presentamos en la modalidad computacional el proyecto titulado: **Modelado computacional de la propagación e intensidad de campo electromagnético UHF/SHF en recintos con materiales dieléctricos**.*  
> *La motivación central de este estudio nace de una pregunta fundamental del electromagnetismo aplicado: ¿cómo se distribuye espacialmente la energía de una onda de microondas cuando abandona el espacio libre e interactúa con la arquitectura real de una edificación? Mientras las ecuaciones analíticas clásicas solo funcionan en medios homogéneos sin obstáculos, nosotros desarrollamos un simulador numérico bidimensional llamado **SimuNet Física** que resuelve las ecuaciones diferenciales de propagación y absorción dieléctrica en tiempo real."*

### Fase 2: Marco Teórico y Ecuaciones 1 y 2 (Minuto 1:00 a 2:30)
> *(Señalar el bloque 'Marco teórico / Modelo físico' en la columna izquierda)*  
> *"Físicamente, partimos del **Teorema de Poynting** en la **Ecuación (1)**. En el aire, cuya impedancia intrínseca es $\eta_0 = \sqrt{\mu_0/\varepsilon_0} \approx 376.73\,\Omega$, la magnitud media temporal del **Vector de Poynting $\langle S \rangle$**, que mide el flujo de potencia en microvatios por metro cuadrado, es igual al cuadrado del **campo eléctrico eficaz $E_{\text{rms}}$** dividido entre $\eta_0$. A su vez, al captar esa onda con una apertura efectiva isotrópica $A_{\text{eff}} = \lambda^2/(4\pi)$, conectamos la potencia recibida $P_{\text{rx}}$ con la longitud de onda $\lambda$, lo que nos permite despejar directamente el campo eléctrico en voltios por metro y el campo magnético en amperios por metro.*  
> *Cuando la onda atraviesa un muro con permitividad relativa $\varepsilon_r$ y conductividad $\sigma$, sufre una atenuación exponencial regida por la **Ley de Beer-Lambert**. En régimen estacionario 2D, modelamos la envolvente normalizada de energía $u(x,y)$ mediante la **Ecuación Diferencial Parcial Elíptica (2)**: $\nabla^2 u - \kappa^2 u = 0$, aplicando condiciones de frontera de **Dirichlet** fijas en la antena transmisora y bordes absorbentes nulos en el perímetro exterior."*

### Fase 3: Materiales Dieléctricos y Metodología Numérica — Tabla 1 y Ecuaciones 3 y 4 (Minuto 2:30 a 4:00)
> *(Señalar la Tabla 1 y el bloque 'Metodología computacional')*  
> *"En la **Tabla 1**, parametrizamos cinco medios siguiendo la norma internacional **ITU-R P.2040**: aire, yeso, ladrillo, concreto y metal. Aquí cada material posee su permitividad $\varepsilon_r$, su conductividad $\sigma$ y su **Coeficiente Base $\alpha_{i,j}$**, que representa la fracción de energía disipada por nodo a $2.4\text{ GHz}$ y que se escala por $1.4\times$ al pasar a $5.0\text{ GHz}$.*  
> *Para resolver la ecuación diferencial sobre una malla de $24 \times 24$ nodos ($12\text{ m} \times 12\text{ m}$), aplicamos en la **Ecuación (3)** una **discretización en Diferencias Finitas Centradas de 5 puntos**, donde el valor de cada celda es el promedio de sus cuatro vecinos afectado por el factor de absorción $(1 - \alpha_{i,j})$.*  
> *Finalmente, en la **Ecuación (4)** resolvemos el sistema iterativamente mediante **Sobre-Relajación Sucesiva (SOR)** usando un factor de extrapolación óptimo $\omega = 1.45$, deteniendo las iteraciones cuando el error máximo cae por debajo de $\varepsilon = 10^{-4}$."*

### Fase 4: Resultados, Validación y Conclusiones — Figuras 1, 2 y Tabla 2 (Minuto 4:00 a 5:30)
> *(Señalar la columna derecha: Figura 1, Figura 2 y Tabla 2)*  
> *"En la **Figura 1** observamos los mapas de campo 2D obtenidos. Comparando **1(a)** y **1(b)**, demostramos que la banda UHF de $2.4\text{ GHz}$ ($\lambda = 12.5\text{ cm}$) penetra con mucha mayor eficacia los muros de concreto que la banda SHF de $5.0\text{ GHz}$ ($\lambda = 6.0\text{ cm}$), la cual sufre $8.5\text{ dB}$ adicionales de absorción dieléctrica. En la **Figura 1(c)** comprobamos el caso límite de **Jaula de Faraday**: debido a la altísima conductividad del metal ($\sigma = 3.5 \times 10^7\text{ S/m}$), la profundidad pelicular es de apenas $\delta \approx 1.3\,\mu\text{m}$, bloqueando la onda y dejando el campo exterior por debajo de $1\text{ mV/m}$.*  
> *En la **Figura 2(a)** validamos nuestro modelo numérico frente al estándar analítico internacional **ITU-R P.1238**, logrando una correlación sobresaliente de **$R^2 = 0.978$** y un error cuadrático medio de apenas **$1.84\text{ dB}$**.*  
> *Y en la **Figura 2(b)** y la **Tabla 2**, demostramos que el método **SOR con $\omega = 1.45$** converge exactamente a la misma solución física que Jacobi y Gauss-Seidel ($-56.5\text{ dBm}$, vector de Poynting de $1.80\,\mu\text{W/m}^2$ y campo eléctrico de $0.0260\text{ V/m}$ a $3\text{ m}$), pero reduciendo las iteraciones de **251 a solo 66** (un **$73.7\%$ menos**, o **$3.8$ veces más rápido**, en solo $2.8\text{ ms}$). Muchas gracias, quedo atento a sus preguntas."*

---

## MÓDULO 9: BANCO DE 10 PREGUNTAS DIFÍCILES DEL JURADO CON RESPUESTAS MAGISTRALES

1. **Jurado: *"¿Por qué en la Ecuación (1) aparece $\lambda^2$ dividiendo al calcular el Vector de Poynting y el Campo Eléctrico a partir de la potencia recibida?"***  
   - **Respuesta:** *"Porque $P_{\text{rx}}$ es la potencia captada por una antena receptora isotrópica, cuya apertura o área efectiva de captura es $A_{\text{eff}} = \frac{\lambda^2}{4\pi}$. Como $\langle S \rangle = \frac{P_{\text{rx}}}{A_{\text{eff}}}$, al sustituir $A_{\text{eff}}$ el término $\lambda^2$ pasa al denominador: $\langle S \rangle = \frac{4\pi P_{\text{rx}}}{\lambda^2}$. Esto refleja que, a mayor frecuencia (menor longitud de onda $\lambda$), una antena isotrópica tiene un área física de captura más pequeña."*

2. **Jurado: *"¿Qué diferencia física hay entre la permitividad relativa $\varepsilon_r$ y la conductividad $\sigma$ en la Tabla 1?"***  
   - **Respuesta:** *"La permitividad relativa $\varepsilon_r$ mide la capacidad de polarización eléctrica de los dipolos moleculares del material (cuánta energía reactiva almacena el medio y cuánto se reduce la velocidad de propagación de la onda $v = c/\sqrt{\varepsilon_r}$), mientras que la conductividad $\sigma$ mide el transporte de cargas libres y corrientes inducidas ($\mathbf{J} = \sigma\mathbf{E}$) que disipan irreversiblemente la energía electromagnética en forma de calor por efecto Joule."*

3. **Jurado: *"¿Por qué en la Tabla 1 la permitividad relativa $\varepsilon_r$ del metal tiene un guion (—)?"***  
   - **Respuesta:** *"Porque a frecuencias de microondas ($2.4\text{ y }5.0\text{ GHz}$), en un buen conductor metálico la corriente de conducción ($\sigma \mathbf{E}$, con $\sigma = 3.5 \times 10^7\text{ S/m}$) domina por completo sobre la corriente de desplazamiento ($\omega\varepsilon\mathbf{E}$), ya que $\frac{\sigma}{\omega\varepsilon} \gg 10^8$. Por tanto, el comportamiento del metal está gobernado casi exclusivamente por su conductividad $\sigma$ y su espesor pelicular $\delta \approx 1.3\,\mu\text{m}$."*

4. **Jurado: *"¿Por qué utilizaste una ecuación elíptica estacionaria ($\nabla^2 u - \kappa^2 u = 0$) en lugar de la ecuación de Helmholtz completa ($\nabla^2 E + k^2 E = 0$)?"***  
   - **Respuesta:** *"Resolver la fase instantánea de la ecuación de Helmholtz a $5.0\text{ GHz}$ ($\lambda = 6\text{ cm}$) exige por el criterio de Nyquist-espacial al menos 10 nodos por longitud de onda ($h \le 6\text{ mm}$), lo que requeriría más de $4\text{ millones}$ de nodos para un salón de $12\text{ m} \times 12\text{ m}$, impidiendo la simulación interactiva en tiempo real. Nuestra formulación elíptica modela directamente la envolvente estacionaria de intensidad energética promedio en mallas de $24 \times 24$ en solo $2.8\text{ ms}$, logrando una correlación del $97.8\%$ frente a la norma ITU-R P.1238."*

5. **Jurado: *"¿Qué pasaría en tu simulador si pones un factor de relajación $\omega = 2.1$ en el método SOR?"***  
   - **Respuesta:** *"El método numérico divergiría (el error crecería hacia infinito en cada iteración). Por el teorema de Ostrowski-Reich y Kahan, el radio espectral de la matriz de iteración de SOR solo es menor que $1$ ($\rho(\mathbf{T}_\omega) < 1$) si y solo si $0 < \omega < 2$."*

6. **Jurado: *"¿Por qué Gauss-Seidel converge en casi la mitad de iteraciones que Jacobi (138 vs 251) si ambos tienen $\omega = 1.00$?"***  
   - **Respuesta:** *"Porque Jacobi utiliza dos matrices separadas y calcula todos los nodos de la iteración $(k+1)$ usando únicamente los valores antiguos de la iteración $(k)$. En cambio, Gauss-Seidel actualiza la misma matriz en sitio (*in-place*): cuando calcula el nodo $(i,j)$, ya usa los valores recién actualizados de los vecinos $(i-1, j)$ e $(i, j-1)$ en ese mismo barrido, propagando la información el doble de rápido."*

7. **Jurado: *"¿Cómo hallaron que $\omega = 1.45$ era el valor óptimo para SOR?"***  
   - **Respuesta:** *"Programamos en el controlador del simulador un módulo de optimización paramétrica que barre valores de $\omega$ entre $1.05$ y $1.95$ con pasos de $0.05$ sobre la geometría del recinto, midiendo la curva de iteraciones requeridas para alcanzar $\varepsilon = 10^{-4}$. El mínimo global de iteraciones (66 iteraciones) para nuestra malla de $24 \times 24$ con obstáculos dieléctricos se localizó en $\omega_{\text{opt}} = 1.45$."*

8. **Jurado: *"¿Qué significa que un nivel de potencia sea negativo en dBm, por ejemplo $-56.5\text{ dBm}$?"***  
   - **Respuesta:** *"Un valor negativo en $\text{dBm}$ NO significa potencia negativa (la potencia en vatios siempre es positiva). Como $\text{dBm} = 10\log_{10}(P / 1\text{ mW})$, cualquier potencia menor a $1\text{ milivatio}$ tiene un logaritmo negativo. Por ejemplo, $0\text{ dBm} = 1\text{ mW}$, $-30\text{ dBm} = 1\text{ microvatio}$, y $-56.5\text{ dBm} = 2.24\text{ nanovatios}$."*

9. **Jurado: *"¿Estos niveles de campo eléctrico ($0.0260\text{ V/m}$ a $3\text{ m}$) son seguros para la salud humana?"***  
   - **Respuesta:** *"Totalmente seguros. Se trata de radiación no ionizante (microondas de baja potencia) y el límite internacional de exposición ocupacional y de público general establecido por la ICNIRP para $2.4 - 5.0\text{ GHz}$ es de $61\text{ V/m}$. Nuestro valor de $0.0260\text{ V/m}$ a $3\text{ m}$ está más de $2,300$ veces por debajo del límite máximo permitido."*

10. **Jurado: *"¿Cómo podrían mejorar este modelo en una fase futura de investigación?"***  
    - **Respuesta:** *"Como planteamos en las conclusiones del póster, existen tres líneas de extensión: primero, incorporar la ecuación de Helmholtz compleja o el algoritmo FDTD de Yee para simular interferencia constructiva y destructiva por multitrayectoria; segundo, sustituir el borde de Dirichlet ($u=0$) por fronteras absorbentes PML (*Perfectly Matched Layer*); y tercero, extender el esténcil de 5 puntos en 2D a un esténcil de 7 puntos en 3D."*

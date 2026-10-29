# Manual Magistral de Fórmulas, Análisis Físico, Código y Guion de Exposición Oral
**Evento:** Feria de la Física 2026 — Universidad de Pamplona  
**Título del Proyecto:** *Modelado computacional de la propagación e intensidad de campo electromagnético UHF/SHF en recintos con materiales dieléctricos*  
**Ponente:** Juan David Conde Duarte (Ingeniería de Sistemas)  
**Docente Tutora:** Gladys Liliana Bautista Wilches (Electromagnetismo)  

---

## Parte 1: Enciclopedia de Todas las Fórmulas del Proyecto (Origen, Deducción, Resolución y Uso en el Código)

Esta sección documenta de forma rigurosa el origen físico, la deducción algebraica, la resolución numérica y la implementación computacional exacta de cada una de las 10 ecuaciones empleadas en `SimuNet Física`.

---

### Fórmula 1: Ecuación de Onda de Maxwell, Velocidad de la Luz ($c$) y Longitud de Onda ($\lambda$)

$$\nabla^2 \vec{E} - \mu_0\varepsilon_0\frac{\partial^2 \vec{E}}{\partial t^2} = 0 \implies c = \frac{1}{\sqrt{\mu_0\varepsilon_0}} \approx 2.99792458\times 10^8\text{ m/s}, \qquad \lambda = \frac{c}{f}$$

1. **¿De dónde sale (Origen Físico)?**  
   Parte de las ecuaciones de Maxwell en el vacío/aire sin cargas ni corrientes libres ($\rho = 0, \vec{J} = 0$):
   - Ley de Faraday: $\nabla \times \vec{E} = -\frac{\partial \vec{B}}{\partial t}$
   - Ley de Ampère-Maxwell: $\nabla \times \vec{B} = \mu_0\varepsilon_0\frac{\partial \vec{E}}{\partial t}$
   Aplicando el rotacional a la Ley de Faraday ($\nabla \times (\nabla \times \vec{E}) = -\nabla^2 \vec{E}$) y sustituyendo la Ley de Ampère-Maxwell, se obtiene la ecuación de onda tridimensional cuya velocidad de propagación es $c = 1/\sqrt{\mu_0\varepsilon_0}$.
2. **Significado de cada símbolo y unidades:**
   - $\mu_0 = 4\pi \times 10^{-7}\text{ H/m}$: Permeabilidad magnética del vacío.
   - $\varepsilon_0 = 8.8541878 \times 10^{-12}\text{ F/m}$: Permitividad eléctrica del vacío.
   - $f$ ($\text{Hz} = \text{s}^{-1}$): Frecuencia de oscilación de la onda ($2.4\times 10^9\text{ Hz}$ en UHF y $5.0\times 10^9\text{ Hz}$ en SHF).
   - $\lambda$ ($\text{m}$ o $\text{cm}$): Longitud de onda (distancia física entre dos crestas consecutivas del campo eléctrico).
3. **Resolución numérica exacta:**
   - **Banda UHF ($2.4\text{ GHz}$):** $\lambda_{2.4} = \frac{2.9979\times 10^8\text{ m/s}}{2.4\times 10^9\text{ s}^{-1}} = 0.12491\text{ m} \approx \mathbf{12.5\text{ cm}}$.
   - **Banda SHF ($5.0\text{ GHz}$):** $\lambda_{5.0} = \frac{2.9979\times 10^8\text{ m/s}}{5.0\times 10^9\text{ s}^{-1}} = 0.05996\text{ m} \approx \mathbf{6.0\text{ cm}}$.
4. **¿Por qué y cómo se usa en nuestro programa?**
   - **En `src/servicios.ts` (líneas 13, 42–44 y 51):** Calcula $\lambda$ en metros para determinar el área de captura de la antena receptora ($A_{\text{eff}} = \lambda^2 / 4\pi$).
   - **En `src/controlador.ts` (líneas 186–190):** Como la onda de $5.0\text{ GHz}$ tiene una longitud de onda más corta ($6.0\text{ cm}$), sufre mayor absorción dieléctrica dentro de los muros (`multiplier = 0.50`) que la onda de $2.4\text{ GHz}$ (`multiplier = 0.20`).

---

### Fórmula 2: Potencia Isotrópica Radiada Equivalente ($\text{PIRE}$) y Condición de Dirichlet en el Emisor

$$\text{PIRE}_{[\text{dBm}]} = P_{\text{tx}\,[\text{dBm}]} + G_{[\text{dBi}]}, \qquad u(x_r, y_r) = P_{\text{router}} \times 2.25 \quad (\texttt{fixed = true})$$

1. **¿De dónde sale?**  
   En ingeniería de radiofrecuencia, la potencia total efectiva radiada en la dirección de máxima ganancia respecto a un radiador isotrópico es el producto lineal $P_{\text{tx}} \cdot G$. En escala logarítmica ($\text{dB}$), el producto se convierte en la suma $P_{\text{tx}\,[\text{dBm}]} + G_{[\text{dBi}]}$.
2. **¿Por qué y cómo se usa en nuestro programa (`src/controlador.ts`, líneas 24–77 y 196–200)?**  
   Define la intensidad de la fuente en los 4 modelos reales del simulador (*TP-Link Archer C60*, *Ubiquiti UniFi U6 Pro*, *ASUS ROG GT-AX11000*, *Google Nest Wifi*). En `buildInitialGrid`, la celda $(x_r, y_r)$ del router se marca con `fixed = true` (condición de frontera de Dirichlet activa), impidiendo que su valor decaiga durante las iteraciones numéricas.

---

### Fórmula 3: Conversión entre Potencial Normalizado ($u$), Decibelios ($\text{dBm}$) y Potencia Lineal ($\text{mW}, \text{W}$)

$$P_{\text{rx}\,[\text{dBm}]} = -85 + \left(\frac{u_{i,j}}{100}\right)\times 60, \qquad P_{\text{rx}\,[\text{mW}]} = 10^{\left(P_{\text{rx}\,[\text{dBm}]}/10\right)}, \qquad P_{\text{rx}\,[\text{W}]} = 10^{-3}\,P_{\text{rx}\,[\text{mW}]}$$

1. **¿De dónde sale y cómo se despeja?**  
   La definición internacional de decibelio-milivatio es:
   $$P_{[\text{dBm}]} = 10\,\log_{10}\!\left(\frac{P_{[\text{mW}]}}{1\text{ mW}}\right)$$
   Para despejar la potencia física lineal:
   1. Se divide por $10$: $\frac{P_{[\text{dBm}]}}{10} = \log_{10}(P_{[\text{mW}]})$.
   2. Se aplica la exponencial base $10$ en ambos miembros: $P_{[\text{mW}]} = 10^{(P_{[\text{dBm}]}/10)}$.
   3. Se multiplica por $10^{-3}$ para convertir milivatios a vatios ($\text{W}$) en el Sistema Internacional.
2. **¿Por qué y cómo se usa en nuestro programa (`src/servicios.ts`, líneas 21–26 y 47–48)?**  
   El método de Diferencias Finitas opera sobre una variable adimensional bien condicionada $u_{i,j} \in [0, 100]$. La función `convertirADbm(val)` mapea $u = 0\%$ al piso de ruido térmico ($-85\text{ dBm}$) y $u = 100\%$ a la potencia máxima cercana al emisor ($-25\text{ dBm}$), y luego despeja `powerW` en vatios para poder calcular el Vector de Poynting.

---

### Fórmula 4: Apertura Efectiva Isotrópica ($A_{\text{eff}}$) y Magnitud Media del Vector de Poynting ($\langle S \rangle$)

$$\vec{S} = \vec{E} \times \vec{H}, \qquad A_{\text{eff}} = \frac{\lambda^2}{4\pi}, \qquad \langle S \rangle = \frac{P_{\text{rx}}}{A_{\text{eff}}} = \frac{4\pi\,P_{\text{rx}}}{\lambda^2} \quad \left[\frac{\text{W}}{\text{m}^2}\right]$$

1. **¿De dónde sale (Teorema de Poynting y Ecuación de Friis)?**  
   - Del **Teorema de Conservación de Poynting**:
     $$-\nabla \cdot (\vec{E} \times \vec{H}) = \frac{\partial}{\partial t}\!\left(\frac{1}{2}\varepsilon E^2 + \frac{1}{2}\mu H^2\right) + \sigma E^2$$
     se demuestra que $\vec{S} = \vec{E} \times \vec{H}$ es el flujo de potencia por unidad de área ($\text{W/m}^2$).
   - Por reciprocidad electromagnética de antenas, un receptor isotrópico ideal ($G_{\text{rx}} = 1$) intercepta la energía que cruza un área efectiva $A_{\text{eff}} = \frac{\lambda^2}{4\pi}$ ($\text{m}^2$).
   - Como la potencia captada es $P_{\text{rx}} = \langle S \rangle \cdot A_{\text{eff}}$, al despejar $\langle S \rangle$ obtenemos $\langle S \rangle = \frac{4\pi P_{\text{rx}}}{\lambda^2}$.
2. **¿Por qué y cómo se usa en nuestro programa (`src/servicios.ts`, líneas 50–55)?**  
   Convierte la potencia puntual de cada celda (`powerW`) en densidad superficial de energía electromagnética (`poyntingUwM2` en $\mu\text{W/m}^2$), permitiendo cuantificar el transporte real de energía radiante en cualquier coordenada de la habitación.

---

### Fórmula 5: Impedancia Intrínseca del Espacio Libre ($\eta_0$) y Campos Eficaces Eléctrico ($E_{\text{rms}}$) y Magnético ($H_{\text{rms}}$)

$$\eta_0 = \sqrt{\frac{\mu_0}{\varepsilon_0}} \approx 376.73\,\Omega, \qquad \langle S \rangle = \frac{E_{\text{rms}}^2}{\eta_0} \implies E_{\text{rms}} = \sqrt{\eta_0\,\langle S \rangle} \quad [\text{V/m}], \qquad H_{\text{rms}} = \frac{E_{\text{rms}}}{\eta_0} \quad [\text{A/m}]$$

1. **¿De dónde sale el factor $\frac{1}{2}$ y el valor eficaz $\text{rms}$?**  
   En una onda plana armónica $E(x,t) = E_0\cos(kx-\omega t)$ y $H(x,t) = \frac{E_0}{\eta_0}\cos(kx-\omega t)$, la magnitud instantánea de Poynting es:
   $$S(t) = E(t)H(t) = \frac{E_0^2}{\eta_0}\cos^2(kx - \omega t)$$
   Al promediar en un periodo completo $T$, dado que $\frac{1}{T}\int_0^T \cos^2(\omega t)\,dt = \frac{1}{2}$, resulta:
   $$\langle S \rangle = \frac{E_0^2}{2\,\eta_0}$$
   Como el valor cuadrático medio (eficaz) de una sinusoide es $E_{\text{rms}} = \frac{E_0}{\sqrt{2}} \implies E_{\text{rms}}^2 = \frac{E_0^2}{2}$, al sustituir queda $\langle S \rangle = \frac{E_{\text{rms}}^2}{\eta_0}$. Despejando $E_{\text{rms}}$ obtenemos $E_{\text{rms}} = \sqrt{\eta_0\langle S \rangle}$.
2. **¿Por qué y cómo se usa en nuestro programa (`src/servicios.ts`, líneas 14 y 57–61)?**  
   Determina en cada nodo de la malla la intensidad del campo eléctrico en voltios por metro (`electricFieldVm`) y del campo magnético en miliamperios por metro (`magneticFieldMam`), mostrados en tiempo real en el inspector inferior de `NetworkGrid.tsx` y en la gráfica de validación de `GraphPanel.tsx`.

---

### Fórmula 6: Constante de Atenuación ($\alpha$), Ley de Beer-Lambert y Profundidad Pelicular ($\delta$)

$$\alpha = \omega\sqrt{\frac{\mu\varepsilon}{2}\left[\sqrt{1+\left(\frac{\sigma}{\omega\varepsilon}\right)^2}-1\right]}, \qquad E(x) = E_0\,e^{-\alpha x}, \qquad \delta = \frac{1}{\alpha} \approx \sqrt{\frac{2}{\omega\mu_0\sigma}}$$

1. **¿De dónde sale?**  
   Al resolver las ecuaciones de Maxwell dentro de un material con permitividad $\varepsilon = \varepsilon_r\varepsilon_0$ y conductividad $\sigma > 0$, el número de onda se vuelve complejo. Su parte imaginaria $\alpha$ produce el decaimiento exponencial de la amplitud del campo al penetrar un espesor $x$ (**Ley de Beer-Lambert**). En un buen conductor como el metal ($\sigma = 3.5\times 10^7\text{ S/m} \gg \omega\varepsilon$), la onda solo penetra una distancia microscópica llamada **espesor pelicular (*skin depth*)** $\delta \approx 1.3\,\mu\text{m}$ a $2.4\text{ GHz}$, produciendo el efecto de **Jaula de Faraday**.
2. **¿Por qué y cómo se usa en nuestro programa (`src/controlador.ts`, líneas 84–135 y 177–194)?**  
   Asigna a cada celda muro su coeficiente discreto de absorción:
   $$\alpha_{i,j} = \alpha_{\text{material}} \times M_{\text{frecuencia}} \times \left(\frac{h}{0.5\text{ m}}\right)$$
   basado en los parámetros internacionales de la recomendación **ITU-R P.2040**.

---

### Fórmula 7: EDP Estacionaria de Difusión-Absorción y Deducción por Series de Taylor del Esténcil de 5 Puntos

$$\nabla^2 u(x,y) - \kappa^2(x,y)\,u(x,y) = 0 \quad \xrightarrow{\text{Taylor } O(h^2)} \quad u_{i,j}^{\text{GS}} = \big(1 - \alpha_{i,j}\big)\,\left(\frac{u_{i+1,j} + u_{i-1,j} + u_{i,j+1} + u_{i,j-1}}{4}\right)$$

1. **Deducción paso a paso por Series de Taylor (lista para escribir en el tablero):**
   - Expandimos $u(x+h, y)$ y $u(x-h, y)$:
     $$u_{i+1,j} = u_{i,j} + h\frac{\partial u}{\partial x} + \frac{h^2}{2}\frac{\partial^2 u}{\partial x^2} + \frac{h^3}{6}\frac{\partial^3 u}{\partial x^3} + O(h^4)$$
     $$u_{i-1,j} = u_{i,j} - h\frac{\partial u}{\partial x} + \frac{h^2}{2}\frac{\partial^2 u}{\partial x^2} - \frac{h^3}{6}\frac{\partial^3 u}{\partial x^3} + O(h^4)$$
   - Sumando ambas se cancelan las derivadas impares y se despeja:
     $$\frac{\partial^2 u}{\partial x^2} \approx \frac{u_{i+1,j} - 2u_{i,j} + u_{i-1,j}}{h^2}, \qquad \frac{\partial^2 u}{\partial y^2} \approx \frac{u_{i,j+1} - 2u_{i,j} + u_{i,j-1}}{h^2}$$
   - Sustituyendo en $\frac{\partial^2 u}{\partial x^2} + \frac{\partial^2 u}{\partial y^2} - \kappa_{i,j}^2 u_{i,j} = 0$ y multiplicando por $h^2$:
     $$(u_{i+1,j} + u_{i-1,j} + u_{i,j+1} + u_{i,j-1}) - (4 + h^2\kappa_{i,j}^2)\,u_{i,j} = 0$$
   - Despejando $u_{i,j}$ con $1 - \alpha_{i,j} = \frac{1}{1 + h^2\kappa_{i,j}^2/4}$:
     $$u_{i,j}^{\text{GS}} = \big(1 - \alpha_{i,j}\big)\,\frac{u_{i+1,j} + u_{i-1,j} + u_{i,j+1} + u_{i,j-1}}{4}$$
2. **¿Por qué y cómo se usa en nuestro programa (`src/metodos/jacobi.ts`, `gauss-seidel.ts`, `sor.ts`)?**  
   Transforma la ecuación diferencial continua en una regla algebraica local que el computador puede iterar sobre cualquier geometría de muros.

---

### Fórmula 8: Esquemas Iterativos (Jacobi, Gauss-Seidel y SOR), Factor Óptimo ($\omega_{\text{ópt}}$) y Norma Infinito ($\|r^{(k)}\|_\infty$)

$$u_{i,j}^{(k+1)} = (1 - \omega)\,u_{i,j}^{(k)} + \omega\,u_{i,j}^{\text{GS}}, \qquad \omega_{\text{ópt}} = \frac{2}{1 + \sqrt{1 - \rho_{\text{Jacobi}}^2}}, \qquad \|r^{(k)}\|_\infty = \max_{i,j}\left|u_{i,j}^{(k+1)} - u_{i,j}^{(k)}\right| < \varepsilon$$

1. **¿De dónde sale y por qué $0 < \omega < 2$?**  
   Por el **Teorema de Kahan y Ostrowski-Reich**, el radio espectral de la matriz de iteración de SOR cumple $\rho(\mathcal{L}_\omega) \ge |\omega - 1|$. Para que el error tienda a cero ($\rho < 1$), se requiere estrictamente $0 < \omega < 2$. Cuando $1 < \omega < 2$ (**Sobre-Relajación**), se extrapola el paso de Gauss-Seidel en la dirección del estado estacionario, reduciendo en un **$73.7\%$** las iteraciones respecto a Jacobi ($66$ vs. $251$ iteraciones en malla $24\times 24$ con $\omega = 1.45$).
2. **¿Por qué y cómo se usa en nuestro programa (`src/metodos/sor.ts` y `src/controlador.ts`)?**  
   Permite que la malla converja en $2.8\text{ ms}$, haciendo posible la interacción en tiempo real y el barrido paramétrico del botón *"Buscar $\omega$ Óptimo"*.

---

### Fórmula 9: Validación Analítica Log-Distancia + Multi-Muro (ITU-R P.1238), $\text{RMSE}$ y $R^2$

$$P_{\text{rx, analítico}}(d) = P_0(d_0) - 10\,n\,\log_{10}\!\left(\frac{d}{d_0}\right) - \sum_{k} L_{\text{muro}, k}(f) - L_{\text{borde}}$$

$$\text{RMSE} = \sqrt{\frac{1}{M}\sum_{m=1}^{M}\Big(P_{\text{num}}(d_m) - P_{\text{ana}}(d_m)\Big)^2} \quad [\text{dB}], \qquad R^2 = 1 - \frac{\sum_{m=1}^{M}\big(P_{\text{num}}(d_m) - P_{\text{ana}}(d_m)\big)^2}{\sum_{m=1}^{M}\big(P_{\text{num}}(d_m) - \bar{P}_{\text{num}}\big)^2}$$

1. **¿De dónde sale?**  
   Proviene de expresar en decibelios la ley de caída con la distancia de Friis ($P \propto d^{-n}$) y descontar las pérdidas acumuladas por transmisión a través de múltiples paredes según el estándar internacional **ITU-R P.1238 / COST-231**.
2. **¿Por qué y cómo se usa en nuestro programa (`src/controlador.ts`, función `validateGridPhysics`, líneas 291–433)?**  
   Es la prueba científica que demuestra que nuestro simulador es físicamente correcto ($\text{RMSE} = 1.84\text{ dB}$ y $R^2 = 0.978$), graficando lado a lado la curva numérica (FD-SOR) contra la analítica (ITU-R P.1238) tanto en $\text{dBm}$ como en $\text{V/m}$.

---

### Fórmula 10: Luminancia Perceptual ITU-R BT.601 y Optimización Espacial K-Means

$$Y_{i,j} = 0.299\,R_{i,j} + 0.587\,G_{i,j} + 0.114\,B_{i,j} < T_{\text{umbral}}, \qquad \text{Score}(r,c) = 0.60\cdot\text{Cobertura}_{\%} + 0.40\cdot\bar{u}$$

1. **¿De dónde sale?**  
   Los pesos $(0.299, 0.587, 0.114)$ provienen de la curva de sensibilidad espectral fotópica del ojo humano (CIE 1931 / **ITU-R BT.601**).
2. **¿Por qué y cómo se usa en nuestro programa (`src/traduccion.ts` líneas 22–55 y `src/interfaz.tsx` líneas 613–780)?**  
   Permite escanear cualquier plano arquitectónico subido por el usuario para detectar automáticamente los muros oscuros, y luego aplicar búsqueda exhaustiva o clustering **K-Means** para hallar la coordenada óptima de los emisores.

---

## Parte 2: Diccionario Maestro de Cada Letra, Símbolo y Variable del Proyecto

Para comprender y explicar de inmediato qué significa cada letra de cada ecuación, a continuación se detallan **todas las letras griegas, letras latinas, subíndices y operadores matemáticos** utilizados en el proyecto, indicando cómo se leen, su nombre físico/matemático, su significado exacto, su unidad en el Sistema Internacional (SI) y su nombre en el código fuente.

### 2.1 Todas las Letras Griegas Usadas en las Fórmulas

| Letra / Símbolo | Cómo se lee (Nombre de la letra) | Nombre Físico o Matemático | Significado Detallado en el Proyecto | Unidad (SI) | Variable en el Código |
| :---: | :--- | :--- | :--- | :---: | :--- |
| $\alpha$, $\alpha_{i,j}$ | **Alfa** (minúscula) | Constante de atenuación / Coeficiente de absorción | Fracción de energía que absorbe un muro dieléctrico o conductor al paso de la onda. | $\text{Np/m}$ o adimensional | `attenuation` |
| $\beta$ | **Beta** (minúscula) | Constante de fase | Cambio de fase en radianes por cada metro recorrido dentro de un material ($\gamma = \alpha + i\beta$). | $\text{rad/m}$ | — |
| $\gamma$ | **Gamma** (minúscula) | Constante de propagación compleja | Combina la atenuación ($\alpha$) y la fase ($\beta$) en un medio con pérdidas: $\gamma = \alpha + i\beta$. | $\text{m}^{-1}$ | — |
| $\delta$ | **Delta** (minúscula) | Profundidad pelicular (*Skin Depth*) | Distancia ($\delta = 1/\alpha \approx 1.3\,\mu\text{m}$ en metal) donde el campo cae al $36.8\%$, originando la **Jaula de Faraday**. | $\text{m}$ ($\mu\text{m}$) | — |
| $\Delta x, \Delta y, \Delta u$ | **Delta** (mayúscula) | Incremento o diferencia discreta | Paso espacial entre nodos ($\Delta x = \Delta y = h = 0.5\text{ m}$) o salto de potencial entre iteraciones ($\Delta u$). | $\text{m}$ o adimensional | `cellSize`, `diff` |
| $\varepsilon_0$ | **Épsilon sub cero** | Permitividad eléctrica del vacío | Capacidad intrínseca del vacío para permitir y polarizar campos eléctricos ($8.854\times 10^{-12}\text{ F/m}$). | $\text{F/m}$ | — |
| $\varepsilon_r$ | **Épsilon sub r** | Permitividad relativa (Constante dieléctrica) | Cuántas veces más se polariza un material ($\varepsilon = \varepsilon_r\varepsilon_0$) respecto al vacío (concreto: $6.5$). | Adimensional | `relativePermittivity` |
| $\varepsilon$ | **Épsilon** (minúscula) | Tolerancia de convergencia numérica | Umbral mínimo de error ($10^{-3}$ o $10^{-4}$) para detener las iteraciones cuando la malla se estabiliza. | Adimensional | `tolerance` |
| $\eta_0$ | **Eta sub cero** | Impedancia intrínseca del espacio libre | Razón entre campo eléctrico y magnético en el aire ($\eta_0 = \sqrt{\mu_0/\varepsilon_0} \approx 376.73\,\Omega$). | $\Omega$ (Ohmios) | `ETA_0` |
| $\kappa(x,y)$ | **Kappa** (minúscula) | Coeficiente espacial de absorción | Término sumidero continuo en la EDP estacionaria ($\nabla^2 u - \kappa^2 u = 0$). | $\text{m}^{-1}$ | — |
| $\lambda$ | **Lambda** (minúscula) | Longitud de onda | Distancia física entre dos crestas consecutivas de la onda ($\lambda = c/f$: $12.5\text{ cm}$ en $2.4\text{ GHz}$; $6.0\text{ cm}$ en $5.0\text{ GHz}$). | $\text{m}$ o $\text{cm}$ | `wavelengthM`, `wavelengthCm` |
| $\mu_0$ | **Mu sub cero** | Permeabilidad magnética del vacío | Capacidad del espacio libre para sostener campos magnéticos ($4\pi \times 10^{-7}\text{ H/m}$). | $\text{H/m}$ | — |
| $\mu_k = (\mu_k^x, \mu_k^y)$ | **Mu sub k** | Centroide espacial del clúster $k$ | Coordenada promedio del grupo de celdas $C_k$ donde el algoritmo K-Means ubica el router $k$. | Coordenada de malla | `centroids[k]` |
| $\pi$ | **Pi** (minúscula) | Constante geométrica circular | Razón entre circunferencia y diámetro ($\approx 3.14159$); aparece en $4\pi$ por la propagación esférica. | Adimensional | `Math.PI` |
| $\rho(\mathcal{L}_\omega), \rho_{\text{J}}$ | **Rho** (minúscula) | Radio espectral de la matriz de iteración | Mayor valor propio de la matriz iterativa. Si $\rho < 1$, el método converge; cuanto menor es $\rho$, más rápido converge. | Adimensional | — |
| $\sigma$ | **Sigma** (minúscula) | Conductividad eléctrica del material | Facilidad con la que el muro conduce corrientes que disipan la onda en calor por efecto Joule ($\sigma E^2$). | $\text{S/m}$ (Siemens/m) | `conductivitySm` |
| $\sum$ | **Sigma** (mayúscula) | Operador sumatoria | Suma ordenada de términos (pérdidas de varios muros $\sum L_{\text{muro},k}$ o suma de errores cuadráticos). | Operador | `reduce` / bucle `for` |
| $\omega, \omega_{\text{ópt}}$ | **Omega** (minúscula) | Factor de relajación (SOR) / Frecuencia angular | En SOR: peso de extrapolación $\omega \in (1,2)$ ($\omega_{\text{ópt}} \approx 1.45$). En ondas: $\omega = 2\pi f$ ($\text{rad/s}$). | Adimensional / $\text{rad/s}$ | `omega`, `optimalOmega` |
| $\Omega, \partial\Omega$ | **Omega** (mayúscula) | Dominio espacial ($\Omega$) / Borde ($\partial\Omega$) / Ohmio | Representa el área 2D de la habitación ($\Omega$), sus paredes exteriores ($\partial\Omega$) o la unidad de impedancia ($\Omega$). | $\text{m}^2$ / $\Omega$ | `isBoundary` |

---

### 2.2 Todas las Letras Latinas, Subíndices y Operadores Matemáticos

| Variable / Símbolo | Cómo se lee | Nombre Físico o Matemático | Significado Detallado en el Proyecto | Unidad (SI) | Variable en el Código |
| :---: | :--- | :--- | :--- | :---: | :--- |
| $A_{\text{eff}}$ | **A mayúscula sub eff** | Apertura o área efectiva isotrópica | Área equivalente con la que una antena receptora ideal intercepta el flujo de Poynting ($A_{\text{eff}} = \lambda^2 / 4\pi$). | $\text{m}^2$ | `aEff` |
| $\vec{B}$ | **Vector B mayúscula** | Densidad de flujo magnético (Inducción) | Campo magnético total vinculado a $\vec{H}$ mediante $\vec{B} = \mu\vec{H}$ en las leyes de Faraday y Ampère-Maxwell. | $\text{T}$ (Teslas) | — |
| $c$ | **c minúscula** | Velocidad de la luz en el vacío | Velocidad de propagación de toda onda electromagnética en el vacío ($c = 1/\sqrt{\mu_0\varepsilon_0} \approx 2.9979\times 10^8\text{ m/s}$). | $\text{m/s}$ | `C_LIGHT` |
| $C_k, \|C_k\|$ | **C mayúscula sub k** | Clúster espacial $k$ y su cardinalidad | Conjunto de celdas libres asignadas al router $k$ en K-Means, y número total de celdas en dicho grupo ($\|C_k\|$). | Celdas | `clusters[k]` |
| $d, d_0, d_m$ | **d minúscula / d sub cero** | Distancia radial euclidiana | Distancia en línea recta desde el router hasta la celda ($d$), distancia de referencia ($d_0 = 0.5\text{ m}$) y anillo radial $m$. | $\text{m}$ | `distM`, `d0` |
| $\vec{E}, E_0, E_{\text{rms}}$ | **E mayúscula / E sub rms** | Campo eléctrico (vector, pico y eficaz) | Fuerza eléctrica de la onda por unidad de carga; $E_{\text{rms}} = E_0/\sqrt{2} = \sqrt{\eta_0\langle S\rangle}$ es el valor eficaz medible. | $\text{V/m}$ | `electricFieldVm` |
| $e$ | **e minúscula** | Número de Euler ($\approx 2.71828$) | Base del decaimiento exponencial de la onda al atravesar un espesor $x$ de material ($E(x) = E_0 e^{-\alpha x}$). | Adimensional | `Math.exp` |
| $f, T$ | **f minúscula / T mayúscula** | Frecuencia de oscilación y Periodo | Ciclos por segundo de la onda ($2.4\text{ GHz}$ ó $5.0\text{ GHz}$) y tiempo que dura un ciclo ($T = 1/f$). | $\text{Hz}$ ($\text{s}^{-1}$) y $\text{s}$ | `frequency`, `freqHz` |
| $G$ | **G mayúscula** | Ganancia directiva de la antena | Capacidad de la antena para concentrar la potencia radiada respecto a un radiador isotrópico ideal. | $\text{dBi}$ | `antennaGainDbi` |
| $\vec{H}, H_0, H_{\text{rms}}$ | **H mayúscula / H sub rms** | Intensidad de campo magnético (vector y eficaz) | Componente magnética de la onda electromagnética; su valor eficaz es $H_{\text{rms}} = E_{\text{rms}}/\eta_0$. | $\text{A/m}$ o $\text{mA/m}$ | `magneticFieldMam` |
| $h$ | **h minúscula** | Tamaño de paso espacial de la malla | Longitud física del lado de cada celda cuadrada en la discretización en Diferencias Finitas ($0.5\text{ m}$). | $\text{m}$ | `cellSize` |
| $i, j$ | **i, j minúsculas** | Índices discretos de fila y columna | Posición entera de una celda en la matriz ($i$ recorre las filas verticales, $j$ recorre las columnas horizontales). | Enteros | `i, j` o `r, c` |
| $(k), (k+1)$ | **Superíndice k entre paréntesis** | Índice del paso de iteración numérica | Indica si el valor de la celda corresponde al barrido anterior $(k)$ (`currentGrid`) o al barrido nuevo $(k+1)$ (`nextGrid`). | Iteración | `iterations` |
| $L_{\text{muro},k}, L_{\text{borde}}$ | **L mayúscula sub muro / borde** | Pérdida por penetración en muros y borde | Caída de potencia en decibelios ($\text{dB}$) al atravesar la pared $k$ ($3\text{ dB}$ yeso, $8\text{ dB}$ ladrillo, $15\text{ dB}$ concreto). | $\text{dB}$ | `totalWallLossDb` |
| $N, M$ | **N y M mayúsculas** | Tamaño de la malla ($N$) y muestras radiales ($M$) | $N$: cantidad de celdas por lado ($24\times 24$); $M$: cantidad de distancias radiales evaluadas en la validación ITU-R. | Enteros | `gridSize`, `points.length` |
| $n$ | **n minúscula** | Exponente de pérdida de propagación | Velocidad con que decae la potencia con la distancia en interiores ($n = 2.25$ en $2.4\text{ GHz}$; $n = 2.45$ en $5.0\text{ GHz}$). | Adimensional | `pathLossExponent` |
| $\text{PIRE}$ ($\text{EIRP}$) | **Sigla PIRE** | Potencia Isotrópica Radiada Equivalente | Suma de la potencia del transmisor más la ganancia de su antena ($\text{PIRE} = P_{\text{tx}} + G$). | $\text{dBm}$ | — |
| $P_{\text{tx}}, P_{\text{rx}}, P_0$ | **P mayúscula sub tx / rx / 0** | Potencia transmitida, recibida y de referencia | Energía por unidad de tiempo emitida por el router ($P_{\text{tx}}$), captada en una celda ($P_{\text{rx}}$) o medida a $d_0$ ($P_0$). | $\text{dBm}$, $\text{mW}$, $\text{W}$ | `dbm`, `powerMw`, `powerW` |
| $P_{\text{num}}, P_{\text{ana}}, \bar{P}_{\text{num}}$ | **P sub num, sub ana y P barra** | Potencia numérica, analítica y media | Nivel en $\text{dBm}$ calculado por nuestra malla FD-SOR ($P_{\text{num}}$), por la ecuación ITU-R ($P_{\text{ana}}$) y su promedio ($\bar{P}_{\text{num}}$). | $\text{dBm}$ | `numericalDbm`, `analyticalDbm` |
| $\text{RMSE}, R^2$ | **Sigla RMSE y R cuadrado** | Error cuadrático medio y Coeficiente de determinación | Miden la desviación media en decibelios ($\text{RMSE} = 1.84\text{ dB}$) y el ajuste estadístico ($R^2 = 0.978$) frente al modelo ITU-R. | $\text{dB}$ y $[0,1]$ | `rmseDb`, `rSquared` |
| $\vec{S}, \langle S \rangle$ | **Vector S y S entre corchetes** | Vector de Poynting instantáneo y medio temporal | Flujo superficial de potencia electromagnética ($\vec{S} = \vec{E}\times\vec{H}$) y su promedio por ciclo ($\langle S \rangle = 4\pi P_{\text{rx}}/\lambda^2$). | $\text{W/m}^2$ ($\mu\text{W/m}^2$) | `poyntingWm2`, `poyntingUwM2` |
| $u(x,y), u_{i,j}, u_{i,j}^{\text{GS}}$ | **u minúscula / u superíndice GS** | Potencial normalizado de intensidad energética | Variable adimensional ($0$ a $100$) que resuelve la EDP en cada celda $(i,j)$, y su estimación intermedia de Gauss-Seidel ($u^{\text{GS}}$). | Escala $[0, 100]$ | `cell.val`, `uGS` |
| $x, y, t$ | **x, y, t minúsculas** | Coordenadas espaciales 2D y tiempo | Posición horizontal ($x$), vertical ($y$) en metros dentro del recinto, e instante de tiempo ($t$) en segundos. | $\text{m}$ y $\text{s}$ | `x, y` |
| $Y_{i,j}, R_{i,j}, G_{i,j}, B_{i,j}$ | **Letras Y, R, G, B mayúsculas** | Luminancia perceptual y canales Rojo, Verde, Azul | Brillo en escala de grises ($Y = 0.299R + 0.587G + 0.114B$, de $0$ a $255$) usado para detectar muros en imágenes de planos. | $[0, 255]$ | `brightness`, `red`, `green`, `blue` |
| $\nabla, \nabla\cdot, \nabla\times, \nabla^2$ | **Operador Nabla y Laplaciano** | Gradiente ($\nabla$), Divergencia ($\nabla\cdot$), Rotacional ($\nabla\times$) y Laplaciano ($\nabla^2$) | Operadores de derivadas espaciales; $\nabla^2 u = \frac{\partial^2 u}{\partial x^2} + \frac{\partial^2 u}{\partial y^2}$ mide la difusión espacial 2D de la energía. | $\text{m}^{-1}$ / $\text{m}^{-2}$ | Esténcil de 4 vecinos |
| $\|r^{(k)}\|_\infty$ | **Norma infinito de r superíndice k** | Norma infinito (máximo) del vector residuo | El mayor cambio absoluto $\max_{i,j}|u_{i,j}^{(k+1)} - u_{i,j}^{(k)}|$ observado en toda la malla durante la iteración $k$. | Escala $[0, 100]$ | `maxError`, `finalError` |

---

## Parte 3: Guion Maestro para Exponer el Póster Bloque por Bloque (Ordenado Según la Estructura Exacta del Póster $80 \times 120\text{ cm}$)

### Mapa Mental Rápido (El Orden de tus Ideas en 7 Pasos Siguiendo el Póster)
1. **Encabezado y Resumen (Arriba):** Quién eres, qué fenómeno físico estudias (ondas UHF $2.4\text{ GHz}$ y SHF $5.0\text{ GHz}$ dentro de recintos con muros) y qué resuelve tu software.
2. **Bloque 1 — Introducción y Motivación (Izquierda arriba):** Por qué las fórmulas de espacio libre fallan cuando hay paredes ($\varepsilon_r, \sigma$) y cuál es el objetivo general.
3. **Bloque 2 — Marco Teórico y Ecuaciones (1) y (2) (Izquierda centro-arriba):** Cómo se conectan la potencia $P_{\text{rx}}$, el Vector de Poynting $\langle S \rangle$ y el campo eléctrico $E_{\text{rms}}$ (Ec. 1), y cuál es la Ecuación Diferencial Parcial estacionaria $\nabla^2 u - \kappa^2 u = 0$ con fronteras de Dirichlet (Ec. 2).
4. **Bloque 3 — Sistema Modelado y Tabla 1 (Izquierda centro-abajo):** La malla de $24\times 24$ nodos ($12\text{ m}\times 12\text{ m}$, $h = 0.5\text{ m}$) y las propiedades de los 5 materiales (aire, yeso, ladrillo, concreto y metal) según ITU-R P.2040.
5. **Bloque 4 — Metodología Computacional y Ecuaciones (3) y (4) (Izquierda abajo):** Cómo funciona el promedio de los 4 vecinos en Diferencias Finitas (Ec. 3), cómo acelera el método SOR con el factor $\omega$ (Ec. 4) y cómo se valida con la fórmula ITU-R P.1238.
6. **Bloque 5 — Resultados: Figura 1, Figura 2 y Tabla 2 (Columna Derecha):**
   - *Figura 1:* Comparación $2.4\text{ GHz}$ vs $5.0\text{ GHz}$ en concreto y el efecto **Jaula de Faraday** en metal.
   - *Figura 2 y Tabla 2:* Validación analítica ($\text{RMSE} = 1.84\text{ dB}$, $R^2 = 0.978$) y rapidez de SOR ($66$ iteraciones, $73.7\%$ menos que Jacobi).
7. **Bloque 6 — Conclusiones y Cierre (Derecha abajo):** Síntesis de los 3 hallazgos principales y paso a las preguntas del jurado.

---

### Guion Detallado Bloque por Bloque (Qué Señalar en el Póster y Qué Decir)

#### PASO 1: Encabezado, Título y Resumen (Tiempo: `0:00 – 0:45`)
- **📍 Qué señalar en el póster:** Señala la franja superior del póster (el título y el recuadro de Resumen).
- **💡 Idea clave:** Presentarte con seguridad, mencionar a la profesora tutora y dejar claro que el proyecto es de **Física Electromagnética Computacional**, no solo de informática.
- **🗣️ Qué decir:**
  > «Buenos días, estimado jurado. Mi nombre es **Juan David Conde Duarte**, estudiante de Ingeniería de Sistemas, y presento el proyecto titulado **“Modelado computacional de la propagación e intensidad de campo electromagnético UHF/SHF en recintos con materiales dieléctricos”**, desarrollado bajo la tutoría de la profesora **Gladys Liliana Bautista Wilches** en la asignatura de Electromagnetismo, en la modalidad **Computacional**.  
  > Como se sintetiza en el **Resumen** superior del póster, este trabajo resuelve numéricamente cómo se propaga y se atenúa una onda electromagnética en las bandas **UHF de $2.4\text{ GHz}$** (con longitud de onda $\lambda = 12.5\text{ cm}$) y **SHF de $5.0\text{ GHz}$** ($\lambda = 6.0\text{ cm}$) cuando interactúa con muros dieléctricos y conductores dentro de una edificación.»

---

#### PASO 2: Columna Izquierda — 1. Introducción y Motivación (Tiempo: `0:45 – 1:20`)
- **📍 Qué señalar en el póster:** Señala el **Bloque 1 (Introducción y motivación)** arriba a la izquierda.
- **💡 Idea clave:** Explicar **el problema físico** (la onda pierde energía por dos causas: porque se abre en el espacio y porque los muros la absorben) y **el objetivo**.
- **🗣️ Qué decir:**
  > «Pasando al **primer bloque de Introducción y Motivación**, cuando una onda electromagnética viaja dentro de un recinto cerrado, su energía disminuye por dos fenómenos físicos simultáneos: primero, por la **divergencia geométrica** del frente de onda al alejarse de la fuente; y segundo, por la **absorción dieléctrica y disipación óhmica** al atravesar paredes con permitividad relativa $\varepsilon_r$ y conductividad eléctrica $\sigma$.  
  > Las fórmulas analíticas clásicas de espacio libre sólo sirven en el vacío sin obstáculos. Por eso, nuestro **objetivo general** fue modelar y validar numéricamente en 2D la potencia recibida $P_{\text{rx}}$, el **Vector de Poynting** $\langle S \rangle$ y el **campo eléctrico eficaz** $E_{\text{rms}}$ usando el método de Diferencias Finitas y Sobre-Relajación Sucesiva (SOR).»

---

#### PASO 3: Columna Izquierda — 2. Marco Teórico y Ecuaciones (1) y (2) (Tiempo: `1:20 – 2:15`)
- **📍 Qué señalar en el póster:** Señala el **Bloque 2 (Marco teórico / Modelo físico)** y apunta directamente a la **Ecuación (1)** y luego a la **Ecuación (2)**.
- **💡 Idea clave:** Explicar qué significa cada letra de la Ecuación (1) (Poynting y campo eléctrico) y de la Ecuación (2) (la ecuación diferencial parcial en 2D).
- **🗣️ Qué decir:**
  > «En el **segundo bloque, Marco Teórico**, formulamos las dos ecuaciones físicas que gobiernan nuestro simulador:  
  > En la **Ecuación (1)** relacionamos las magnitudes electromagnéticas en cada punto del aire, cuya impedancia intrínseca es **eta sub cero** ($\eta_0 = \sqrt{\mu_0/\varepsilon_0} \approx 376.7\,\Omega$):
  > $$\langle S \rangle = \frac{E_{\text{rms}}^2}{\eta_0} = \frac{4\pi\,P_{\text{rx}}}{\lambda^2} \implies E_{\text{rms}} = \sqrt{\frac{4\pi\,\eta_0\,P_{\text{rx}}}{\lambda^2}}, \qquad H_{\text{rms}} = \frac{E_{\text{rms}}}{\eta_0}$$
  > Aquí, $\langle S \rangle$ es la magnitud media temporal del **Vector de Poynting** en $\text{W/m}^2$ (que mide cuánta potencia electromagnética cruza cada metro cuadrado), $P_{\text{rx}}$ es la potencia captada por una antena isotrópica de área efectiva $A_{\text{eff}} = \lambda^2/(4\pi)$, $\lambda$ es la longitud de onda, $E_{\text{rms}}$ es el **campo eléctrico eficaz** en voltios por metro ($\text{V/m}$) y $H_{\text{rms}}$ es el **campo magnético eficaz** en amperios por metro ($\text{A/m}$).  
  > Cuando la onda atraviesa un muro, decae exponencialmente según la **Ley de Beer-Lambert** ($E(x) = E_0 e^{-\alpha x}$). Para calcular la distribución estacionaria de energía en todo el plano 2D, planteamos la **Ecuación (2)**, que es una ecuación diferencial parcial elíptica de difusión-absorción sobre la envolvente normalizada $u(x,y)$:
  > $$\nabla^2 u(x,y) - \kappa^2(x,y)\,u(x,y) = 0$$
  > donde el Laplaciano $\nabla^2 u = \frac{\partial^2 u}{\partial x^2} + \frac{\partial^2 u}{\partial y^2}$ modela cómo se esparce espacialmente la energía en 2D y el término $-\kappa^2(x,y)u$ representa la absorción local en cada muro, aplicando **condiciones de frontera de Dirichlet** fijas en el emisor y absorbentes nulas ($u=0$) en el borde exterior.»

---

#### PASO 4: Columna Izquierda — 3. Descripción del Sistema y Tabla 1 (Tiempo: `2:15 – 2:45`)
- **📍 Qué señalar en el póster:** Señala el **Bloque 3** y recorre con el dedo las filas de la **Tabla 1**.
- **💡 Idea clave:** Mostrar que los materiales no son inventados, sino tomados de la norma internacional **ITU-R P.2040** con su permitividad $\varepsilon_r$ y conductividad $\sigma$.
- **🗣️ Qué decir:**
  > «En el **tercer bloque, Descripción del Sistema Modelado**, nuestro software **SimuNet Física** divide un recinto de $12\text{ m} \times 12\text{ m}$ en una malla de $24 \times 24$ nodos, donde cada celda mide $h = 0.5\text{ m}$.  
  > En la **Tabla 1** parametrizamos cinco medios constructivos reales siguiendo la recomendación internacional **ITU-R P.2040**: desde el **aire** ($\varepsilon_r \approx 1, \sigma = 0$), pasando por dieléctricos con pérdidas crecientes como el **yeso** ($\varepsilon_r = 2.8, 3\text{ dB}$), el **ladrillo** ($\varepsilon_r = 4.5, 8\text{ dB}$) y el **concreto** ($\varepsilon_r = 6.5, \sigma = 0.085\text{ S/m}, 15\text{ dB}$), hasta llegar al **metal** ($\sigma = 3.5\times 10^7\text{ S/m}$), que actúa como conductor casi perfecto.»

---

#### PASO 5: Columna Izquierda — 4. Metodología Computacional y Ecuaciones (3) y (4) (Tiempo: `2:45 – 3:30`)
- **📍 Qué señalar en el póster:** Señala el **Bloque 4 (Metodología computacional)** abajo a la izquierda, apuntando a la **Ecuación (3)** y la **Ecuación (4)**.
- **💡 Idea clave:** Explicar cómo el computador resuelve la ecuación diferencial usando los 4 vecinos (Ec. 3) y por qué el método SOR con $\omega$ es tan rápido (Ec. 4).
- **🗣️ Qué decir:**
  > «En el **cuarto bloque, Metodología Computacional**, aproximamos las segundas derivadas del Laplaciano mediante series de Taylor de segundo orden, obteniendo el esquema en **Diferencias Finitas de 5 puntos** de la **Ecuación (3)**:
  > $$u_{i,j}^{\text{GS}} = \big(1 - \alpha_{i,j}\big)\,\frac{u_{i+1,j} + u_{i-1,j} + u_{i,j+1} + u_{i,j-1}}{4}$$
  > Es decir, el potencial de cada celda $(i,j)$ es el promedio aritmético de sus 4 celdas vecinas ortogonales multiplicado por el factor de transmisión $(1 - \alpha_{i,j})$ del material.  
  > Para resolver este sistema de ecuaciones acopladas en tiempo real, implementamos y comparamos Jacobi, Gauss-Seidel y **Sobre-Relajación Sucesiva (SOR)** en la **Ecuación (4)**:
  > $$u_{i,j}^{(k+1)} = (1 - \omega)\,u_{i,j}^{(k)} + \omega\,u_{i,j}^{\text{GS}}$$
  > donde $(k)$ es la iteración anterior, $(k+1)$ es la nueva iteración y **omega** ($\omega \in (1,2)$) es el factor de sobre-relajación que extrapola el paso de Gauss-Seidel hasta que el error máximo cumple $\|u^{(k+1)} - u^{(k)}\|_\infty < \varepsilon$.»

---

#### PASO 6: Columna Derecha — 5. Resultados: Figura 1, Figura 2 y Tabla 2 (Tiempo: `3:30 – 4:30`)
- **📍 Qué señalar en el póster:** Pasa a la **Columna Derecha**, señalando en orden **Figura 1(a)**, **Figura 1(b)**, **Figura 1(c)**, luego **Figura 2(a)**, **Figura 2(b)** y finalmente la **Tabla 2**.
- **💡 Idea clave:** Este es el corazón de tu calificación: demostrar 3 resultados físicos reales ($2.4$ vs $5.0\text{ GHz}$, Jaula de Faraday y validación ITU-R) y 1 resultado numérico (SOR es $73.7\%$ más rápido).
- **🗣️ Qué decir:**
  > «Pasando a la columna derecha, en el **Bloque 5 de Resultados y Discusión**, la **Figura 1** muestra los mapas bidimensionales de potencia y campo eléctrico:  
  > 1. Al comparar la **Figura 1(a) en $2.4\text{ GHz}$** con la **Figura 1(b) en $5.0\text{ GHz}$** frente a los mismos muros de concreto, demostramos físicamente que la onda de **$2.4\text{ GHz}$ penetra mucho mejor los obstáculos** porque su longitud de onda es el doble de grande ($\lambda = 12.5\text{ cm}$ frente a $6.0\text{ cm}$), mientras que en $5.0\text{ GHz}$ la absorción dieléctrica del concreto aumenta en $8.5\text{ dB}$ adicionales, dejando zonas de sombra más marcadas.  
  > 2. En la **Figura 1(c)** comprobamos el fenómeno de **Jaula de Faraday**: cuando encerramos la fuente en paredes metálicas ($\sigma = 3.5\times 10^7\text{ S/m}$), la profundidad de penetración pelicular es de apenas $\delta = \sqrt{2/(\omega\mu\sigma)} \approx 1.3\,\mu\text{m}$. Por tanto, la onda no puede atravesar el metal y el campo eléctrico afuera cae a menos de $1\text{ mV/m}$ ($-85\text{ dBm}$, piso de ruido).  
  > 3. Debajo, en la **Figura 2(a)**, validamos nuestros resultados numéricos contra el modelo analítico internacional **ITU-R P.1238**, logrando un coeficiente de correlación **$R^2 = 0.978$** y un error cuadrático medio **$\text{RMSE} = 1.84\text{ dB}$**, observándose claramente el escalón de caída de $-14\text{ dB}$ justo a los $2\text{ m}$ donde se ubica el muro de concreto.  
  > 4. Y en la **Figura 2(b)** y la **Tabla 2**, demostramos que los tres métodos (Jacobi, Gauss-Seidel y SOR) llegan exactamente al mismo estado físico estacionario a $3\text{ m}$ ($P_{\text{rx}} = -56.5\text{ dBm}$, Vector de Poynting $\langle S \rangle = 1.80\,\mu\text{W/m}^2$ y campo eléctrico $E_{\text{rms}} = 0.0260\text{ V/m}$), pero **SOR con $\omega = 1.45$ converge en sólo $66$ iteraciones ($2.8\text{ ms}$)**, reduciendo en un **$73.7\%$** las $251$ iteraciones de Jacobi.»

---

#### PASO 7: Columna Derecha — 6. Conclusiones y Demostración en Vivo (Tiempo: `4:30 – 5:00`)
- **📍 Qué señalar en el póster:** Señala el **Bloque 6 (Conclusiones)** abajo a la derecha y luego muestra la pantalla del computador con la aplicación abierta.
- **💡 Idea clave:** Cerrar con contundencia mencionando la validación física, la eficiencia de SOR y las limitaciones/trabajo futuro (que es uno de los puntos evaluados en la guía de la Feria).
- **🗣️ Qué decir:**
  > «Para finalizar, en el **Bloque 6 de Conclusiones**, destacamos tres puntos:  
  > Primero, formulamos e implementamos con éxito un modelo en Diferencias Finitas que cuantifica en cada punto del espacio la potencia recibida, el Vector de Poynting y el campo eléctrico eficaz $E_{\text{rms}}$, validado frente a la norma ITU-R P.1238 con un $97.8\%$ de correlación.  
  > Segundo, la Sobre-Relajación Sucesiva ($\text{SOR}, \omega = 1.45$) aceleró la convergencia $3.8$ veces respecto a Jacobi, permitiendo simulación interactiva en tiempo real.  
  > Y tercero, como alcance y proyección futura, dado que nuestro modelo estacionario 2D calcula la envolvente media de energía sin interferencia destructiva de fase, el siguiente paso natural es extenderlo a la ecuación de Helmholtz compleja con fronteras absorbentes PML.  
  > Aquí en el computador tengo el simulador en ejecución por si desean que probemos en vivo cualquier cambio de frecuencia, material o método numérico. Muchas gracias por su atención.»

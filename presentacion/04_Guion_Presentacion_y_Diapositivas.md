# Manual Magistral de Fórmulas, Análisis Físico, Código y Guion de Exposición Oral
**Evento:** Feria de la Física 2026 — Universidad de Pamplona  
**Título del Proyecto:** *Modelado computacional de la propagación e intensidad de campo electromagnético UHF/SHF en recintos con materiales dieléctricos*  
**Ponente:** Juan David Conde Duarte (Ingeniería de Sistemas)  
**Docente Tutora:** Gladys Liliana Bautista Wilches (Electromagnetismo)  

---

## Parte 1: Enciclopedia de Todas las Fórmulas del Proyecto (Origen, Deducción, Resolución y Uso en el Código)

Esta sección te prepara para responder **cualquier pregunta de pizarrón** que te haga un jurado de Física o Matemáticas sobre de dónde sale cada ecuación, cómo se despeja y cómo está programada en `SimuNet Física`.

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

## Parte 2: Guion Cronometrado de 5 Minutos para la Defensa Oral frente al Póster y la App

### Minuto 0:00 – 0:50 | Apertura y Fenómeno Físico Central
> «Buenos días, estimado jurado. Mi nombre es **Juan David Conde Duarte**, y presento el proyecto titulado **“Modelado computacional de la propagación e intensidad de campo electromagnético UHF/SHF en recintos con materiales dieléctricos”**, asesorado por la profesora **Gladys Liliana Bautista Wilches** en la asignatura de Electromagnetismo.  
> El fenómeno físico central que abordamos es cómo decae espacialmente la energía de una onda electromagnética en las bandas **UHF ($2.4\text{ GHz}$, longitud de onda $\lambda = 12.5\text{ cm}$)** y **SHF ($5.0\text{ GHz}$, $\lambda = 6.0\text{ cm}$)** cuando se propaga dentro de un recinto y atraviesa materiales dieléctricos con pérdidas (yeso, ladrillo, concreto) o conductores metálicos. Mientras las fórmulas analíticas de espacio libre sólo sirven en el vacío sin paredes, nuestro modelo numérico resuelve planos arquitectónicos reales.»

### Minuto 0:50 – 2:00 | Marco Físico y Fórmulas Electromagnéticas
> «En el bloque de **Marco Teórico**, partimos de la relación entre la potencia recibida $P_{\text{rx}}$ por una apertura efectiva isotrópica $A_{\text{eff}} = \frac{\lambda^2}{4\pi}$ y la magnitud media temporal del **Vector de Poynting** $\langle S \rangle$ en $\text{W/m}^2$ (Ecuación 1):
> $$\langle S \rangle = \frac{4\pi\,P_{\text{rx}}}{\lambda^2} = \frac{E_{\text{rms}}^2}{\eta_0} \implies E_{\text{rms}} = \sqrt{\eta_0\,\langle S \rangle}, \qquad H_{\text{rms}} = \frac{E_{\text{rms}}}{\eta_0}$$
> donde $\eta_0 = \sqrt{\mu_0/\varepsilon_0} \approx 376.7\,\Omega$ es la impedancia intrínseca del aire. Cuando la onda atraviesa un muro con permitividad relativa $\varepsilon_r$ y conductividad $\sigma$ (Tabla 1, recomendación ITU-R P.2040), sufre atenuación exponencial por la Ley de Beer-Lambert. En régimen estacionario 2D, modelamos la envolvente normalizada de intensidad $u(x,y)$ mediante la ecuación diferencial parcial elíptica de difusión-absorción (Ecuación 2):
> $$\nabla^2 u(x,y) - \kappa^2(x,y)\,u(x,y) = 0$$
> aplicando condiciones de frontera de **Dirichlet** fijas en la fuente emisora y absorbentes nulas en el borde exterior.»

### Minuto 2:00 – 3:10 | Metodología en Diferencias Finitas y Método SOR
> «Para resolver esta ecuación diferencial en nuestro software **SimuNet Física**, discretizamos el recinto de $12\text{ m} \times 12\text{ m}$ en una malla de $24 \times 24$ nodos ($h = 0.5\text{ m}$). Expandiendo el operador Laplaciano por series de Taylor de segundo orden, obtenemos el esquema en **Diferencias Finitas de 5 puntos** (Ecuación 3), donde cada nodo es el promedio de sus 4 vecinos ortogonales multiplicado por el factor de transmisión $(1 - \alpha_{i,j})$ del material.  
> El sistema acoplado se resuelve iterativamente comparando **Jacobi**, **Gauss-Seidel** y **Sobre-Relajación Sucesiva (SOR, Ecuación 4)**:
> $$u_{i,j}^{(k+1)} = (1 - \omega)\,u_{i,j}^{(k)} + \omega\,u_{i,j}^{\text{GS}}$$
> hasta que la norma infinito del residuo cumple $\|u^{(k+1)} - u^{(k)}\|_\infty < \varepsilon$.»

### Minuto 3:10 – 4:15 | Resultados Físicos, Jaula de Faraday y Validación Analítica
> «En la **Figura 1** del póster observamos tres resultados físicos fundamentales:  
> 1. Al comparar **(a) $2.4\text{ GHz}$** frente a **(b) $5.0\text{ GHz}$** en el mismo recinto de concreto, comprobamos que la banda de $2.4\text{ GHz}$ logra mayor penetración dieléctrica debido a su mayor longitud de onda ($12.5\text{ cm}$ vs $6.0\text{ cm}$), mientras que $5.0\text{ GHz}$ sufre $8.5\text{ dB}$ adicionales de absorción.  
> 2. En la **Figura 1(c)** verificamos el caso límite de **Jaula de Faraday** ($\sigma = 3.5\times 10^7\text{ S/m}$): como la profundidad pelicular es $\delta \approx 1.3\,\mu\text{m}$, el recinto metálico confina la onda y anula el campo eléctrico exterior ($< 1\text{ mV/m}$).  
> 3. En la **Figura 2(a)** validamos el perfil radial numérico contra el modelo analítico internacional **ITU-R P.1238**, obteniendo una correlación $R^2 = 0.978$ y un error cuadrático medio $\text{RMSE} = 1.84\text{ dB}$. Y en la **Figura 2(b)** y **Tabla 2**, demostramos que **SOR ($\omega = 1.45$)** converge en solo $66$ iteraciones ($2.8\text{ ms}$), reduciendo en un **$73.7\%$** el costo computacional frente a Jacobi ($251$ iteraciones).»

### Minuto 4:15 – 5:00 | Conclusiones y Demostración en Vivo
> «En conclusión, el modelo en diferencias finitas con relajación SOR permite cuantificar con rigor físico y en tiempo real la potencia recibida, el Vector de Poynting y el campo eléctrico eficaz en geometrías heterogéneas reales. Aquí en pantalla pueden observar el simulador interactivo donde podemos cambiar la frecuencia, el material de los muros o activar la Jaula de Faraday y ver al instante todas las magnitudes electromagnéticas. Muchas gracias y quedo atento a sus preguntas.»

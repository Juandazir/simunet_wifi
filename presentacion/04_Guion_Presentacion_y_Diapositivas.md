# Guion de Exposición Oral, Glosario de Términos y Explicación Detallada de Procesos
**Evento:** Feria de la Física 2026 — Universidad de Pamplona  
**Ponente:** Juan David Conde Duarte (Ingeniería de Sistemas)  
**Docente Tutora:** Gladys Liliana Bautista Wilches (Electromagnetismo)  

---

## Parte 1: Diccionario Explicativo de Todos los Términos del Proyecto

Antes de exponer, aquí tienes el significado exacto, sencillo y riguroso de **cada término físico, matemático y computacional** que aparece en el póster, la aplicación y las diapositivas:

### A. Términos de Electromagnetismo y Radiofrecuencia
1. **Onda Electromagnética Transversal (TEM):**  
   Perturbación formada por un campo eléctrico ($\vec{E}$) y un campo magnético ($\vec{H}$) que oscilan perpendicularmente entre sí y respecto a la dirección en que avanza la onda ($\vec{E} \perp \vec{H} \perp \text{propagación}$), viajando en el aire a la velocidad de la luz ($c \approx 3 \times 10^8\text{ m/s}$).
2. **Frecuencia ($f$ en $\text{Hz}$ o $\text{GHz}$):**  
   Número de oscilaciones completas por segundo que realiza el campo electromagnético. $1\text{ GHz} = 10^9\text{ oscilaciones/s}$ (mil millones de ciclos por segundo).
3. **Bandas UHF y SHF:**  
   - **UHF (*Ultra High Frequency* — Frecuencia Ultra Alta):** Rango de $300\text{ MHz}$ a $3\text{ GHz}$. Incluye la banda Wi-Fi de **$2.4\text{ GHz}$**.
   - **SHF (*Super High Frequency* — Frecuencia Súper Alta):** Rango de $3\text{ GHz}$ a $30\text{ GHz}$ (microondas). Incluye la banda Wi-Fi de **$5.0\text{ GHz}$**.
4. **Longitud de Onda ($\lambda = c/f$):**  
   Distancia física entre dos crestas consecutivas de la onda.
   - En $2.4\text{ GHz}$: $\lambda = \frac{3\times 10^8}{2.4\times 10^9} = 0.125\text{ m} = \mathbf{12.5\text{ cm}}$.
   - En $5.0\text{ GHz}$: $\lambda = \frac{3\times 10^8}{5.0\times 10^9} = 0.060\text{ m} = \mathbf{6.0\text{ cm}}$.
   - *Por qué importa:* Una longitud de onda más grande ($12.5\text{ cm}$) sufre menor absorción dieléctrica y atraviesa mejor los muros que una onda más corta ($6.0\text{ cm}$).
5. **Decibelio-milivatio ($\text{dBm}$):**  
   Unidad logarítmica de potencia referida a $1\text{ mW}$: $P_{\text{dBm}} = 10\log_{10}(P_{\text{mW}}/1\text{ mW})$. Es negativa en recepción porque la potencia que llega a una antena es mucho menor que $1\text{ mW}$ (por ejemplo, $-30\text{ dBm} = 10^{-3}\text{ mW}$ es señal excelente y $-85\text{ dBm} = 3.16\times 10^{-9}\text{ mW}$ es el umbral de ruido térmico).
6. **PIRE o EIRP (*Potencia Isotrópica Radiada Equivalente*):**  
   Suma de la potencia del transmisor ($P_{\text{tx}}$ en $\text{dBm}$) más la ganancia de la antena ($G$ en $\text{dBi}$): $\text{PIRE} = P_{\text{tx}} + G$. Representa la potencia efectiva con la que el router excita el nodo fuente de la malla.
7. **Área o Apertura Efectiva Isotrópica ($A_{\text{eff}} = \frac{\lambda^2}{4\pi}$):**  
   Área equivalente de captura con la que una antena receptora ideal recoge la densidad de potencia que viaja por el aire ($P_{\text{rx}} = \langle S \rangle \cdot A_{\text{eff}}$).
8. **Vector de Poynting ($\vec{S} = \vec{E} \times \vec{H}$ y su media $\langle S \rangle$ en $\text{W/m}^2$ o $\mu\text{W/m}^2$):**  
   Vector que indica la dirección de propagación de la energía electromagnética y la **densidad superficial de potencia** (cuántos vatios o microvatios atraviesan cada metro cuadrado de área).
9. **Impedancia Intrínseca del Espacio Libre ($\eta_0 \approx 376.73\,\Omega$):**  
   Relación natural entre el campo eléctrico y el campo magnético de una onda en el vacío o el aire: $\eta_0 = \sqrt{\mu_0/\varepsilon_0} \approx 376.73\,\Omega$, de modo que $E_{\text{rms}} / H_{\text{rms}} = \eta_0$.
10. **Campo Eléctrico Eficaz ($E_{\text{rms}}$ en $\text{V/m}$) y Campo Magnético Eficaz ($H_{\text{rms}}$ en $\text{mA/m}$):**  
    Las siglas $\text{rms}$ (*Root Mean Square* o valor eficaz) representan el valor cuadrático medio de la onda ($E_{\text{rms}} = E_0/\sqrt{2}$), que mide su capacidad real de transportar energía. Se calculan a partir del Vector de Poynting como $E_{\text{rms}} = \sqrt{\eta_0 \langle S \rangle}$ y $H_{\text{rms}} = E_{\text{rms}}/\eta_0$.

---

### B. Términos de Propiedades de Materiales (ITU-R P.2040)
1. **Dieléctrico con Pérdidas:**  
   Material aislante imperfecto (yeso, ladrillo, concreto) que deja pasar parcialmente la onda electromagnética pero absorbe parte de su energía.
2. **Permitividad Dieléctrica Relativa ($\varepsilon_r = \varepsilon/\varepsilon_0$):**  
   Medida de cuánto se polarizan los dipolos moleculares de un material frente al campo eléctrico. Reduce la velocidad de propagación dentro del muro ($v = c/\sqrt{\varepsilon_r}$) y causa reflexión parcial en la interfaz aire-pared.
3. **Conductividad Eléctrica Efectiva ($\sigma$ en $\text{S/m}$):**  
   Capacidad del material para conducir corrientes inducidas ($\vec{J} = \sigma\vec{E}$). Por la Ley de Joule ($p = \sigma E^2$), disipa energía electromagnética en forma de calor.
4. **Ley de Beer-Lambert y Coeficiente de Atenuación ($\alpha$):**  
   Ley de decaimiento exponencial de la onda al penetrar un medio absorbente de espesor $x$: $E(x) = E_0 e^{-\alpha x}$.
5. **Efecto Pelicular (*Skin Depth*, $\delta$) y Jaula de Faraday:**  
   En un conductor metálico ($\sigma = 3.5\times 10^7\text{ S/m}$), la onda solo penetra una distancia microscópica $\delta = \sqrt{2/(\omega\mu_0\sigma)} \approx 1.3\,\mu\text{m}$, reflejándose y anulándose por completo. Un recinto rodeado de metal bloquea el paso de ondas electromagnéticas (**Jaula de Faraday**).

---

### C. Términos Matemáticos y Computacionales
1. **Potencial Escalar Normalizado ($u(x,y) \in [0, 100]$):**  
   Variable numérica adimensional en cada celda de la malla que representa la envolvente estacionaria de intensidad energética ($0\%$ equivale a $-85\text{ dBm}$ y $100\%$ a $-25\text{ dBm}$).
2. **Operador Laplaciano ($\nabla^2 u = \frac{\partial^2 u}{\partial x^2} + \frac{\partial^2 u}{\partial y^2}$):**  
   Operador diferencial que mide cuánto difiere el valor en un punto respecto al promedio de sus vecinos inmediatos. Modela la difusión espacial en 2D.
3. **Ecuación Diferencial Parcial (EDP) Elíptica de Difusión-Absorción ($\nabla^2 u - \kappa^2 u = 0$):**  
   Ecuación estacionaria donde $\nabla^2 u$ describe la expansión geométrica de la energía en el plano y $-\kappa^2(x,y)u$ describe la energía absorbida por los muros y el aire.
4. **Condiciones de Frontera de Dirichlet:**  
   Condiciones donde el valor de la incógnita $u$ está fijo (`fixed = true`):
   - En la celda del router: $u = u_{\text{fuente}}$ (fijo según la $\text{PIRE}$).
   - En los bordes exteriores de la malla: $u = 0$ (frontera absorbente).
5. **Diferencias Finitas Centradas (Esténcil de 5 Puntos):**  
   Método que transforma la EDP continua en una ecuación algebraica sobre una rejilla de nodos $(i,j)$, donde cada celda toma el promedio de sus 4 vecinos cardinales multiplicado por $(1 - \alpha_{i,j})$.
6. **Factor de Relajación ($\omega$) en SOR:**  
   Coeficiente multiplicador ($\omega \in (1, 2)$) que extrapola el cambio entre la iteración anterior y la estimación de Gauss-Seidel para acelerar drásticamente la convergencia.
7. **Residuo Máximo ($\|r^{(k)}\|_\infty$) y Tolerancia ($\varepsilon$):**  
   El residuo $\|r^{(k)}\|_\infty = \max_{i,j} |u_{i,j}^{(k+1)} - u_{i,j}^{(k)}|$ es el mayor cambio sufrido por cualquier celda en la iteración $k$. Cuando es menor que la tolerancia $\varepsilon$ (ej. $10^{-3}$), la simulación ha convergido.
8. **$\text{RMSE}$ y $R^2$ (Métricas de Validación):**  
   - $\text{RMSE}$ (*Root Mean Square Error*): Error promedio en $\text{dB}$ entre la simulación numérica y la fórmula teórica ITU-R P.1238 ($1.84\text{ dB}$).
   - $R^2$ (*Coeficiente de Determinación*): Grado de ajuste estadístico entre ambas curvas ($0.978 = 97.8\%$ de correlación).

---

## Parte 2: Explicación Paso a Paso de los 6 Procesos Internos del Aplicativo

### Proceso 1: Digitalización de Planos Arquitectónicos (`traduccion.ts`)
1. El usuario sube una imagen de un plano o elige uno de los 3 planos predefinidos (*Apartamento*, *Laboratorio*, *Hospital*).
2. El navegador dibuja la imagen en un `<canvas>` redimensionado al tamaño exacto de la malla ($N \times N$, por ejemplo $24 \times 24$ píxeles) y extrae el arreglo `RGBA`.
3. Para cada celda $(r,c)$, calcula el brillo o luminancia perceptual según el estándar **ITU-R BT.601**:
   $$Y = 0.299\,R + 0.587\,G + 0.114\,B$$
4. Si el píxel es opaco ($\text{Alpha} > 40$) y oscuro ($Y < \text{Sensibilidad}$), lo registra como un muro del material elegido.

### Proceso 2: Construcción de la Malla Inicial (`buildInitialGrid` en `controlador.ts`)
1. Se crea la matriz de $N \times N$ celdas con escala física $h = \text{cellSize}$ metros por celda.
2. Los bordes perimetrales ($i=0, N-1$ o $j=0, N-1$) se fijan en $u = 0$ (`fixed = true`).
3. Las celdas con muros reciben su coeficiente de atenuación $\alpha_{i,j} = \alpha_{\text{material}} \times M_{\text{frecuencia}} \times (h / 0.5)$, donde $M_{\text{frecuencia}} = 0.20$ para $2.4\text{ GHz}$ y $0.50$ para $5.0\text{ GHz}$.
4. Las celdas con routers se fijan en $u = P_{\text{router}} \times 2.25$ (`fixed = true`).

### Proceso 3: Resolución Iterativa en Diferencias Finitas (`metodos/jacobi.ts`, `gauss-seidel.ts`, `sor.ts`)
En cada iteración $k \to k+1$, para cada nodo interior no fijo $(i,j)$:
1. Se suman los potenciales de sus 4 vecinos ortogonales:
   $$S_{i,j} = u_{i+1,j} + u_{i-1,j} + u_{i,j+1} + u_{i,j-1}$$
2. Se aplica la pérdida por absorción local del material en esa celda:
   $$u_{i,j}^{\text{GS}} = (1 - \alpha_{i,j})\,\frac{S_{i,j}}{4}$$
3. En **SOR**, se pondera con el valor anterior usando $\omega$:
   $$u_{i,j}^{(k+1)} = (1 - \omega)\,u_{i,j}^{(k)} + \omega\,u_{i,j}^{\text{GS}}$$
4. Se actualiza el error máximo $\|r^{(k)}\|_\infty = \max |u_{i,j}^{(k+1)} - u_{i,j}^{(k)}|$ y se repite hasta que $\|r^{(k)}\|_\infty < \varepsilon$.

### Proceso 4: Cálculo de Magnitudes Electromagnéticas (`servicios.ts`)
Una vez convergida la malla, para cada celda con valor $u_{i,j}$:
1. Se convierte a decibelios-milivatio: $\text{dBm} = -85 + 0.60\,u_{i,j}$.
2. Se pasa a vatios: $P_{\text{rx}} = 10^{(\text{dBm}-30)/10}\text{ W}$.
3. Se divide entre el área efectiva $A_{\text{eff}} = \lambda^2/(4\pi)$ para obtener el **Vector de Poynting promedio**: $\langle S \rangle = P_{\text{rx}} / A_{\text{eff}}$.
4. Se despejan el **Campo Eléctrico eficaz** $E_{\text{rms}} = \sqrt{\eta_0 \langle S \rangle}$ ($\text{V/m}$) y el **Campo Magnético eficaz** $H_{\text{rms}} = E_{\text{rms}}/\eta_0$ ($\text{A/m}$).

### Proceso 5: Validación Física contra Modelo Analítico (`validateGridPhysics` en `controlador.ts`)
1. Se calcula la distancia en metros $r$ desde cada celda libre hasta el emisor más cercano.
2. Se traza un segmento discreto entre el router y la celda para contar cuántos muros atraviesa la línea de vista y sumar sus pérdidas $\sum L_{\text{muro}}$.
3. Se evalúa la fórmula analítica **ITU-R P.1238 / Log-Distancia**:
   $$P_{\text{ana}}(r) = P_0(d_0) - 10\,n\,\log_{10}(r/d_0) - \sum L_{\text{muro}}$$
4. Se agrupan los puntos por radio $r$ para graficar ambas curvas y calcular $\text{RMSE}$, $\text{MAE}$ y $R^2$.

### Proceso 6: Optimización Espacial de Routers y de $\omega$ (`interfaz.tsx` y `ControlPanel.tsx`)
- **Para 1 Router:** Muestrea coordenadas candidatas libres, resuelve rápidamente el campo con SOR y elige la posición que maximiza $0.70 \times \text{Señal Media} + 0.30 \times \text{Cobertura}$.
- **Para $2$ a $6$ Routers:** Ejecuta el algoritmo de agrupamiento espacial **K-Means (Lloyd)** sobre todas las celdas libres durante $40$ iteraciones para distribuir los routers simétricamente y maximizar el **Índice de Uniformidad ($I.U.$)**.
- **Para $\omega$ Óptimo:** Realiza un barrido espectral probando $17$ valores de $\omega \in [1.0, 1.9]$ y selecciona automáticamente el que converge en menos iteraciones.

---

## Parte 3: Guion Palabra por Palabra para tu Exposición Oral (5 Minutos)

### 1. Saludo y Planteamiento del Fenómeno Físico (0:00 – 0:50)
> *"Buenos días/tardes, profesores y compañeros. Mi nombre es Juan David Conde Duarte, estudiante de Ingeniería de Sistemas, y bajo la tutoría de la profesora Gladys Liliana Bautista Wilches en la asignatura de Electromagnetismo, presento el trabajo en modalidad computacional titulado: **«Modelado computacional de la propagación e intensidad de campo electromagnético UHF/SHF en recintos con obstáculos dieléctricos»**.*
>
> *Nuestra motivación parte de una pregunta física cotidiana pero fundamental: ¿cómo se distribuye espacialmente la energía de una onda electromagnética de microondas —en las bandas UHF de $2.4\text{ GHz}$ ($\lambda = 12.5\text{ cm}$) y SHF de $5.0\text{ GHz}$ ($\lambda = 6.0\text{ cm}$)— dentro de una edificación cuando choca con muros de distinta permitividad dieléctrica ($\varepsilon_r$) y conductividad eléctrica ($\sigma$)? En un entorno cerrado con múltiples paredes, las fórmulas analíticas simples de espacio libre dejan de ser suficientes, por lo que desarrollamos un simulador numérico en diferencias finitas que calcula punto a punto la potencia recibida, el vector de Poynting y la intensidad de campo eléctrico eficaz."*

---

### 2. Marco Teórico y Modelo Físico Resuelto (0:50 – 2:00)
*(Señala el bloque de **Marco teórico / Modelo físico** en la columna izquierda de tu póster)*

> *"Antes de ver las gráficas, veamos qué modelo físico resolvemos:*
> 1. *Primero, en estado estacionario bidimensional, modelamos el potencial escalar normalizado de intensidad de radiación $u(x,y)$ mediante la **ecuación diferencial parcial elíptica de difusión-absorción**:*
>    $$\nabla^2 u(x,y) - \kappa^2(x,y)\,u(x,y) = 0$$
>    *donde el laplaciano $\nabla^2 u$ representa la difusión espacial de la energía y $-\kappa^2 u$ representa la absorción del medio, con **condiciones de frontera de Dirichlet**: potencial fijo en la fuente emisora proporcional a su Potencia Isotrópica Radiada Equivalente ($\text{PIRE}$), y frontera absorbente ($u = 0$) en los bordes del dominio.*
> 2. *Segundo, el término de absorción incorpora la **Ley de Beer-Lambert** ($E(x) = E_0 e^{-\alpha x}$) en medios dieléctricos con pérdidas ($\varepsilon_r, \sigma$), donde la onda cede energía por corrientes de conducción y relajación dipolar dependiendo de la frecuencia.*
> 3. *Tercero, una vez hallado el potencial en cada celda, calculamos las magnitudes físicas reales del campo electromagnético usando la densidad de potencia del **Vector de Poynting promedio** $\langle S \rangle$ y la impedancia intrínseca del aire $\eta_0 \approx 376.7\,\Omega$:*
>    $$\langle S \rangle = \frac{4\pi\,P_{\text{rx}}}{\lambda^2} = \frac{E_{\text{rms}}^2}{\eta_0} \implies E_{\text{rms}} = \sqrt{\eta_0\,\langle S \rangle} \quad [\text{V/m}], \qquad H_{\text{rms}} = \frac{E_{\text{rms}}}{\eta_0} \quad [\text{A/m}]$$"

---

### 3. Metodología: Diferencias Finitas y Método SOR (2:00 – 3:00)
*(Señala los bloques **Descripción del sistema** y **Metodología** en el póster)*

> *"¿Cómo llevamos esta ecuación diferencial al computador? Discretizamos el recinto en una malla de $N \times N$ celdas (por ejemplo, $24 \times 24$ nodos con escala física de $0.5\text{ m}$ por celda). Aplicando un **esquema de diferencias finitas centradas de 5 puntos**, el valor de cada nodo interior $(i,j)$ se obtiene promediando sus 4 vecinos ortogonales y multiplicando por el factor de transmisión local $(1 - \alpha_{i,j})$ del material presente en esa coordenada (Aire, Yeso, Ladrillo, Concreto o Metal, parametrizados según la norma ITU-R P.2040).*
>
> *Para resolver el sistema acoplado de ecuaciones lineales, implementamos y comparamos tres métodos iterativos: **Jacobi**, **Gauss-Seidel ($\omega = 1$)** y **Sobre-Relajación Sucesiva (SOR, con $1 < \omega < 2$)**. En SOR extrapolamos la dirección de convergencia mediante el factor de relajación $\omega$:*
> $$u_{i,j}^{(k+1)} = (1 - \omega)\,u_{i,j}^{(k)} + \omega\,u_{i,j}^{\text{GS}}$$
> *iterando hasta que el residuo máximo entre pasos consecutivos cae por debajo de la tolerancia $\varepsilon = 10^{-3}$."*

---

### 4. Resultados, Validación Física y Demostración en Vivo (3:00 – 4:15)
*(Señala la **Figura 1** y la **Figura 2** en la columna derecha del póster, y muestra la pantalla del aplicativo)*

> *"En la sección de Resultados destacamos tres hallazgos principales:*
> 1. **Efecto Dieléctrico, Frecuencia y Jaula de Faraday (Figura 1):** *Observamos cómo en un recinto de oficinas con muros de concreto ($\varepsilon_r = 6.5$), la banda de $2.4\text{ GHz}$ ($\lambda = 12.5\text{ cm}$) conserva mayor cobertura y campo eléctrico detrás de los obstáculos que la banda de $5.0\text{ GHz}$ ($\lambda = 6.0\text{ cm}$), la cual sufre hasta $9\text{ dB}$ más de atenuación. Además, en el caso límite de un recinto cerrado por paredes metálicas ($\sigma = 3.5\times 10^7\text{ S/m}$, espesor pelicular $\delta \approx 1.3\,\mu\text{m}$), verificamos el efecto de **Jaula de Faraday**, donde el campo eléctrico exterior cae por debajo de $1\text{ mV/m}$ ($-85\text{ dBm}$).*
> 2. **Validación Física Frente a Modelo Analítico (Figura 2a):** *Para validar que nuestros resultados son físicamente correctos, contrastamos el perfil radial numérico en función de la distancia $r$ contra la solución analítica del modelo **Log-Distancia e ITU-R P.1238**, obteniendo un coeficiente de determinación $R^2 = 0.978$ y un error cuadrático medio $\text{RMSE} = 1.84\text{ dB}$.*
> 3. **Eficiencia Computacional del Método SOR (Figura 2b):** *Al comparar la convergencia numérica, mientras que el método de Jacobi requiere $251$ iteraciones y Gauss-Seidel $138$ iteraciones, nuestro algoritmo con **SOR óptimo ($\omega = 1.45$)** converge exactamente al mismo estado estacionario en solo **$66$ iteraciones** ($2.8\text{ ms}$), logrando una reducción del **$73.7\%$** en costo computacional."*

---

### 5. Conclusiones y Cierre (4:15 – 5:00)
*(Señala el bloque de **Conclusiones** en tu póster)*

> *"En conclusión, demostramos que el método de diferencias finitas acoplado con Sobre-Relajación Sucesiva (SOR) permite modelar de forma rápida y físicamente consistente la atenuación de ondas electromagnéticas UHF y SHF en recintos heterogéneos. Como limitación propia de un modelo estacionario 2D de envolvente, no se incluyen efectos de fase por multitrayectoria ni difracción 3D, los cuales planteamos como extensión futura mediante diferencias finitas en el dominio del tiempo (FDTD) o la ecuación de Helmholtz. Muchas gracias por su atención; quedo atento a sus preguntas."*

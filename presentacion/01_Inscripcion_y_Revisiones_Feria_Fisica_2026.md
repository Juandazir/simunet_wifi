# Documento Oficial de Inscripción y Avances (Revisiones 1ª, 2ª y 3ª)
**Evento:** Feria de la Física 2026 — Departamento de Física, Universidad de Pamplona  
**Lugar:** Campus Principal — Instalaciones del Departamento de Física y Media Torta  

---

## 1. Datos Generales de Inscripción (1ª Revisión — Planteamiento)

- **Título del Proyecto:**  
  *Modelado computacional de la propagación e intensidad de campo electromagnético UHF/SHF en recintos con materiales dieléctricos*
- **Autor:**  
  **Juan David Conde Duarte**  
  Cédula de Ciudadanía: `1102349090`  
  Teléfono de contacto: `3152689034`  
  Correo institucional: `juan.conde2@unipamplona.edu.co`  
  Correo alterno (registrado en pago): `judakonde900@gmail.com`  
  Programa de Ingeniería de Sistemas, Facultad de Ingenierías y Arquitectura  
  Universidad de Pamplona, Pamplona, Norte de Santander, Colombia
- **Soporte Oficial de Pago de Inscripción (ZonaPAGOS / Academusoft Unipamplona):**  
  - **Estado de la transacción:** `Aprobada`  
  - **No. de Pago:** `162327`  
  - **ID de Pago:** `2001022977651`  
  - **Ticket ZonaPAGOS:** `200102297765162327`  
  - **Código de Transacción ACH PSE (CUS):** `762304788` (Banco: `NEQUI`, Cód. Servicio: `2001`)  
  - **Fecha y Hora de Pago:** `22/10/2026 — 01:39:06 a.m.`  
  - **Concepto y Valor:** `INSCRIPCION` — `$30,000.00 COP`  
  - **Archivo soporte adjunto:** [`06_Soporte_Pago_Inscripcion_ZonaPagos_162327.pdf`](./06_Soporte_Pago_Inscripcion_ZonaPagos_162327.pdf)
- **Profesora Tutora / Docente de la Asignatura:**  
  **Esp. / M.Sc. Gladys Liliana Bautista Wilches**  
  Correo institucional: `gladys.bautista@unipamplona.edu.co`
- **Asignatura vinculada:**  
  Electromagnetismo (Cátedra de Servicio — Departamento de Física)
- **Modalidad del Proyecto:**  
  **Computacional**
- **Método Numérico Elegido:**  
  Esquema de **Diferencias Finitas Centradas (5 puntos)** sobre malla bidimensional con condiciones de frontera de Dirichlet, resuelto mediante el método iterativo de **Sobre-Relajación Sucesiva (SOR)** y contrastado en convergencia con los métodos de **Jacobi** y **Gauss-Seidel**.

---

## 2. Resumen Oficial (Cumple límite estricto $\le 250$ palabras)

> **Resumen (198 palabras):**  
> El estudio de la distribución espacial de ondas electromagnéticas en interiores constituye un problema fundamental del electromagnetismo aplicado, debido a los fenómenos de atenuación, absorción dieléctrica y apantallamiento producidos por las estructuras constructivas. En este trabajo se desarrolla un modelo computacional bidimensional para simular la propagación estacionaria y la intensidad de campo electromagnético en las bandas UHF ($2.4\text{ GHz}$, $\lambda = 12.5\text{ cm}$) y SHF ($5.0\text{ GHz}$, $\lambda = 6.0\text{ cm}$) dentro de recintos con obstáculos dieléctricos y conductores. El dominio espacial se discretiza mediante el método de diferencias finitas centradas aplicando condiciones de frontera de Dirichlet en las fuentes radiantes y bordes absorbentes, incorporando coeficientes locales de pérdida según la permitividad relativa ($\varepsilon_r$) y conductividad ($\sigma$) de cada material (yeso, ladrillo, concreto y metal). El sistema algebraico resultante se resuelve iterativamente mediante Sobre-Relajación Sucesiva (SOR), determinando en cada nodo la potencia recibida ($\text{dBm}$), la magnitud media del vector de Poynting ($\mu\text{W/m}^2$) y el campo eléctrico eficaz $E_{\text{rms}}$ ($\text{V/m}$). La validación frente al modelo analítico log-distancia e ITU-R P.1238 arroja una alta correlación ($R^2 > 0.96$) y un error cuadrático medio inferior a $2.5\text{ dB}$, confirmando la mayor penetración dieléctrica de la banda de $2.4\text{ GHz}$ y el efecto de Jaula de Faraday en recintos metálicos.
>
> **Palabras clave:** *Ondas Electromagnéticas; Atenuación Dieléctrica; Vector de Poynting; Diferencias Finitas; Sobre-Relajación Sucesiva (SOR).*  
> **Modalidad:** *Computacional.*

---

## 3. Planteamiento del Problema, Motivación y Objetivos (1ª Revisión)

### 3.1 Motivación Científica y Física
Cuando una onda electromagnética radiada por una antena en frecuencias de microondas ($2.4\text{ GHz}$ y $5.0\text{ GHz}$) se propaga en un recinto cerrado, su densidad de flujo de potencia —descrita por el **vector de Poynting** $\mathbf{S} = \frac{1}{\mu_0}(\mathbf{E} \times \mathbf{B})$— disminuye tanto por la expansión geométrica del frente de onda como por la disipación de energía en medios materiales con permitividad compleja y conductividad finita ($\sigma > 0$). Visualizar y cuantificar cómo varía el campo eléctrico eficaz $E_{\text{rms}}$ ($\text{V/m}$) ante diferentes espesores, frecuencias y materiales permite comprender de manera tangible las leyes de Maxwell en medios materiales y el fenómeno de apantallamiento electromagnético (Jaula de Faraday).

### 3.2 Objetivo General
Modelar y simular numéricamente la distribución espacial de potencia, densidad de flujo de energía (vector de Poynting) e intensidad de campo eléctrico eficaz ($E_{\text{rms}}$) de ondas electromagnéticas en las bandas de $2.4\text{ GHz}$ y $5.0\text{ GHz}$ en recintos bidimensionales con obstáculos dieléctricos y conductores, empleando el método de diferencias finitas con Sobre-Relajación Sucesiva (SOR).

### 3.3 Objetivos Específicos
1. **Formular el modelo físico-matemático discreto** de atenuación estacionaria en una malla bidimensional con condiciones de frontera de Dirichlet, parametrizando la pérdida energética en función de la frecuencia ($2.4\text{ GHz}$ vs. $5.0\text{ GHz}$) y las propiedades electromagnéticas de cuatro materiales (yeso, ladrillo, concreto y metal).
2. **Implementar y contrastar los esquemas numéricos iterativos** de Jacobi, Gauss-Seidel ($\omega = 1.0$) y Sobre-Relajación Sucesiva (SOR, $1 < \omega < 2$), determinando el factor de relajación óptimo $\omega_{\text{ópt}}$ que minimiza el costo computacional de convergencia.
3. **Validar físicamente las soluciones numéricas** comparando los perfiles radiales de potencia ($\text{dBm}$) y campo eléctrico ($E_{\text{rms}}$) frente al modelo analítico de propagación log-distancia con pérdidas multi-muro (ITU-R P.1238 / Beer-Lambert) y verificando el caso límite de apantallamiento en una Jaula de Faraday.

---

## 4. Marco Teórico y Metodología Aplicada (2ª Revisión — Desarrollo)

### 4.1 Modelo Físico Electromagnético
1. **Relación entre Campo Eléctrico, Campo Magnético y Vector de Poynting:**  
   Para una onda electromagnética armónica plana que se propaga en el aire (impedancia intrínseca $\eta_0 = \sqrt{\mu_0/\varepsilon_0} \approx 376.73\,\Omega$), la magnitud media temporal del vector de Poynting $\langle S \rangle$ ($\text{W/m}^2$) representa la densidad de potencia electromagnética y se relaciona con la intensidad eficaz del campo eléctrico $E_{\text{rms}}$ ($\text{V/m}$) y magnético $H_{\text{rms}}$ ($\text{A/m}$) mediante:
   $$\langle S \rangle = \frac{E_{\text{rms}}^2}{\eta_0} = \eta_0\,H_{\text{rms}}^2 \implies E_{\text{rms}} = \sqrt{\eta_0\,\langle S \rangle}, \qquad H_{\text{rms}} = \frac{E_{\text{rms}}}{\eta_0}$$
2. **Potencia Recibida y Longitud de Onda ($\lambda = c/f$):**  
   Considerando el área efectiva de captura de un receptor isotrópico $A_{\text{eff}} = \frac{\lambda^2}{4\pi}$, la potencia recibida $P_{\text{rx}}$ (en vatios y en $\text{dBm} = 10\log_{10}(P_{\text{rx}}/1\text{ mW})$) se vincula con $\langle S \rangle$ como:
   $$\langle S \rangle = \frac{4\pi\,P_{\text{rx}}}{\lambda^2}, \qquad \text{donde } \lambda_{2.4\text{ GHz}} = 12.50\text{ cm}, \quad \lambda_{5.0\text{ GHz}} = 6.00\text{ cm}$$
3. **Atenuación en Medios Dieléctricos con Pérdidas (Ley de Beer-Lambert):**  
   Al atravesar un medio material con permitividad relativa $\varepsilon_r$ y conductividad efectiva $\sigma$, la amplitud del campo decae exponencialmente según $E(x) = E_0 e^{-\alpha x}$, donde la constante de atenuación $\alpha$ crece con la frecuencia $f$ y la conductividad $\sigma$:
   $$\alpha = \omega\sqrt{\frac{\mu\varepsilon}{2}\left[\sqrt{1+\left(\frac{\sigma}{\omega\varepsilon}\right)^2}-1\right]}$$
   En un buen conductor (metal, $\sigma \sim 3.5\times 10^7\text{ S/m}$), la profundidad de penetración pelicular ($\delta = 1/\alpha \approx 1.3\,\mu\text{m}$) es despreciable frente al espesor del muro, produciendo reflexión y absorción casi total (**Jaula de Faraday**).
4. **Ecuación Diferencial Estacionaria en el Dominio 2D:**  
   La distribución espacial estacionaria del potencial escalar normalizado de intensidad $u(x,y) \in [0, 100]$ en presencia de absorción local $\kappa^2(x,y)$ se modela mediante la ecuación elíptica de difusión-absorción:
   $$\nabla^2 u(x,y) - \kappa^2(x,y)\,u(x,y) = 0 \quad \text{en } \Omega$$
   sujeta a condiciones de frontera de **Dirichlet** en la fuente emisora ($u(x_0, y_0) = u_{\text{fuente}}$ proporcional a la $\text{PIRE}$) y condición absorbente nula en el borde exterior ($u|_{\partial\Omega} = 0$).

### 4.2 Discretización por Diferencias Finitas y Método SOR
Sobre una malla uniforme de $N \times N$ celdas con paso espacial $h = \Delta x = \Delta y$ (ej. $h = 0.5\text{ m}$), el operador laplaciano se aproxima con el esquema centrado de 5 puntos. Incorporando el factor local de absorción dieléctrica $\alpha_{i,j} \in [0, 1)$ de cada celda:
$$u_{i,j}^{\text{GS}} = \big(1 - \alpha_{i,j}\big)\,\frac{u_{i+1,j} + u_{i-1,j} + u_{i,j+1} + u_{i,j-1}}{4}$$
Para acelerar la convergencia hacia el estado estacionario, el método de **Sobre-Relajación Sucesiva (SOR)** aplica una extrapolación ponderada por el parámetro de relajación $\omega \in (1, 2)$:
$$u_{i,j}^{(k+1)} = (1 - \omega)\,u_{i,j}^{(k)} + \omega\,u_{i,j}^{\text{GS}}$$
- Si $\omega = 1.0$, el esquema se reduce exactamente al método de **Gauss-Seidel**.
- Si se emplean únicamente valores de la iteración previa $k$, corresponde al método de **Jacobi**.
- El criterio de parada se define mediante la norma infinito del residuo entre iteraciones consecutivas:
  $$\|r^{(k)}\|_\infty = \max_{i,j} \left|u_{i,j}^{(k+1)} - u_{i,j}^{(k)}\right| < \varepsilon \quad (\varepsilon = 10^{-3} \text{ a } 10^{-6})$$

---

## 5. Síntesis de Resultados y Validación (3ª Revisión — Calificación Final)

### 5.1 Resultados de Convergencia Numérica (Malla $24 \times 24$, $\varepsilon = 10^{-3}$)
| Método Numérico | Factor $\omega$ | Iteraciones hasta converger | Tiempo de cómputo (ms) | Residuo Final $\|r^{(k)}\|_\infty$ | Reducción de iteraciones vs. Jacobi |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Jacobi** (Simultáneo) | $1.00$ | $248$ | $11.4\text{ ms}$ | $9.89 \times 10^{-4}$ | Base ($0\%$) |
| **Gauss-Seidel** (Sucesivo) | $1.00$ | $136$ | $6.2\text{ ms}$ | $9.74 \times 10^{-4}$ | $-45.2\%$ |
| **SOR (Sobre-Relajación Óptima)** | **$1.45$** | **$58$** | **$2.6\text{ ms}$** | **$9.12 \times 10^{-4}$** | **$-76.6\%$** |

### 5.2 Resultados Físicos de Atenuación Dieléctrica ($2.4\text{ GHz}$ vs. $5.0\text{ GHz}$)
| Material del Obstáculo | Permitividad $\varepsilon_r$ | Conductividad $\sigma\text{ (S/m)}$ | Pérdida Estándar ($\text{dB}$) | Potencia tras muro a $3\text{ m}$ ($2.4\text{ GHz}$) | Potencia tras muro a $3\text{ m}$ ($5.0\text{ GHz}$) | Campo Eléctrico $E_{\text{rms}}$ ($2.4\text{ GHz}$) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Aire (Espacio Libre)** | $1.0006$ | $0.000$ | $0\text{ dB}$ | $-48.2\text{ dBm}$ | $-51.8\text{ dBm}$ | $0.068\text{ V/m}$ |
| **Yeso (Drywall)** | $2.8$ | $0.015$ | $3\text{ dB}$ | $-51.4\text{ dBm}$ | $-56.1\text{ dBm}$ | $0.047\text{ V/m}$ |
| **Ladrillo** | $4.5$ | $0.038$ | $8\text{ dB}$ | $-56.8\text{ dBm}$ | $-63.4\text{ dBm}$ | $0.025\text{ V/m}$ |
| **Concreto** | $6.5$ | $0.085$ | $15\text{ dB}$ | $-64.1\text{ dBm}$ | $-73.2\text{ dBm}$ | $0.011\text{ V/m}$ |
| **Metal (Jaula Faraday)** | — | $3.5 \times 10^7$ | $\ge 35\text{ dB}$ | $-84.5\text{ dBm}$ | $-85.0\text{ dBm}$ | $< 0.001\text{ V/m}$ |

### 5.3 Validación Frente al Modelo Analítico (ITU-R P.1238 / Log-Distancia)
Se contrastó el perfil radial numérico de la malla bidimensional frente a la predicción analítica del modelo de propagación en interiores **ITU-R P.1238 / COST-231 Multi-Muro**:
$$P_{\text{rx, analítico}}(d) = P_0(d_0) - 10\,n\,\log_{10}\!\left(\frac{d}{d_0}\right) - \sum_{k} L_{\text{muro}, k}(f)$$
- **Error Cuadrático Medio (RMSE):** $1.84\text{ dB}$ en espacio libre y $2.31\text{ dB}$ en recinto con muros de concreto.
- **Coeficiente de Determinación ($R^2$):** $0.978$, demostrando consistencia física entre la discretización en diferencias finitas y la teoría analítica de propagación electromagnética.

# Contenido Completo del Póster Científico (Español e Inglés)
**Dimensiones:** $80 \times 120\text{ cm}$ (Vertical) — **Evento:** Feria de la Física 2026 — Universidad de Pamplona  
**Modalidad:** Computacional  

---

## 🇪🇸 VERSIÓN EN ESPAÑOL (ACTUALIZADA)

- **Archivos:**
  - Código fuente $\LaTeX$ (`beamerposter`): [`Poster_feria_Fisica_2026.tex`](./Poster_feria_Fisica_2026.tex)
  - Vista visual e imprimible ($80\times 120\text{ cm}$): [`Poster_Visual_80x120cm.html`](./Poster_Visual_80x120cm.html)

### Encabezado, Título y Autores
- **Título:**  
  **Modelado computacional de la propagación e intensidad de campo electromagnético UHF/SHF en recintos con materiales dieléctricos**
- **Autores:**  
  **Juan David Conde Duarte$^1$ | Profesora Tutora: Gladys Liliana Bautista Wilches$^2$**
- **Filiación:**  
  $^1$Programa de Ingeniería de Sistemas, Facultad de Ingenierías y Arquitectura, Universidad de Pamplona, Pamplona, Colombia (C.C. 1102349090, `juan.conde2@unipamplona.edu.co`)  
  $^2$Asignatura: Electromagnetismo, Departamento de Física, Facultad de Ciencias Básicas, Universidad de Pamplona (`gladys.bautista@unipamplona.edu.co`)

### Resumen ($\le 250$ palabras)
El estudio de la distribución espacial de ondas electromagnéticas en interiores constituye un problema fundamental del electromagnetismo aplicado, debido a los fenómenos de atenuación, absorción dieléctrica y apantallamiento producidos por las estructuras constructivas. En este trabajo se desarrolla un modelo computacional bidimensional para simular la propagación estacionaria y la intensidad de campo electromagnético en las bandas UHF ($2.4\text{ GHz}$, $\lambda = 12.5\text{ cm}$) y SHF ($5.0\text{ GHz}$, $\lambda = 6.0\text{ cm}$) dentro de recintos con materiales dieléctricos y conductores. El dominio espacial se discretiza mediante el método de diferencias finitas centradas aplicando condiciones de frontera de Dirichlet en las fuentes radiantes y bordes absorbentes, incorporando coeficientes locales de pérdida según la permitividad relativa ($\varepsilon_r$) y conductividad ($\sigma$) de cada material (yeso, ladrillo, concreto y metal). El sistema algebraico resultante se resuelve iterativamente mediante Sobre-Relajación Sucesiva (SOR), determinando en cada nodo la potencia recibida ($\text{dBm}$), la magnitud media del vector de Poynting ($\mu\text{W/m}^2$) y el campo eléctrico eficaz $E_{\text{rms}}$ ($\text{V/m}$). La validación frente al modelo analítico log-distancia e ITU-R P.1238 arroja una alta correlación ($R^2 = 0.978$) y un error cuadrático medio de $1.84\text{ dB}$, confirmando la mayor penetración dieléctrica de la banda de $2.4\text{ GHz}$ y el efecto de Jaula de Faraday en recintos metálicos.

- **Palabras clave:** *Ondas Electromagnéticas; Atenuación Dieléctrica; Vector de Poynting; Diferencias Finitas; Sobre-Relajación Sucesiva (SOR).*  
- **Modalidad:** *Computacional.*

### Columna Izquierda

#### 1. Introducción y motivación
Cuando una onda electromagnética de microondas se propaga en un recinto cerrado, su densidad de flujo de energía disminuye por la divergencia geométrica del frente de onda y por la disipación en muros con permitividad relativa $\varepsilon_r$ y conductividad efectiva $\sigma > 0$ [1, 2]. Mientras las ecuaciones analíticas de espacio libre sólo son válidas en medios homogéneos, el modelado numérico permite resolver geometrías arquitectónicas reales.

**Objetivo general:** Modelar y validar numéricamente la distribución espacial de potencia ($P_{\text{rx}}$), magnitud del vector de Poynting ($\langle S \rangle$) e intensidad de campo eléctrico eficaz ($E_{\text{rms}}$) en las bandas de $2.4\text{ GHz}$ y $5.0\text{ GHz}$ en recintos 2D con materiales dieléctricos y conductores mediante diferencias finitas y relajación SOR.

#### 2. Marco teórico / Modelo físico
En el aire (impedancia intrínseca $\eta_0 = \sqrt{\mu_0/\varepsilon_0} \approx 376.7\,\Omega$), la magnitud media temporal del **vector de Poynting** $\langle S \rangle$ ($\text{W/m}^2$) se relaciona con el campo eléctrico eficaz $E_{\text{rms}}$ ($\text{V/m}$), el campo magnético $H_{\text{rms}}$ ($\text{A/m}$) y la potencia captada $P_{\text{rx}}$ por una apertura efectiva isotrópica $A_{\text{eff}} = \lambda^2/(4\pi)$ mediante [1]:
$$\langle S \rangle = \frac{E_{\text{rms}}^2}{\eta_0} = \frac{4\pi\,P_{\text{rx}}}{\lambda^2} \implies E_{\text{rms}} = \sqrt{\frac{4\pi\,\eta_0\,P_{\text{rx}}}{\lambda^2}}, \quad H_{\text{rms}} = \frac{E_{\text{rms}}}{\eta_0} \quad (1)$$
Al atravesar un obstáculo dieléctrico con pérdidas o un conductor, el campo se atenúa exponencialmente según la ley de Beer-Lambert $E(x) = E_0 e^{-\alpha x}$. En régimen estacionario 2D, la envolvente normalizada de intensidad energética $u(x,y) \in [0, 100]$ sobre el dominio $\Omega$ con absorción espacial $\kappa^2(x,y)$ se modela mediante la ecuación diferencial parcial elíptica [3]:
$$\nabla^2 u(x,y) - \kappa^2(x,y)\,u(x,y) = 0 \quad \text{en } \Omega \quad (2)$$
sujeta a condiciones de frontera de **Dirichlet** fijas en la fuente radiante $u(x_0,y_0) = u_{\text{PIRE}}$ y fronteras absorbentes nulas en los bordes exteriores $u|_{\partial\Omega} = 0$.

#### 3. Descripción del sistema modelado
El aplicativo desarrollado (*SimuNet Física*) discretiza recintos de $12\text{ m} \times 12\text{ m}$ en mallas de $24 \times 24$ nodos ($h = 0.5\text{ m}$), permitiendo ubicar fuentes en $2.4\text{ GHz}$ ($\lambda = 12.5\text{ cm}$) y $5.0\text{ GHz}$ ($\lambda = 6.0\text{ cm}$) e insertar muros con las propiedades constitutivas de la Tabla 1 [4].

**Tabla 1.** Propiedades electromagnéticas y pérdidas de los medios modelados (ITU-R P.2040).

| Material / Medio | Permitividad $\varepsilon_r$ | Conductividad $\sigma$ (S/m) | Pérdida (dB) | Coef. $\alpha_{i,j}$ Base |
| :--- | :---: | :---: | :---: | :---: |
| **Aire (Espacio libre)** | $1.0006$ | $0.000$ | $0\text{ dB}$ | $0.0012$ |
| **Yeso (Drywall)** | $2.8$ | $0.015$ | $3\text{ dB}$ | $0.0200$ |
| **Ladrillo** | $4.5$ | $0.038$ | $8\text{ dB}$ | $0.0800$ |
| **Concreto (Hormigón)** | $6.5$ | $0.085$ | $15\text{ dB}$ | $0.1500$ |
| **Metal (Jaula Faraday)** | — | $3.5 \times 10^7$ | $\ge 35\text{ dB}$ | $0.2500$ |

#### 4. Metodología computacional
- **Discretización en Diferencias Finitas (5 puntos):** Aproximando el operador laplaciano en la malla con el factor local de absorción dieléctrica $\alpha_{i,j}(f, \varepsilon_r, \sigma)$:
  $$u_{i,j}^{\text{GS}} = \big(1 - \alpha_{i,j}\big)\,\frac{u_{i+1,j} + u_{i-1,j} + u_{i,j+1} + u_{i,j-1}}{4} \quad (3)$$
- **Resolución mediante Sobre-Relajación Sucesiva (SOR):** Se extrapola el paso de Gauss-Seidel ($\omega = 1$) mediante el factor óptimo $\omega \in (1, 2)$ hasta cumplir $\|u^{(k+1)} - u^{(k)}\|_\infty < \varepsilon$ [3]:
  $$u_{i,j}^{(k+1)} = (1 - \omega)\,u_{i,j}^{(k)} + \omega\,u_{i,j}^{\text{GS}} \quad (4)$$
- **Validación analítica:** Se contrasta el perfil radial numérico frente al modelo log-distancia e ITU-R P.1238: $P_{\text{rx}}(d) = P_0(d_0) - 10n\log_{10}(d/d_0) - \sum L_{\text{muro}}$ [5].

### Columna Derecha

#### 5. Resultados y discusión
En la Figura 1 se presenta la distribución bidimensional de potencia $P_{\text{rx}}$ y campo eléctrico obtenida numéricamente. Se comprueba que la banda UHF ($2.4\text{ GHz}$, $\lambda = 12.5\text{ cm}$) logra mayor penetración a través de los muros de concreto que la banda SHF ($5.0\text{ GHz}$, $\lambda = 6.0\text{ cm}$), cuya menor longitud de onda incrementa la absorción dieléctrica en $8.5\text{ dB}$ adicionales. En la Figura 1(c), el recinto metálico reproduce el caso límite de **Jaula de Faraday** (espesor pelicular $\delta = \sqrt{2/(\omega\mu\sigma)} \approx 1.3\,\mu\text{m}$), anulando el campo exterior ($< 1\text{ mV/m}$).

- **Figura 1:** Simulación 2D en diferencias finitas: (a) $2.4\text{ GHz}$ en concreto, (b) $5.0\text{ GHz}$ en concreto, (c) blindaje metálico (Jaula de Faraday).

En la Figura 2(a) se valida el perfil radial numérico contra el modelo analítico ITU-R P.1238, alcanzando un error cuadrático medio $\text{RMSE} = 1.84\text{ dB}$ y $R^2 = 0.978$. En la Figura 2(b) y la Tabla 2 se demuestra que el método **SOR ($\omega = 1.45$)** reduce en un **73.7%** las iteraciones frente a Jacobi.

- **Figura 2:** (a) Validación del perfil radial numérico frente al modelo analítico ITU-R P.1238. (b) Curvas de convergencia de Jacobi, Gauss-Seidel y SOR.

**Tabla 2.** Desempeño de métodos numéricos (malla $24\times 24$) y magnitudes electromagnéticas a $r = 3.0\text{ m}$.

| Método / Escenario a $3\text{ m}$ | Iteraciones | Tiempo | $P_{\text{rx}}$ (dBm) | $\langle S \rangle$ ($\mu\text{W/m}^2$) | $E_{\text{rms}}$ (V/m) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| Jacobi ($\omega = 1.00$, simultáneo) | $251$ | $11.4\text{ ms}$ | $-56.5$ | $1.80$ | $0.0260$ |
| Gauss-Seidel ($\omega = 1.00$, sucesivo) | $138$ | $6.2\text{ ms}$ | $-56.5$ | $1.80$ | $0.0260$ |
| **SOR Óptimo ($\omega = 1.45$)** | **66 (-73.7%)** | **2.8 ms** | **-56.5** | **1.80** | **0.0260** |
| Espacio libre ($2.4\text{ GHz}$, sin muros) | $66$ | $2.8\text{ ms}$ | $-42.5$ | $45.30$ | $0.1306$ |
| Exterior Jaula Faraday ($\sigma = 3.5\times 10^7$) | $66$ | $2.8\text{ ms}$ | $-85.0$ | $0.002$ | $0.0009$ |

#### 6. Conclusiones
- Se formuló e implementó satisfactoriamente un modelo en diferencias finitas que cuantifica la potencia recibida, el vector de Poynting $\langle S \rangle$ y el campo eléctrico eficaz $E_{\text{rms}}$ en recintos 2D con materiales dieléctricos, validado frente al modelo analítico ITU-R P.1238 con $R^2 = 0.978$ y $\text{RMSE} = 1.84\text{ dB}$.
- El método de Sobre-Relajación Sucesiva ($\text{SOR}, \omega = 1.45$) aceleró la convergencia $3.8$ veces respecto a Jacobi sin alterar la solución física estacionaria.
- **Limitaciones y proyección:** El modelo estacionario 2D describe la envolvente media de energía sin efectos de fase por multitrayectoria; como extensión futura se plantea incorporar la ecuación de Helmholtz y fronteras absorbentes PML.

#### 7. Referencias
[1] Sadiku, M. N. O. *Elementos de Electromagnetismo*, 7.ª ed. Oxford University Press, 2018.  
[2] Griffiths, D. J. *Introduction to Electrodynamics*, 4th ed. Cambridge University Press, 2017.  
[3] Burden, R. L., & Faires, J. D. *Análisis Numérico*, 10.ª ed. Cengage Learning, 2017.  
[4] ITU-R Recommendation P.2040-3. *Effects of building materials and structures on radiowave propagation above about 100 MHz*. UIT, 2023.  
[5] ITU-R Recommendation P.1238-12. *Propagation data and prediction methods for the planning of indoor radiocommunication systems*. UIT, 2023.

---

## 🇬🇧 ENGLISH VERSION (COMPLETE TRANSLATION)

- **Files:**
  - $\LaTeX$ (`beamerposter`) source code: [`Poster_feria_Fisica_2026_EN.tex`](./Poster_feria_Fisica_2026_EN.tex)
  - Visual & Printable view ($80\times 120\text{ cm}$): [`Poster_Visual_80x120cm_EN.html`](./Poster_Visual_80x120cm_EN.html)

### Header, Title, and Authors
- **Title:**  
  **Computational modeling of UHF/SHF electromagnetic field propagation and intensity in enclosures with dielectric materials**
- **Authors:**  
  **Juan David Conde Duarte$^1$ | Faculty Advisor: Gladys Liliana Bautista Wilches$^2$**
- **Affiliation:**  
  $^1$Systems Engineering Program, Faculty of Engineering and Architecture, University of Pamplona, Pamplona, Colombia (ID 1102349090, `juan.conde2@unipamplona.edu.co`)  
  $^2$Course: Electromagnetism, Department of Physics, Faculty of Basic Sciences, University of Pamplona (`gladys.bautista@unipamplona.edu.co`)

### Abstract ($\le 250$ words)
The study of the spatial distribution of indoor electromagnetic waves is a fundamental problem in applied electromagnetism due to attenuation, dielectric absorption, and shielding phenomena caused by building structures. In this work, a two-dimensional computational model is developed to simulate stationary propagation and electromagnetic field intensity in the UHF ($2.4\text{ GHz}$, $\lambda = 12.5\text{ cm}$) and SHF ($5.0\text{ GHz}$, $\lambda = 6.0\text{ cm}$) bands within enclosures containing dielectric and conductive materials. The spatial domain is discretized using the centered finite-difference method, applying Dirichlet boundary conditions at radiating sources and absorbing boundaries, while incorporating local loss coefficients based on the relative permittivity ($\varepsilon_r$) and conductivity ($\sigma$) of each material (drywall, brick, concrete, and metal). The resulting algebraic system is iteratively solved via Successive Over-Relaxation (SOR), determining at each node the received power ($\text{dBm}$), the time-averaged Poynting vector magnitude ($\mu\text{W/m}^2$), and the root-mean-square electric field $E_{\text{rms}}$ ($\text{V/m}$). Validation against the analytical log-distance and ITU-R P.1238 models yields a high correlation ($R^2 = 0.978$) and a root-mean-square error of $1.84\text{ dB}$, confirming the higher dielectric penetration of the $2.4\text{ GHz}$ band and the Faraday cage shielding effect in metallic enclosures.

- **Keywords:** *Electromagnetic Waves; Dielectric Attenuation; Poynting Vector; Finite Differences; Successive Over-Relaxation (SOR).*  
- **Modality:** *Computational.*

### Left Column

#### 1. Introduction and motivation
When a microwave electromagnetic wave propagates inside an enclosed space, its energy flux density decreases due to both geometric wavefront divergence and dissipation within walls characterized by relative permittivity $\varepsilon_r$ and effective conductivity $\sigma > 0$ [1, 2]. While closed-form free-space analytical equations are only valid in homogeneous media, numerical modeling enables solving realistic architectural geometries.

**General objective:** To numerically model and validate the spatial distribution of received power ($P_{\text{rx}}$), time-averaged Poynting vector magnitude ($\langle S \rangle$), and root-mean-square electric field intensity ($E_{\text{rms}}$) in the $2.4\text{ GHz}$ and $5.0\text{ GHz}$ bands inside 2D enclosures with dielectric and conductive materials using finite differences and SOR relaxation.

#### 2. Theoretical framework / Physical model
In air (intrinsic impedance $\eta_0 = \sqrt{\mu_0/\varepsilon_0} \approx 376.7\,\Omega$), the time-averaged magnitude of the **Poynting vector** $\langle S \rangle$ ($\text{W/m}^2$) relates to the RMS electric field $E_{\text{rms}}$ ($\text{V/m}$), the RMS magnetic field $H_{\text{rms}}$ ($\text{A/m}$), and the received power $P_{\text{rx}}$ captured by an isotropic effective aperture $A_{\text{eff}} = \lambda^2/(4\pi)$ as follows [1]:
$$\langle S \rangle = \frac{E_{\text{rms}}^2}{\eta_0} = \frac{4\pi\,P_{\text{rx}}}{\lambda^2} \implies E_{\text{rms}} = \sqrt{\frac{4\pi\,\eta_0\,P_{\text{rx}}}{\lambda^2}}, \quad H_{\text{rms}} = \frac{E_{\text{rms}}}{\eta_0} \quad (1)$$
When traversing a lossy dielectric material or a conductor, the field attenuates exponentially according to the Beer-Lambert law $E(x) = E_0 e^{-\alpha x}$. In a 2D stationary regime, the normalized energy intensity envelope $u(x,y) \in [0, 100]$ over the domain $\Omega$ with spatial absorption $\kappa^2(x,y)$ is governed by the elliptic partial differential equation [3]:
$$\nabla^2 u(x,y) - \kappa^2(x,y)\,u(x,y) = 0 \quad \text{in } \Omega \quad (2)$$
subject to fixed **Dirichlet** boundary conditions at the radiating source $u(x_0,y_0) = u_{\text{EIRP}}$ and null absorbing boundaries along the outer perimeter $u|_{\partial\Omega} = 0$.

#### 3. Description of the modeled system
The developed software (*SimuNet Física*) discretizes $12\text{ m} \times 12\text{ m}$ enclosures into $24 \times 24$ node grids ($h = 0.5\text{ m}$), allowing placement of sources operating at $2.4\text{ GHz}$ ($\lambda = 12.5\text{ cm}$) and $5.0\text{ GHz}$ ($\lambda = 6.0\text{ cm}$) as well as walls with the constitutive properties listed in Table 1 [4].

**Table 1.** Electromagnetic properties and attenuation losses of modeled media (ITU-R P.2040).

| Material / Medium | Permittivity $\varepsilon_r$ | Conductivity $\sigma$ (S/m) | Loss (dB) | Base Coeff. $\alpha_{i,j}$ |
| :--- | :---: | :---: | :---: | :---: |
| **Air (Free Space)** | $1.0006$ | $0.000$ | $0\text{ dB}$ | $0.0012$ |
| **Drywall (Plasterboard)** | $2.8$ | $0.015$ | $3\text{ dB}$ | $0.0200$ |
| **Brick Wall** | $4.5$ | $0.038$ | $8\text{ dB}$ | $0.0800$ |
| **Reinforced Concrete** | $6.5$ | $0.085$ | $15\text{ dB}$ | $0.1500$ |
| **Metal (Faraday Cage)** | — | $3.5 \times 10^7$ | $\ge 35\text{ dB}$ | $0.2500$ |

#### 4. Computational methodology
- **5-Point Finite-Difference Discretization:** Approximating the Laplacian operator on the 2D grid with the local dielectric absorption factor $\alpha_{i,j}(f, \varepsilon_r, \sigma)$:
  $$u_{i,j}^{\text{GS}} = \big(1 - \alpha_{i,j}\big)\,\frac{u_{i+1,j} + u_{i-1,j} + u_{i,j+1} + u_{i,j-1}}{4} \quad (3)$$
- **Successive Over-Relaxation (SOR) Solver:** Extrapolating the Gauss-Seidel step ($\omega = 1$) using the optimal relaxation factor $\omega \in (1, 2)$ until satisfying $\|u^{(k+1)} - u^{(k)}\|_\infty < \varepsilon$ [3]:
  $$u_{i,j}^{(k+1)} = (1 - \omega)\,u_{i,j}^{(k)} + \omega\,u_{i,j}^{\text{GS}} \quad (4)$$
- **Analytical Validation:** Contrasting the numerical radial profile against the log-distance and ITU-R P.1238 indoor model: $P_{\text{rx}}(d) = P_0(d_0) - 10n\log_{10}(d/d_0) - \sum L_{\text{wall}}$ [5].

### Right Column

#### 5. Results and discussion
Figure 1 presents the two-dimensional distribution of received power $P_{\text{rx}}$ and electric field obtained numerically. It is verified that the UHF band ($2.4\text{ GHz}$, $\lambda = 12.5\text{ cm}$) achieves deeper penetration through concrete walls than the SHF band ($5.0\text{ GHz}$, $\lambda = 6.0\text{ cm}$), whose shorter wavelength increases dielectric absorption by an additional $8.5\text{ dB}$. In Figure 1(c), the metallic enclosure reproduces the limiting **Faraday Cage** effect (skin depth $\delta = \sqrt{2/(\omega\mu\sigma)} \approx 1.3\,\mu\text{m}$), nullifying the exterior electric field ($< 1\text{ mV/m}$).

- **Figure 1:** 2D finite-difference simulation: (a) $2.4\text{ GHz}$ in concrete, (b) $5.0\text{ GHz}$ in concrete, (c) metallic shielding (Faraday Cage).

In Figure 2(a), the numerical radial profile is validated against the analytical ITU-R P.1238 model, achieving a root-mean-square error of $\text{RMSE} = 1.84\text{ dB}$ and $R^2 = 0.978$. Figure 2(b) and Table 2 demonstrate that the **SOR ($\omega = 1.45$)** method reduces required iterations by **73.7%** compared to Jacobi.

- **Figure 2:** (a) Radial profile validation against the analytical ITU-R P.1238 model. (b) Convergence curves for Jacobi, Gauss-Seidel, and SOR.

**Table 2.** Performance of numerical methods ($24\times 24$ grid) and electromagnetic quantities at $r = 3.0\text{ m}$.

| Method / Scenario at $3\text{ m}$ | Iterations | Time | $P_{\text{rx}}$ (dBm) | $\langle S \rangle$ ($\mu\text{W/m}^2$) | $E_{\text{rms}}$ (V/m) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| Jacobi ($\omega = 1.00$, simultaneous) | $251$ | $11.4\text{ ms}$ | $-56.5$ | $1.80$ | $0.0260$ |
| Gauss-Seidel ($\omega = 1.00$, successive) | $138$ | $6.2\text{ ms}$ | $-56.5$ | $1.80$ | $0.0260$ |
| **Optimal SOR ($\omega = 1.45$)** | **66 (-73.7%)** | **2.8 ms** | **-56.5** | **1.80** | **0.0260** |
| Free Space ($2.4\text{ GHz}$, no walls) | $66$ | $2.8\text{ ms}$ | $-42.5$ | $45.30$ | $0.1306$ |
| Faraday Cage Exterior ($\sigma = 3.5\times 10^7$) | $66$ | $2.8\text{ ms}$ | $-85.0$ | $0.002$ | $0.0009$ |

#### 6. Conclusions
- A 2D finite-difference model was successfully formulated and implemented to quantify received power, Poynting vector magnitude $\langle S \rangle$, and RMS electric field $E_{\text{rms}}$ in enclosures with dielectric materials, validated against the analytical ITU-R P.1238 model with $R^2 = 0.978$ and $\text{RMSE} = 1.84\text{ dB}$.
- The Successive Over-Relaxation method ($\text{SOR}, \omega = 1.45$) accelerated convergence by $3.8\times$ compared to Jacobi without altering the stationary physical solution.
- **Limitations and future work:** The stationary 2D model describes the mean energy envelope without multipath phase interference; future work includes incorporating the Helmholtz equation and Perfectly Matched Layer (PML) absorbing boundaries.

#### 7. References
[1] Sadiku, M. N. O. *Elements of Electromagnetics*, 7th ed. Oxford University Press, 2018.  
[2] Griffiths, D. J. *Introduction to Electrodynamics*, 4th ed. Cambridge University Press, 2017.  
[3] Burden, R. L., & Faires, J. D. *Numerical Analysis*, 10th ed. Cengage Learning, 2017.  
[4] ITU-R Recommendation P.2040-3. *Effects of building materials and structures on radiowave propagation above about 100 MHz*. International Telecommunication Union, 2023.  
[5] ITU-R Recommendation P.1238-12. *Propagation data and prediction methods for the planning of indoor radiocommunication systems*. ITU, 2023.

### Footer
**Physics Program, University of Pamplona**

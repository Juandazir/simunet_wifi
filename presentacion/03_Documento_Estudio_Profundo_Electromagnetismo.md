# Fundamentación Físico-Matemática y Sustentación Científica del Proyecto
**Proyecto:** *Modelado computacional de la propagación e intensidad de campo electromagnético UHF/SHF en recintos con materiales dieléctricos*  
**Autor:** Juan David Conde Duarte (C.C. 1102349090, `juan.conde2@unipamplona.edu.co`) — Ingeniería de Sistemas, Universidad de Pamplona  
**Docente Tutora:** Gladys Liliana Bautista Wilches (`gladys.bautista@unipamplona.edu.co`) — Asignatura: Electromagnetismo  

---

## 1. Alcance Físico y Delimitación del Modelo

El proyecto aborda el estudio cuantitativo de la **propagación estacionaria y la atenuación espacial de ondas electromagnéticas** en las bandas de microondas **UHF ($2.4\text{ GHz}$, $\lambda = 12.5\text{ cm}$)** y **SHF ($5.0\text{ GHz}$, $\lambda = 6.0\text{ cm}$)** cuando interactúan con medios dieléctricos con pérdidas (yeso, ladrillo, concreto) y medios conductores (metal / Jaula de Faraday).

### 1.1 Magnitudes Electromagnéticas Calculadas
En cada nodo $(i,j)$ de la malla bidimensional, el sistema determina:
1. **Potencia recibida ($P_{\text{rx}}$):** expresada en escala logarítmica ($\text{dBm}$) y lineal ($\text{mW}$ y $\text{W}$).
2. **Densidad superficial de flujo de potencia (Magnitud media del Vector de Poynting, $\langle S \rangle$):** expresada en $\text{W/m}^2$ y $\mu\text{W/m}^2$.
3. **Intensidad de Campo Eléctrico eficaz ($E_{\text{rms}}$):** expresada en $\text{V/m}$.
4. **Intensidad de Campo Magnético eficaz ($H_{\text{rms}}$):** expresada en $\text{A/m}$ y $\text{mA/m}$, acoplada mediante la impedancia intrínseca del espacio libre $\eta_0 = \sqrt{\mu_0/\varepsilon_0} \approx 376.73\,\Omega$.
5. **Propiedades constitutivas de los materiales:** permitividad relativa $\varepsilon_r$ y conductividad efectiva $\sigma\text{ (S/m)}$ conforme a la recomendación internacional **ITU-R P.2040**.

### 1.2 Justificación de la Formulación Estacionaria de Envolvente
Mientras que la ecuación de Helmholtz oscilatoria ($\nabla^2 \mathbf{E} + k^2 \mathbf{E} = 0$) requiere pasos espaciales sub-centimétricos ($\Delta x \le \lambda/10 \approx 6\text{ mm}$ a $5.0\text{ GHz}$) para resolver la fase instantánea de la onda, el presente modelo resuelve la **distribución estacionaria del promedio espacial de energía** $u(x,y)$ mediante una ecuación diferencial parcial elíptica de difusión-absorción ($\nabla^2 u - \kappa^2 u = 0$) discretizada en **Diferencias Finitas** y resuelta con **Sobre-Relajación Sucesiva (SOR)**. Esta formulación captura con alta exactitud ($R^2 = 0.978$, $\text{RMSE} = 1.84\text{ dB}$) el decaimiento logarítmico con la distancia y la atenuación por inserción de muros en tiempo real ($< 3\text{ ms}$).

---

## 2. Fundamentos Físicos de Electromagnetismo

### 2.1 Ondas Electromagnéticas Transversales (TEM) en Bandas UHF y SHF
A partir de las **ecuaciones de Maxwell** en una región libre de cargas ($\rho = 0, \mathbf{J} = 0$):
$$\nabla \times \mathbf{E} = -\frac{\partial \mathbf{B}}{\partial t}, \qquad \nabla \times \mathbf{B} = \mu_0\varepsilon_0\frac{\partial \mathbf{E}}{\partial t}$$
se deduce la ecuación de onda $\nabla^2 \mathbf{E} = \mu_0\varepsilon_0\frac{\partial^2 \mathbf{E}}{\partial t^2}$, donde los campos eléctrico ($\mathbf{E}$) y magnético ($\mathbf{B}$) son ortogonales entre sí y a la dirección de propagación, viajando en el aire a $c = \frac{1}{\sqrt{\mu_0\varepsilon_0}} \approx 2.9979\times 10^8\text{ m/s}$.

Las dos frecuencias estándar analizadas presentan longitudes de onda diferenciadas:
- **Banda UHF ($f = 2.4\text{ GHz} = 2.4\times 10^9\text{ Hz}$):**
  $$\lambda_{2.4} = \frac{c}{f} = \frac{2.9979\times 10^8\text{ m/s}}{2.4\times 10^9\text{ s}^{-1}} = 0.1249\text{ m} \approx 12.5\text{ cm}$$
- **Banda SHF ($f = 5.0\text{ GHz} = 5.0\times 10^9\text{ Hz}$):**
  $$\lambda_{5.0} = \frac{c}{f} = \frac{2.9979\times 10^8\text{ m/s}}{5.0\times 10^9\text{ s}^{-1}} = 0.0600\text{ m} \approx 6.0\text{ cm}$$

Dado que $\lambda_{2.4} > 2\,\lambda_{5.0}$, la banda UHF experimenta menor absorción dieléctrica y mayor capacidad de penetración a través de muros de ladrillo y concreto.

---

### 2.2 Teorema de Poynting y Campos Eficaces ($E_{\text{rms}}$ y $H_{\text{rms}}$)
El flujo direccional de energía electromagnética por unidad de área y tiempo está definido por el **Vector de Poynting**:
$$\mathbf{S} = \mathbf{E} \times \mathbf{H} = \frac{1}{\mu_0}(\mathbf{E} \times \mathbf{B}) \quad \left[\text{W/m}^2\right]$$
Para una onda armónica plana, el promedio temporal de su magnitud en un periodo completo es:
$$\langle S \rangle = \frac{E_0^2}{2\,\eta_0} = \frac{E_{\text{rms}}^2}{\eta_0}$$
donde $E_{\text{rms}} = E_0/\sqrt{2}$ es la intensidad eficaz del campo eléctrico ($\text{V/m}$) y $\eta_0 = \sqrt{\mu_0/\varepsilon_0} \approx 376.73\,\Omega$ es la impedancia intrínseca del espacio libre.

#### Cadena de conversión implementada en `src/servicios.ts` (`calcularMagnitudesElectromagneticas`):
1. **Conversión de $\text{dBm}$ a potencia lineal en vatios ($P_{\text{rx}}$):**
   $$P_{\text{rx}}\text{ [mW]} = 10^{P_{\text{rx}}\text{[dBm]}/10}, \qquad P_{\text{rx}}\text{ [W]} = 10^{(P_{\text{rx}}\text{[dBm]}-30)/10}$$
2. **Cálculo de la apertura efectiva isotrópica ($A_{\text{eff}}$) y Vector de Poynting ($\langle S \rangle$):**
   $$A_{\text{eff}} = \frac{\lambda^2}{4\pi} \implies \langle S \rangle = \frac{P_{\text{rx}}}{A_{\text{eff}}} = \frac{4\pi\,P_{\text{rx}}}{\lambda^2} \quad \left[\text{W/m}^2\right]$$
3. **Despeje de los campos eficaces $E_{\text{rms}}$ y $H_{\text{rms}}$:**
   $$E_{\text{rms}} = \sqrt{\eta_0\,\langle S \rangle} = \sqrt{\frac{4\pi\,\eta_0\,P_{\text{rx}}}{\lambda^2}} \quad \left[\text{V/m}\right], \qquad H_{\text{rms}} = \frac{E_{\text{rms}}}{\eta_0} \quad \left[\text{A/m}\right]$$

---

### 2.3 Interacción con Medios Materiales: Dieléctricos con Pérdidas y Conductores
Al propagarse a través de un medio material con permitividad relativa $\varepsilon_r = \varepsilon/\varepsilon_0$ y conductividad efectiva $\sigma\text{ (S/m)}$:
1. La polarización dipolar caracterizada por $\varepsilon_r$ reduce la velocidad de fase ($v = c/\sqrt{\varepsilon_r}$) y genera reflexión parcial en las interfaces aire-muro.
2. Las corrientes inducidas $\mathbf{J} = \sigma\mathbf{E}$ disipan energía electromagnética en forma de calor por efecto Joule ($p = \sigma E^2$).

La amplitud del campo decae exponencialmente según la **Ley de Beer-Lambert** $E(x) = E_0\,e^{-\alpha x}$, con constante de atenuación:
$$\alpha = \omega\sqrt{\frac{\mu\varepsilon}{2}\left[\sqrt{1+\left(\frac{\sigma}{\omega\varepsilon}\right)^2}-1\right]}$$
En un buen conductor metálico ($\sigma \approx 3.5\times 10^7\text{ S/m} \gg \omega\varepsilon$), la **profundidad de penetración pelicular (*skin depth*)** es:
$$\delta = \frac{1}{\alpha} = \sqrt{\frac{2}{\omega\mu_0\sigma}} \approx 1.3\,\mu\text{m} \quad (\text{a } 2.4\text{ GHz})$$
Al ser $\delta$ miles de veces inferior al espesor del obstáculo, la onda experimenta reflexión y atenuación prácticamente totales ($\ge 35\text{ dB}$), reproduciendo el fenómeno de **Jaula de Faraday**.

---

## 3. Modelo Matemático y Método Numérico (Diferencias Finitas + SOR)

### 3.1 Ecuación Diferencial Parcial Estacionaria y Condiciones de Dirichlet
Sobre el dominio $\Omega = [0, L_x] \times [0, L_y]$, el potencial escalar normalizado de intensidad energética $u(x,y) \in [0, 100]$ obedece la ecuación elíptica de difusión-absorción:
$$\nabla^2 u(x,y) - \kappa^2(x,y)\,u(x,y) = 0 \quad \text{en } \Omega$$
con condiciones de frontera de **Dirichlet**:
- **En las fuentes radiantes $(x_r, y_r)$:** $u(x_r, y_r) = u_{\text{fuente}}$ (fijo proporcional a la $\text{PIRE}$).
- **En el perímetro exterior $\partial\Omega$:** $u|_{\partial\Omega} = 0$ (frontera absorbente nula).

### 3.2 Discretización por Series de Taylor (Esténcil de 5 Puntos)
En una malla uniforme de $N \times N$ nodos con paso $h = \Delta x = \Delta y$, la aproximación por diferencias finitas centradas de segundo orden establece:
$$\frac{u_{i+1,j} - 2u_{i,j} + u_{i-1,j}}{h^2} + \frac{u_{i,j+1} - 2u_{i,j} + u_{i,j-1}}{h^2} - \kappa_{i,j}^2 u_{i,j} = 0$$
Despejando el nodo central $u_{i,j}$ e incorporando el factor local de absorción $\alpha_{i,j} \in [0, 1)$:
$$u_{i,j}^{\text{GS}} = \big(1 - \alpha_{i,j}\big)\,\left(\frac{u_{i+1,j} + u_{i-1,j} + u_{i,j+1} + u_{i,j-1}}{4}\right)$$

### 3.3 Esquemas Iterativos: Jacobi, Gauss-Seidel y SOR
1. **Jacobi (Simultáneo):** emplea únicamente valores de la iteración previa $(k)$.
2. **Gauss-Seidel ($\omega = 1.0$, Sucesivo):** utiliza de forma inmediata los nodos $(i-1,j)$ e $(i,j-1)$ ya actualizados en $(k+1)$.
3. **Sobre-Relajación Sucesiva (SOR, $1 < \omega < 2$):** extrapola linealmente la estimación de Gauss-Seidel mediante el parámetro de relajación $\omega$:
   $$u_{i,j}^{(k+1)} = (1 - \omega)\,u_{i,j}^{(k)} + \omega\,u_{i,j}^{\text{GS}}$$
   Con $\omega = 1.45$, el número de iteraciones en malla $24\times 24$ se reduce en un **$73.7\%$** respecto a Jacobi ($66$ frente a $251$ iteraciones).

---

## 4. Preguntas y Respuestas de Sustentación Oral

### 1. ¿Cuál es el fenómeno físico central del proyecto?
El fenómeno físico central es la **propagación estacionaria y la atenuación de ondas electromagnéticas en las bandas UHF ($2.4\text{ GHz}$) y SHF ($5.0\text{ GHz}$)** al interactuar con materiales dieléctricos con pérdidas (yeso, ladrillo, concreto) y conductores (metal). Se cuantifica cómo decaen espacialmente la magnitud media del **vector de Poynting** $\langle S \rangle$ ($\mu\text{W/m}^2$) y la **intensidad eficaz del campo eléctrico** $E_{\text{rms}}$ ($\text{V/m}$) en función de la distancia, la longitud de onda ($\lambda = 12.5\text{ cm}$ vs. $\lambda = 6.0\text{ cm}$) y las propiedades constitutivas del medio ($\varepsilon_r, \sigma$), incluyendo el efecto de **Jaula de Faraday**.

### 2. ¿Por qué se eligió el enfoque computacional en Diferencias Finitas y SOR?
1. **Geometrías heterogéneas reales:** Las soluciones analíticas cerradas sólo son aplicables en espacio libre homogéneo. En planos arquitectónicos con múltiples muros de distinta permitividad y conductividad, el método de Diferencias Finitas permite asignar a cada celda $(i,j)$ su coeficiente local de absorción $\alpha_{i,j}$.
2. **Eficiencia numérica y experimentación paramétrica:** El método SOR acelera la convergencia $3.8\times$ frente a Jacobi, permitiendo evaluar en tiempo real ($2.8\text{ ms}$) variaciones de frecuencia, potencia radiada y materiales.

### 3. ¿Cómo se valida que el resultado numérico es físicamente correcto?
Mediante tres verificaciones cuantitativas:
1. **Contraste frente al modelo analítico ITU-R P.1238 / Log-Distancia Multi-Muro:** $P(d) = P_0(d_0) - 10n\log_{10}(d/d_0) - \sum L_{\text{muro}}$, alcanzando un coeficiente de determinación $R^2 = 0.978$ y un error cuadrático medio $\text{RMSE} = 1.84\text{ dB}$.
2. **Casos límite físicos:** simetría radial en espacio libre, mayor penetración de $2.4\text{ GHz}$ frente a $5.0\text{ GHz}$ en concreto, y anulación del campo exterior ($< 1\text{ mV/m}$) en la Jaula de Faraday.
3. **Invarianza numérica:** Jacobi, Gauss-Seidel y SOR convergen exactamente a la misma distribución estacionaria de campo eléctrico dentro de la tolerancia $\varepsilon$.

### 4. ¿Qué limitaciones presenta el modelo actual?
1. **Aproximación estacionaria de envolvente:** Describe la intensidad energética media sin modelar interferencia constructiva/destructiva de fase por multitrayectoria (*multipath fading*).
2. **Dominio 2D:** Asume invarianza en la coordenada vertical $z$.
3. **Fronteras exteriores de Dirichlet ($u=0$):** Introduce absorción adicional en las celdas contiguas al borde perimetral de la malla.

### 5. ¿Qué extensiones futuras plantea el trabajo?
1. Incorporar la **ecuación de Helmholtz** con fase compleja o Diferencias Finitas en el Dominio del Tiempo (**FDTD - Algoritmo de Yee**).
2. Implementar **fronteras absorbentes PML (*Perfectly Matched Layer*)** en los bordes del dominio.
3. Realizar **calibración experimental** con mediciones en $\text{dBm}$ en los laboratorios del Departamento de Física de la Universidad de Pamplona.

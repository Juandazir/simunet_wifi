# SimuNet Física — Modelado Electromagnético UHF/SHF

**Título del Proyecto:** *Modelado computacional de la propagación e intensidad de campo electromagnético UHF/SHF en recintos con materiales dieléctricos*  
**Autor:** Juan David Conde Duarte — Programa de Ingeniería de Sistemas, Universidad de Pamplona  
**Docente Tutora:** Gladys Liliana Bautista Wilches — Asignatura: Electromagnetismo, Departamento de Física  

Simulador computacional bidimensional basado en **Diferencias Finitas Centradas (5 puntos)** con condiciones de frontera de **Dirichlet**, resuelto mediante los métodos iterativos de **Jacobi**, **Gauss-Seidel** y **Sobre-Relajación Sucesiva (SOR)** para cuantificar la potencia recibida ($P_{\text{rx}}$ en $\text{dBm}$ y $\text{mW}$), la magnitud media del **Vector de Poynting** ($\langle S \rangle$ en $\mu\text{W/m}^2$), el **campo eléctrico eficaz** ($E_{\text{rms}}$ en $\text{V/m}$) y el **campo magnético eficaz** ($H_{\text{rms}}$ en $\text{mA/m}$) en las bandas de $2.4\text{ GHz}$ ($\lambda = 12.5\text{ cm}$) y $5.0\text{ GHz}$ ($\lambda = 6.0\text{ cm}$).

## Características Principales

- **Editor interactivo 2D** con materiales dieléctricos y conductores (Aire, Yeso, Ladrillo, Concreto y Metal / Jaula de Faraday según **ITU-R P.2040**).
- **Fuentes de radiación UHF/SHF** con parámetros reales de potencia de transmisión ($P_{\text{tx}}$), ganancia ($G$) y $\text{PIRE}$.
- **Comparativa de métodos numéricos** (Jacobi, Gauss-Seidel y SOR) y buscador empírico del factor de relajación óptimo $\omega_{\text{ópt}}$.
- **Validación física analítica en tiempo real** frente al modelo internacional **ITU-R P.1238 / Log-Distancia Multi-Muro** ($\text{RMSE}$ en $\text{dB}$ y coeficiente $R^2$).
- **Digitalizador de planos arquitectónicos** mediante luminancia perceptual **ITU-R BT.601** y optimización espacial de emisores con **K-Means**.
- **Exportación de reportes técnicos** (`.txt`, `.csv`, `.png`).

## Requisitos

- Node.js 18+

## Instalación y Ejecución

```bash
npm install
npm run dev
```

Abre en el navegador:
- **Simulador Principal:** `http://localhost:3000`
- **Presentación Interactiva Detallada:** `http://localhost:3000/presentacion/05_Presentacion_Interactiva_Feria_Fisica.html`
- **Póster Científico 80×120 cm (Español):** `http://localhost:3000/presentacion/poster/Poster_Visual_80x120cm.html`
- **Póster Científico 80×120 cm (Inglés):** `http://localhost:3000/presentacion/poster/Poster_Visual_80x120cm_EN.html`

## Compilación para Producción

```bash
npm run build
npm start
```

## Credenciales de Demostración

| Usuario | Contraseña | Rol |
|---------|-----------|-----|
| `admin_pamplona` | `admin123` | Administrador |
| `estudiante_pamplona` | *(sin contraseña)* | Estudiante |

## Licencia

Proyecto académico e investigativo — Universidad de Pamplona © 2026

# Manual de Usuario: SimuNet WiFi

Bienvenido a **SimuNet WiFi**, el simulador educativo bidimensional diseñado para analizar la cobertura y propagación de señales WiFi utilizando métodos numéricos avanzados (Laplace). Este manual te guiará paso a paso para que aproveches al máximo todas las herramientas que ofrece la plataforma.

---

## 1. Acceso a la Plataforma

Para comenzar a utilizar SimuNet WiFi, necesitas iniciar sesión. Existen dos perfiles principales:

- **Estudiante:** Acceso completo a las herramientas de simulación, tutoría de inteligencia artificial y almacenamiento de mapas. *(Si eres nuevo, puedes registrarte directamente. Por defecto obtendrás este rol).*
- **Administrador:** Además de las herramientas de simulación, posee capacidades adicionales para gestionar usuarios y escenarios globales.

*Nota: Una vez iniciada la sesión, tus proyectos (mapas de paredes y routers) se guardarán automáticamente bajo tu usuario.*

---

## 2. Editor Interactivo de Planos (El Lienzo)

El núcleo de la aplicación es la cuadrícula o grilla bidimensional donde diseñas la distribución espacial de tu entorno.
![alt text](<../assets/Manual/Captura de pantalla 2026-06-11 095607.png>)
![alt text](<../assets/Manual/Captura de pantalla 2026-06-11 094119.png>)

### Dibujar Paredes y Obstáculos
1. En el panel de herramientas, selecciona el modo **"Paredes"**.
2. Elige el **Material**: Puedes seleccionar entre Aire, Drywall, Ladrillo, Concreto o Metal. Cada material tiene un factor de atenuación diferente que bloqueará la señal de forma realista.
3. Haz clic (o mantén presionado y arrastra) sobre las celdas de la cuadrícula para dibujar el obstáculo. 
4. Si te equivocas, selecciona el material "Aire" (o la herramienta de borrar si está disponible) y pásala sobre el obstáculo para eliminarlo.
   
![alt text](<../assets/Manual/Captura de pantalla 2026-06-11 093831.png>)
![alt text](<../assets/Manual/Captura de pantalla 2026-06-11 093928.png>)

### Colocar el Router
1. Selecciona el modo **"Routers"**.
2. Elige un modelo comercial del catálogo disponible (Ej. TP-Link, Ubiquiti, etc.). Cada router tiene sus propias características de potencia de transmisión (EIRP) y banda de frecuencia (2.4 GHz o 5 GHz).
3. Haz clic en una celda vacía para colocar el dispositivo.
 

![alt text](<../assets/Manual/Captura de pantalla 2026-06-11 094155.png>)
![alt text](<../assets/Manual/Captura de pantalla 2026-06-11 095616.png>)
![alt text](<../assets/Manual/Captura de pantalla 2026-06-11 094220.png>)

---

## 3. Configuración y Ejecución de la Simulación

SimuNet WiFi te permite visualizar cómo las ondas electromagnéticas se comportan al chocar contra las paredes que dibujaste.

1. **Método Matemático:** Selecciona el método numérico a usar:
   - **Jacobi:** Más lento, pero excelente para entender paso a paso cómo se propaga el cálculo.
   - **Gauss-Seidel:** Una versión mejorada y más rápida que Jacobi.
   - **SOR (Sobre-Relajación Sucesiva):** El método más rápido y recomendado. Te permitirá ajustar el factor de relajación ($\omega$) para experimentar con la velocidad de convergencia.
2. **Ejecución Animada vs. Instantánea:** 
   - Presiona **"Simular Paso a Paso"** (o Animada) para ver visualmente cómo la señal se propaga iteración por iteración.
   - Presiona **"Simulación Instantánea"** para calcular directamente el mapa de calor final.

El mapa de calor final usará una escala de colores para indicarte la calidad de la señal (Excelente, Buena, Regular, Mala) y podrás pasar el cursor sobre cualquier celda para ver su potencia exacta en **dBm**.

![alt text](<../assets/Manual/Captura de pantalla 2026-06-11 094503.png>)

---

## 4. Herramientas Avanzadas

### 🎯 Optimización de la Ubicación del Router
¿No sabes dónde colocar el router para tener la mejor señal? 
1. Dibuja todas las paredes de tu casa o recinto.
2. Ve a la sección de **Optimización** y haz clic en buscar mejor ubicación.
3. El sistema evaluará múltiples coordenadas y te recomendará las **Mejores Zonas** (ej. "Zona Norte-Oeste"), asegurando el mejor equilibrio entre porcentaje de cobertura y potencia promedio.
 ![alt text](<../assets/Manual/Captura de pantalla 2026-06-11 094623.png>)
 ![alt text](<../assets/Manual/Captura de pantalla 2026-06-11 094616.png>)

### 📊 Comparativa de Convergencia
Si estás estudiando los métodos numéricos, puedes abrir el panel de gráficas. Aquí verás cómo cae el error residual en cada iteración y podrás comparar objetivamente por qué SOR es superior a Jacobi en este modelo.
![alt text](<../assets/Manual/Captura de pantalla 2026-06-11 095014.png>)

### 📄 Exportación de Informes Técnicos
Una vez terminada tu simulación, puedes exportar los datos:
- **Archivo TXT / PDF:** Un informe legible con el resumen de la cobertura, el método usado y los tiempos de convergencia.
- **Archivo CSV:** Los datos crudos de la matriz final de señal para analizarlos externamente (ej. en Excel o Python).

---

## 5. Personalización

- **Modo Oscuro / Claro:** Encuentra el interruptor en la barra de navegación superior (ícono de luna/sol) para adaptar la plataforma a tus preferencias visuales.


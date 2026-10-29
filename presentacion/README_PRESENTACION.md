# Carpeta Oficial de Presentación — Feria de la Física 2026
**Título del Proyecto (ES):** *Modelado computacional de la propagación e intensidad de campo electromagnético UHF/SHF en recintos con materiales dieléctricos*  
**Project Title (EN):** *Computational modeling of UHF/SHF electromagnetic field propagation and intensity in enclosures with dielectric materials*  
**Autor:** Juan David Conde Duarte (C.C. `1102349090`, Tel. `3152689034`, `juan.conde2@unipamplona.edu.co`) — Ingeniería de Sistemas, Universidad de Pamplona  
**Profesora Tutora:** Gladys Liliana Bautista Wilches (`gladys.bautista@unipamplona.edu.co`) — Asignatura: Electromagnetismo  
**Categoría:** Computacional  
**Estado de Inscripción:** **PAGADA Y APROBADA** (No. Pago: `162327` | ID Pago: `2001022977651` | Ticket: `200102297765162327` | Transacción PSE: `762304788`)

---

## Contenido de esta Carpeta (`presentacion/`)

1. **[`01_Inscripcion_y_Revisiones_Feria_Fisica_2026.md`](./01_Inscripcion_y_Revisiones_Feria_Fisica_2026.md)**  
   Documento completo que cubre las **3 Revisiones Oficiales** exigidas por el Departamento de Física:
   - **1ª Revisión (Planteamiento e Inscripción):** Título exacto, autores, resumen ($\le 250$ palabras cumpliendo reglamento), palabras clave capitalizadas, modalidad, objetivos y método numérico.
   - **2ª Revisión (Desarrollo):** Marco teórico electromagnético (Vector de Poynting, campo eléctrico eficaz $E_{\text{rms}}$, permitividad $\varepsilon_r$, conductividad $\sigma$, Ley de Beer-Lambert y EDP estacionaria en 2D) y metodología en Diferencias Finitas + SOR.
   - **3ª Revisión (Calificación Final):** Tablas comparativas de convergencia (Jacobi vs. Gauss-Seidel vs. SOR), resultados en $2.4\text{ GHz}$ y $5.0\text{ GHz}$, Jaula de Faraday y validación frente al modelo analítico ITU-R P.1238 ($R^2 = 0.978$, $\text{RMSE} = 1.84\text{ dB}$).

2. **[`02_Carta_Aval_y_Permiso_Academico.md`](./02_Carta_Aval_y_Permiso_Academico.md)**  
   - **Carta de Aval Docente** lista para imprimir y firmar por la profesora **Gladys Liliana Bautista Wilches** y **Juan David Conde Duarte** (requisito obligatorio para el $100\%$ del segundo parcial).
   - **Formato de Solicitud de Permiso Académico** para presentar ante los demás docentes el día del evento.

3. **[`03_Documento_Estudio_Profundo_Electromagnetismo.md`](./03_Documento_Estudio_Profundo_Electromagnetismo.md)**  
   Manual de estudio intensivo diseñado para dominar toda la física del proyecto:
   - Qué sí exponer y qué no exponer para blindar tu defensa ante el jurado de Física.
   - Explicación paso a paso desde las ecuaciones de Maxwell, el Vector de Poynting $\langle S \rangle$, la impedancia del vacío $\eta_0 = 376.73\,\Omega$, el campo eléctrico $E_{\text{rms}}$ ($\text{V/m}$), el efecto pelicular $\delta$ en la Jaula de Faraday y la discretización en Diferencias Finitas.
   - **Respuestas exactas a las 5 preguntas obligatorias de la defensa oral** de la guía oficial de la Feria de la Física.

4. **[`04_Guion_Presentacion_y_Diapositivas.md`](./04_Guion_Presentacion_y_Diapositivas.md)**  
   Guion estructurado minuto a minuto ($5\text{ minutos}$), diccionario completo de términos físicos/matemáticos/computacionales y explicación paso a paso de los 6 procesos internos del software.

5. **[`05_Presentacion_Interactiva_Feria_Fisica.html`](./05_Presentacion_Interactiva_Feria_Fisica.html)**  
   Presentación interactiva de 12 diapositivas en formato web (con ecuaciones renderizadas en $\LaTeX$/KaTeX y gráficas de alta resolución). Ábrela con doble clic en cualquier navegador y usa las flechas `⬅` / `➡` para navegar.

6. **Carpeta [`poster/`](./poster/) (Versiones completas en Español e Inglés)**  
   - **En Español:**
     - [`Poster_feria_Fisica_2026.tex`](./poster/Poster_feria_Fisica_2026.tex): Código fuente oficial en $\LaTeX$ (`beamerposter`, $80 \times 120\text{ cm}$ vertical) en español.
     - [`Poster_Visual_80x120cm.html`](./poster/Poster_Visual_80x120cm.html): Vista previa visual e imprimible ($80 \times 120\text{ cm}$) en español (con botón selector de idioma ES/EN).
     - [`Imagenes/fig_mapas_campo.png`](./poster/Imagenes/fig_mapas_campo.png) y [`Imagenes/fig_validacion_y_convergencia.png`](./poster/Imagenes/fig_validacion_y_convergencia.png): Figuras científicas a $300\text{ DPI}$ en español.
   - **En Inglés:**
     - [`Poster_feria_Fisica_2026_EN.tex`](./poster/Poster_feria_Fisica_2026_EN.tex): Código fuente oficial en $\LaTeX$ (`beamerposter`, $80 \times 120\text{ cm}$ vertical) en inglés.
     - [`Poster_Visual_80x120cm_EN.html`](./poster/Poster_Visual_80x120cm_EN.html): Vista previa visual e imprimible ($80 \times 120\text{ cm}$) en inglés (con botón selector de idioma ES/EN).
     - [`Imagenes/fig_mapas_campo_en.png`](./poster/Imagenes/fig_mapas_campo_en.png) y [`Imagenes/fig_validacion_y_convergencia_en.png`](./poster/Imagenes/fig_validacion_y_convergencia_en.png): Figuras científicas a $300\text{ DPI}$ en inglés.
   - **Documento Maestro Bilingüe:**
     - [`Poster_Texto_Completo_ES_EN.md`](./poster/Poster_Texto_Completo_ES_EN.md): Texto íntegro estructurado del póster tanto en español como en inglés.

7. **Soportes Oficiales de Pago de Inscripción (Incluidos en esta carpeta):**
   - **[`06_Soporte_Pago_Inscripcion_ZonaPagos_162327.pdf`](./06_Soporte_Pago_Inscripcion_ZonaPagos_162327.pdf):** Comprobante oficial de pago aprobado por ZonaPAGOS / Universidad de Pamplona (`\$30,000.00 COP`, No. pago `162327`, ID pago `2001022977651`, Ticket `200102297765162327`, Cód. Transacción PSE `762304788`).
   - **[`07_Liquidacion_Inscripcion_Unipamplona.pdf`](./07_Liquidacion_Inscripcion_Unipamplona.pdf):** Recibo de liquidación de inscripción de la Universidad de Pamplona.

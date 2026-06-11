# SimuNet WiFi

Simulador educativo de cobertura WiFi 2D basado en la **ecuación de Laplace**, desarrollado para la Universidad de Pamplona.

Resuelve el campo electromagnético simplificado sobre una malla discreta usando métodos iterativos (**Jacobi**, **Gauss-Seidel**, **SOR**) y visualiza la intensidad de señal en dBm.

## Características

- Editor interactivo de planos (paredes con materiales, routers comerciales)
- Simulación animada paso a paso o resolución instantánea
- Comparativa de métodos numéricos con gráficas de convergencia
- Optimización automática de ubicación del router
- Guardado de diseños por usuario
- Informes técnicos exportables (.txt / CSV)
- Tutor IA integrado (Dr. SimuNet) con Gemini
- Modo oscuro / claro

## Requisitos

- Node.js 18+
- Clave API de Gemini (opcional, para el chat tutor)

## Instalación

```bash
npm install
cp .env.example .env
# Editar .env y agregar GEMINI_API_KEY
```

## Desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

## Producción

```bash
npm run build
npm start
```

## Credenciales de demostración

| Usuario | Contraseña | Rol |
|---------|-----------|-----|
| `admin_pamplona` | `admin123` | Administrador |
| `estudiante_pamplona` | *(sin contraseña)* | Estudiante |

Los nuevos registros se crean siempre como **estudiante**.

## Arquitectura (5 capas)

Ver documentación completa en [ARQUITECTURA.md](./ARQUITECTURA.md).

```
src/
├── capa1-dominio/      # Tipos, modelos, presets
├── capa2-interfaz/     # App.tsx + componentes React
├── capa3-aplicacion/  # Hooks + traducción i18n
├── capa4-numerico/     # Solver Laplace + Jacobi/GS/SOR
└── capa5-servicios/    # Auth, reportes, conversiones dBm
```

## Modelo físico

Este simulador usa Laplace 2D como **aproximación educativa**. No sustituye herramientas RF profesionales (ray-tracing, modelos log-distance, multipath).

## Licencia

Proyecto académico — Universidad de Pamplona © 2026

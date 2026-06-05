# 🌱 AgroSmart

> Aplicación móvil de **soporte a la toma de decisiones (DSS)** para la preparación técnica de
> mezclas de agroquímicos y la evaluación de riesgo ambiental en la **fumigación con dron**.
> Construida con **React Native + Expo + TypeScript**, **sin backend**: todo corre en el dispositivo.

---

## 📖 Contexto del proyecto

AgroSmart nace de un caso de estudio real: un cultivo de **arroz de 8 hectáreas** en la **Vereda
Llanogrande, Campoalegre (Huila), Colombia** (coordenadas `2.6833, -75.3167`), donde la fumigación
con dron se hace por experiencia del operador, sin validación técnica de la mezcla ni verificación
de las condiciones climáticas.

Esto genera tres problemas concretos, documentados en el informe (`contexto_agrosmart/`):

1. **Sobredosificación** — el producto AGROTIN se aplicaba a `21.6 ml/L` cuando el máximo de etiqueta
   es `10 ml/L` (más del doble).
2. **Saturación del tanque** — sin control de la carga química respecto al volumen del tanque del dron.
3. **Sin registro auditable** — ninguna evidencia ante una inspección del ICA o la CAM.

AgroSmart corrige esto **antes** de cada fumigación: calcula la mezcla correcta, valida concentración
y carga química, evalúa el clima y la cercanía a fuentes de agua, y registra cada sesión. La app
**advierte, valida y registra; NO controla el dron ni reemplaza la decisión final del operador.**

### ¿Para quién es?

Tres perfiles con permisos diferenciados (RBAC):

| Rol | Qué hace |
|-----|----------|
| **Agricultor** (dueño) | Consulta historial y KPIs, agrega lote, exporta reportes |
| **Supervisor** | Crea sesiones, edita la base de productos, override de alerta amarilla |
| **Operador del dron** | Crea sesiones y **es el único que puede hacer override de una alerta roja** (con motivo) |

---

## ⚙️ ¿Qué hace la app? (6 módulos)

El flujo de una fumigación es un **asistente de 5 pasos** (≤ 5 minutos):

1. **M1 · Ingreso de datos** — área del lote, GPS, producto, dosis, capacidad del tanque.
2. **M2 · Cálculo de mezcla** — invierte la lógica empírica: parte de la dosis y calcula el agua
   necesaria para la concentración correcta. Sugiere el orden de adición (regla W-A-L-E-S).
3. **M3 · Validación técnica** — semáforo 🟢🟡🔴 según concentración vs etiqueta, carga química
   (límite 30 % del tanque) y compatibilidad entre productos.
4. **M4 · Integración ambiental** — clima en tiempo real (viento, lluvia, temperatura, humedad,
   punto de rocío) desde **Open-Meteo** + distancia a cuerpos de agua → semáforo de riesgo y
   **ventana óptima de fumigación (72 h)**.
5. **M5 · Decisión** — combina los semáforos, exige confirmación según la severidad y registra la
   decisión en una **bitácora con checksum**.
6. **M6 · Reportes y KPIs** — historial filtrable y dashboard de indicadores (export PDF/CSV: opcional).

---

## 🧱 Stack y arquitectura

- **React Native + Expo (SDK 56) + TypeScript** — app móvil, **sin servidor**.
- **expo-router** (navegación) · **Zustand** (estado) · **expo-sqlite** (datos locales).
- **Open-Meteo** (clima, gratis y **sin API key**) · mapa con **Leaflet + OpenStreetMap + radar
  RainViewer** dentro de un WebView (**sin API key**, sin Google Cloud).
- Arquitectura limpia en **3 capas** con organización por *features*:

```
app/        Rutas de expo-router (delgadas) + guards por rol (RBAC)
src/
  core/     DOMINIO PURO — TypeScript sin dependencias de UI/red/Expo.
            Aquí viven los cálculos (M1–M6), el RBAC y el semáforo. 100% testeable.
  services/ Datos/servicios: cliente Open-Meteo, RainViewer, HTTP, checksum.
  data/     Persistencia local con expo-sqlite (productos, bitácora, caché de clima).
  stores/   Estado global con Zustand (perfil, ajustes, borrador de sesión).
  shared/   Design system de marca (colores, tipografía Inter, componentes), hooks, config.
  features/ Pantallas + lógica por feature (session, environment, decision, history, …).
```

> La **regla de dependencias** (el dominio nunca importa UI/Expo/red) está **blindada con ESLint**:
> si alguien la viola, falla el lint.

---

## ✅ Requisitos previos

| Herramienta | Versión | Para qué |
|-------------|---------|----------|
| **Node.js** | 18 o superior | ejecutar la app y las herramientas |
| **npm** | 9+ (viene con Node) | instalar dependencias |
| **Git** | cualquiera | clonar el repositorio |

Para **correr la app en un teléfono/emulador** necesitas **una** de estas dos opciones:

- **Opción A (local):** [Android Studio](https://developer.android.com/studio) con el **Android SDK**
  y un emulador o un teléfono Android (9+) con depuración USB. Requiere también **JDK 17**.
- **Opción B (nube, sin instalar Android SDK):** una cuenta gratuita de [Expo](https://expo.dev) para
  compilar con **EAS Build** (`npm i -g eas-cli`).

> ⚠️ AgroSmart se ejecuta con un **development build** (no con la app Expo Go genérica): usa módulos
> nativos (expo-sqlite, react-native-webview) y va sobre un SDK reciente. Los pasos están más abajo.

---

## 🚀 Puesta en marcha

### 1. Clonar e instalar

```bash
git clone <URL-DEL-REPO>
cd AgroSmart
npm install
```

### 2. Verificar que todo está sano (no requiere teléfono)

```bash
npm test         # 43 tests del dominio (cálculos, validación, RBAC, decisión)
npm run typecheck # TypeScript sin errores
npm run lint      # ESLint, incluida la regla de capas
```

### 3. Correr en Android

**Opción A — build local (con Android Studio instalado):**

```bash
npx expo prebuild         # genera el proyecto nativo android/ (una sola vez)
npx expo run:android      # compila, instala y abre el dev client en tu emulador/teléfono
```

**Opción B — build en la nube con EAS (sin Android SDK local):**

```bash
npm install -g eas-cli
eas login
eas build --profile development --platform android
# Descarga el .apk que te da EAS, instálalo en el teléfono, y luego:
npx expo start --dev-client
```

En ambos casos, tras la primera instalación basta con `npx expo start --dev-client` para el día a día.

> **¿Solo quieres comprobar que el proyecto compila, sin instalar nada?**
> `npx expo export --platform android` genera el *bundle* completo sin necesidad de emulador.

---

## 🧪 Verificación funcional

- **Dominio (lo crítico):** `npm test`. Caso ancla **AGROTIN** (8 ha, 0.25 L/ha, objetivo 10 ml/L) →
  `D_total = 2 L`, `V_agua = 198 L`, `V_total = 200 L`, `Carga_Q = 5 %`, semáforo 🟢.
  Caso **AS-IS** (21.6 ml/L) → alerta 🔴.
- **Flujo end-to-end en la app:** elegir rol → *Nueva fumigación* → M1 → M2 → M3 → M4 → M5.
  El override de alerta 🔴 exige un motivo de **≥ 20 caracteres** y **solo lo permite el operador**.
- **Offline:** los módulos M1–M3 funcionan sin conexión; M4 usa el último clima cacheado e indica su
  antigüedad.

---

## 🔐 Datos y privacidad

No hay servidor. Toda la información (sesiones, bitácora, base de productos, caché de clima) se guarda
**localmente en el dispositivo** con SQLite. La selección de perfil es local (sin contraseña): el RBAC
sirve para la **consistencia** del flujo, no como mecanismo de seguridad. El clima viene de Open-Meteo
y el radar de RainViewer; **no se exponen claves ni secretos** en la app.

---

## 📋 Scripts disponibles

| Comando | Qué hace |
|---------|----------|
| `npm start` | Inicia Metro / Expo |
| `npm run android` | Inicia en Android |
| `npm test` | Tests del dominio (Vitest) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run prebuild` | Genera el proyecto nativo (`expo prebuild`) |

---

## 🧩 Decisiones de dominio pendientes

Algunas reglas dependen de validación **agronómica** y están marcadas en el código con su identificador:

- **D-MIX** — ¿la mezcla del piloto es de un solo producto o de varios a la vez?
- **D-PRODDATA** — falta confirmar, por producto, la **categoría de adición** (orden W-A-L-E-S) y las
  **incompatibilidades**.
- **D-PRECIP** — definición exacta de "probabilidad de precipitación a 2 h".
- **D-HASH** — el checksum de la bitácora es **local** (detecta alteraciones accidentales, no garantiza
  no-repudio: eso exigiría backend o firma con Android Keystore).

Cada identificador aparece como comentario en el archivo de dominio correspondiente
(p. ej. busca `D-PRODDATA` en [src/data/seed/products.seed.ts](src/data/seed/products.seed.ts)).

---

## 📚 Contexto académico

Proyecto Integrado de Ingeniería (PII 2026-1). El material de origen (informe y anexos con FMEA,
fórmulas, umbrales y matriz RBAC) está en `contexto_agrosmart/` y **no forma parte del código** de la app.

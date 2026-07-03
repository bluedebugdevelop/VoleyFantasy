# 🏐 VoleyFantasy

Fantasy de la **Superliga española de voleibol (RFEVB)**, al estilo de LaLiga Fantasy:
ficha jugadores reales, alinea tu equipo, compite en ligas con tus amigos y gana
puntos con las estadísticas oficiales que publica la RFEVB en
[rfevb-web.dataproject.com](https://rfevb-web.dataproject.com/Statistics.aspx?ID=153&PID=187).

Todo el stack es **gratuito**: Expo + React Native, Firebase (plan Spark) y
GitHub Actions para la actualización diaria de datos.

## Características

- 🔐 **Cuentas**: registro con email/contraseña e **inicio de sesión con Google** (Firebase Auth).
- 🏐 **Mi equipo**: pista de vóley con alineación real (colocador, opuesto, 2 centrales, 2 receptores y líbero) + banquillo. Plantilla de 10 jugadores.
- 💰 **Mercado**: cada jugador tiene un valor que **sube o baja cada día según su rendimiento**, con presupuesto inicial de 20 M€.
- 📊 **Puntuación equilibrada** basada en las estadísticas oficiales (saque, recepción, ataque, bloqueo) con ajustes por posición.
- 🏆 **Ligas**: una **Liga General pública** (todos los usuarios) y **ligas privadas** con código de invitación de 6 caracteres.
- 🎨 Estética con los colores de la RFEVB (azul marino, rojo y amarillo).
- 📱 Lista para compilar y publicar en **Play Store y App Store** con EAS.
- 🧪 **Modo demo**: sin configurar Firebase, la app funciona con los **datos reales scrapeados** de la RFEVB empaquetados en la propia app ([src/data/jugadoresReales.json](src/data/jugadoresReales.json), 303 jugadores de la temporada actual) y todo se guarda en el dispositivo.

## Sistema de puntuación

| Acción | Puntos |
|---|---|
| Set jugado | +1 (×2 líbero y colocador) |
| Victoria | +2 |
| Ace | +3 |
| Error de saque | −0,5 |
| Punto de ataque | +1 |
| Error de ataque | −1 |
| Ataque bloqueado | −0,5 |
| Bloqueo punto | +2,5 (×1,2 central, ×1,3 colocador) |
| Recepción perfecta (`#`) | +0,5 (×1,5 líbero, ×1,2 receptor) |
| Recepción positiva (`!`/`+`) | +0,2 (mismos multiplicadores) |
| Error de recepción (`=`) | −1 |
| Colocación excelente | +0,5 |
| Error de colocación | −1 |
| Bonus eficacia de ataque > 50 % (mín. 10 ataques) | +2 |

Los multiplicadores por posición equilibran el juego: un líbero (que ni ataca ni
bloquea) o un colocador (que apenas anota) pueden puntuar tanto como un opuesto.
Con los datos reales de la temporada 2025-26 las medias por posición quedan
entre 11 y 17 puntos/partido. Fórmulas en [src/logic/scoring.ts](src/logic/scoring.ts).

## Mercado

- Valor inicial: `150.000 € + media de puntos × 450.000 €` (mínimo 100 K€, máximo 25 M€).
- **Actualización diaria**: el valor varía hasta un ±5 % al día según la *forma*
  (media de las 3 últimas jornadas) comparada con la media de temporada, más un
  pequeño factor de demanda. Fórmulas en [src/logic/market.ts](src/logic/market.ts).

## Estructura

```
VoleyFantasy/
├── app/                  # Pantallas (expo-router)
│   ├── (auth)/           # Login y registro
│   ├── (tabs)/           # Inicio, Mi equipo, Mercado, Ligas
│   ├── jugador/[id].tsx  # Ficha de jugador
│   └── liga/[id].tsx     # Clasificación de liga
├── src/
│   ├── logic/            # Puntuación y mercado (reglas del juego)
│   ├── services/         # Firebase (auth, Firestore) y capa de datos
│   ├── store/            # Estado global (Zustand + AsyncStorage)
│   ├── data/             # Datos semilla para el modo demo
│   └── components/       # UI reutilizable
├── scraper/              # Scraper de rfevb-web.dataproject.com
└── firestore.rules       # Reglas de seguridad de Firestore
```

## Puesta en marcha

### 1. Probar en modo demo (2 minutos)

```bash
cd VoleyFantasy
npm install
npx expo start
```

Escanea el QR con la app **Expo Go** (Android/iOS, SDK 54). Sin configurar nada más, la
app arranca en modo demo con datos de ejemplo.

### 2. Configurar Firebase (gratis, plan Spark)

1. Crea un proyecto en [console.firebase.google.com](https://console.firebase.google.com).
2. **Authentication** → Métodos de acceso → habilita **Correo/contraseña** y **Google**.
3. **Firestore Database** → crear base de datos → pega el contenido de
   [firestore.rules](firestore.rules) en la pestaña Reglas.
4. Configuración del proyecto → Tus apps → **App web** → copia la configuración
   en [src/services/firebase.ts](src/services/firebase.ts).

### 3. Inicio de sesión con Google

1. En [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   (el mismo proyecto de Firebase) crea credenciales **OAuth 2.0**:
   tipo *Web*, *iOS* (bundle `com.voleyfantasy.app`) y *Android*
   (paquete `com.voleyfantasy.app` + huella SHA-1 de tu keystore de EAS).
2. Copia los tres client IDs en `GOOGLE_OAUTH` de
   [src/services/firebase.ts](src/services/firebase.ts).

### 4. Datos reales de la RFEVB

```bash
cd scraper
npm install
npm run scrape          # genera output/jugadores.json
npm run subir           # además sube a Firestore (necesita serviceAccountKey.json)
```

- El `serviceAccountKey.json` se descarga en Firebase → Configuración →
  Cuentas de servicio → Generar nueva clave privada. **No lo subas a git** (ya
  está en `.gitignore`).
- Cada temporada la RFEVB cambia los parámetros `ID` y `PID` de la URL: ajústalos
  con las variables de entorno `RFEVB_ID` y `RFEVB_PID`.
- **Actualización diaria automática y gratuita**: crea un workflow de GitHub
  Actions con `schedule: cron '0 5 * * *'` que ejecute `npm run subir` (guarda la
  clave como secret), o usa el Programador de tareas de Windows.
- Si DataProject cambia la maqueta entre temporadas, revisa el mapeo de columnas
  en [scraper/index.js](scraper/index.js) (funciones `parsearTabla` y `aEstadisticas`).

### 5. Publicar en las stores

```bash
npm install -g eas-cli
eas login                      # cuenta gratuita de Expo
eas init                       # rellena el projectId en app.json
eas build --platform android --profile production   # .aab para Play Store
eas build --platform ios --profile production       # necesita cuenta Apple Developer (99 $/año)
eas submit --platform android
eas submit --platform ios
```

- **Play Store**: cuota única de 25 $ para la cuenta de desarrollador.
- **App Store**: requiere la membresía de Apple Developer.
- Antes de publicar añade tus iconos (`icon.png` 1024×1024 y
  `adaptive-icon.png`) en `app.json` → `expo.icon` / `expo.android.adaptiveIcon`.

## Cómo funciona por dentro

- **Estado**: Zustand con persistencia en AsyncStorage; con Firebase configurado,
  la plantilla, el presupuesto y las ligas se sincronizan con Firestore
  ([src/store/juego.ts](src/store/juego.ts)).
- **Jornadas**: los puntos de cada jugador se calculan a partir de sus
  estadísticas por jornada; los puntos del usuario son la suma de los 7 alineados.
- **Mercado diario**: en producción los valores los actualiza el scraper cada
  día; en modo demo se recalculan localmente una vez por día natural.

## Hoja de ruta (ideas)

- Cláusulas de rescate y pujas ciegas entre usuarios (mercado tipo Biwenger).
- Notificaciones push (expo-notifications) al cierre de mercado y fin de jornada.
- Histórico de puntos del usuario por jornada guardado en Firestore.
- Modo femenino / Superliga 2 cambiando `RFEVB_ID`/`RFEVB_PID`.

---

Proyecto sin afiliación oficial con la RFEVB. Los datos estadísticos pertenecen a
sus autores; úsalos de forma responsable (scraping con moderación, 1 vez/día).

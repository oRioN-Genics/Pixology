# Pixology — Game Asset Design Platform

> A fast, browser‑based 2D asset creator for indie devs. Design static sprites or frame‑by‑frame animations, then export ready‑to‑use sprite sheets that drop straight into your game engine (tested with Godot).

<p align="center">
  <img src="https://img.shields.io/badge/Frontend-React%20%2B%20Vite-blue" alt="React Vite"/>
  <img src="https://img.shields.io/badge/Styles-TailwindCSS-38B2AC" alt="Tailwind"/>
  <img src="https://img.shields.io/badge/Backend-Spring%20Boot-6DB33F" alt="Spring Boot"/>
  <img src="https://img.shields.io/badge/Database-MongoDB-47A248" alt="MongoDB"/>
  <img src="https://img.shields.io/badge/Export-Sprite%20Sheets-success" alt="Export"/>
</p>

---

## ✨ Highlights

* **Sign up / Log in** – user accounts for saving projects
* **New Project Wizard** – up to **256×256 px** canvas
* **Static Mode** – quick single‑frame icons & tiles
* **Animation Mode** – timeline with multiple frames, loop modes (forward/backward/ping‑pong), custom FPS
* **Live Preview** – pixel‑perfect real‑time animation preview with adjustable FPS
* **Project Library** – edit later, mark as favorite, delete
* **Export** – **PNG/JPG sprite sheets** (grid with up to 10 frames per row)
* **Engine‑Ready** – verified import into **Godot** with sample demo

> Demo video: https://www.linkedin.com/posts/sathsara-anuradha-275a05278_gamedev-indiedev-pixelart-activity-7364727542357872640-LDlJ?utm_source=share&utm_medium=member_desktop&rcm=ACoAAEPH2zkBSFgOHadJMjdAZxv8otCSrjBX54k

---

## 🧱 Architecture

```
root/
├─ frontend/                  # React + Vite + Tailwind
│  ├─ public/
│  ├─ src/
│  │  ├─ assets/
│  │  ├─ components/         # Canvas, PreviewWindow, Timeline, etc.
│  │  ├─ pages/
│  │  ├─ api.js
│  │  ├─ App.jsx
│  │  ├─ index.css
│  │  └─ main.jsx
│  ├─ index.html
│  ├─ package.json
│  ├─ vite.config.js
│  └─ vercel.json
│
├─ backend/                   # Spring Boot (Java)
│  ├─ src/main/java/com/pixology/backend
│  │  ├─ config/             # CorsConfig, SecurityConfig
│  │  ├─ project/            # project domain logic
│  │  ├─ user/               # user domain logic
│  │  └─ PixologyBackendApplication.java
│  ├─ src/main/resources/
│  │  └─ application.properties
│  ├─ src/test/
│  ├─ pom.xml
│  └─ Dockerfile
│
└─ README.md
```

### Data Model (simplified)

```json
{
  "Project": {
    "_id": "...",
    "userId": "...",
    "name": "Campfire",
    "width": 128, "height": 128,
    "kind": "STATIC | ANIMATION",
    "frames": [
      {
        "_id": "frame-1",
        "name": "Frame 1",
        "selectedLayerId": "layer-1",
        "layers": [
          { "_id": "layer-1", "name": "Layer 1", "visible": true, "locked": false, "pixels": [[null, "#FFAA00", ...]] }
        ]
      }
    ],
    "favorite": false,
    "createdAt": "...", "updatedAt": "..."
  }
}
```

---

## 🚀 Getting Started

### Prerequisites

* Node.js ≥ 18
* Java 17 (or 21) & Maven
* MongoDB (Atlas or local)

### 1) Backend (Spring Boot)

```bash
cd backend
# configure MongoDB & CORS (see below), then run:
./mvnw spring-boot:run
# or
mvn spring-boot:run
```

**`src/main/resources/application.properties`**

```properties
spring.application.name=pixology
spring.data.mongodb.uri=mongodb+srv://<user>:<pass>@<cluster>/<db>?retryWrites=true&w=majority
server.port=3001
# CORS (example for Vercel frontend)
spring.web.cors.allowed-origins=http://pixology-six.vercel.app/
spring.web.cors.allowed-methods=GET,POST,PUT,DELETE,PATCH,OPTIONS
spring.web.cors.allowed-headers=*
```

### 2) Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev
```

**`.env`**

```
VITE_API_URL=http://localhost:3001
```

---

## 🧪 Useful Scripts

**Frontend**

```bash
npm run dev        # start Vite dev server
npm run build      # production build
npm run preview    # preview build locally
```

**Backend**

```bash
mvn spring-boot:run
mvn test
mvn package        # creates jar in target/
```

---

## 🔌 API (preview)

> Base URL: `${VITE_API_URL}` (e.g., [http://localhost:3001](http://localhost:3001))

### Auth

* `POST /api/auth/signup` – create user
* `POST /api/auth/login` – issue session/JWT (implementation may vary)

### Projects

* `GET /api/projects` – list user projects
* `POST /api/projects` – create
* `GET /api/projects/:id` – read
* `PUT /api/projects/:id` – update
* `DELETE /api/projects/:id` – delete

### Export

* `POST /api/exports/spritesheet` –

  * **body**: `{ projectId, format: "png" | "jpg" }`
  * **returns**: downloadable file (sprite sheet in grid, max 10 frames per row)

---

## 🧰 Key Features in Detail

### Canvas & Tools

* Pixel grid with adjustable cell size
* Brush, eraser, fill (tolerance/contiguous), color picker
* Layers per frame with visibility/lock
* History (undo/redo) and copy from previous frame

### Animation Timeline

* Create, rename, and order animations
* Per‑animation **loop modes**: forward / backward / ping‑pong
* Per‑animation **FPS** with live preview
* **Preview Window** shows the current playing frame and updates selection

### Export to Sprite Sheet

* Choose PNG or JPG
* Output as grid layout (up to **10 frames per row**)

### Godot Integration

1. Export a sprite sheet (PNG)
2. In Godot, create a `Sprite2D` or `AnimatedSprite2D`
3. Import as `Sprite Frames` or `SpriteSheet` and set frame size to your project dimensions

---

## 🧭 Roadmap

* [ ] Onion‑skin controls (prev/next frames, fade, tint presets)
* [ ] Selection/move/transform tools
* [ ] Palette manager & swatches
* [ ] Keyboard shortcuts & command palette
* [ ] Team workspaces & sharing links
* [ ] Export metadata (`.json`) for engines (Godot, Unity)
* [ ] **3D‑ready pipeline exploration** (non‑breaking upgrades to renderer & data model)

---

## 🐞 Known Issues / Notes

* During heavy preview playback, some UI events (e.g., nav to Library/home) may feel unresponsive on certain browsers; optimizing render loops is in progress.
* Toast auto‑dismiss timing can conflict with animation render cycles; will be decoupled.

If you hit something else, please open an issue with repro steps, browser, and console logs.

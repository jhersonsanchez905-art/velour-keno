<div align="center">
  <a href="https://velour-keno.onrender.com">
    <img src="docs/logo.png" alt="Velur Keno" width="120">
  </a>
  <h1>VELOUR KENO</h1>
  <p><em>Números. Poder. Distinción.</em></p>

  <p>
    <a href="https://velour-keno.onrender.com" target="_blank">
      <img src="https://img.shields.io/badge/Live%20Demo-velour--keno.onrender.com-6B0F1A?style=for-the-badge&logo=render" alt="Live Demo">
    </a>
    <a href="https://github.com/jhersonsanchez905-art/velour-keno">
      <img src="https://img.shields.io/badge/Java-17-orange?style=for-the-badge&logo=openjdk" alt="Java 17">
    </a>
    <a href="https://spring.io/projects/spring-boot">
      <img src="https://img.shields.io/badge/Spring%20Boot-3.5-6DB33F?style=for-the-badge&logo=springboot" alt="Spring Boot 3.5">
    </a>
    <img src="https://img.shields.io/badge/PostgreSQL-17-4169E1?style=for-the-badge&logo=postgresql" alt="PostgreSQL 17">
    <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker" alt="Docker">
  </p>
</div>

---

## Description

**Velour Keno** is a premium online multiplayer Keno casino built for players who demand elegance, speed, and precision. Every detail — from the wine-red and gold palette to the synchronized real-time draws — is crafted to deliver a first-class gaming experience.

Keno is a classic lottery-style game where players pick numbers from 1 to 80, and winning numbers are drawn at regular intervals. Velour Keno elevates this experience with multiplayer rooms, live WebSocket synchronization, hot/cold statistics, and a sophisticated virtual credits economy.

> "The only Keno designed for those who leave nothing to chance."

---

## Features

- ✦ **Multiplayer rooms** — Join or create rooms with 3–5 players per session
- ✦ **Synchronized draws** — Automated draws every 3:30 minutes with real-time countdown
- ✦ **Real-time WebSocket communication** — Instant updates via STOMP over WebSocket
- ✦ **In-room chat** — Communicate with other players during the game
- ✦ **JWT + Google OAuth2 authentication** — Secure login with email or Google
- ✦ **Virtual credits system** — Recharge credits through a built-in modal; 1,000 free on sign-up
- ✦ **Hot/cold numbers statistics** — Visual feedback on frequently and infrequently drawn numbers
- ✦ **Premium Velour design** — Dark theme with signature wine red (`#6B0F1A`) and gold (`#C9A84C`) palette

---

## Tech Stack

| Layer        | Technology                                      |
|--------------|-------------------------------------------------|
| Backend      | Spring Boot 3.5, Java 17, Maven 3.9             |
| Auth         | JWT (jjwt), Google OAuth2                       |
| Realtime     | WebSocket, STOMP protocol                       |
| Database     | PostgreSQL 17                                   |
| Frontend     | HTML5, CSS3 (custom properties), Vanilla JS     |
| Deploy       | Render (Docker container)                       |
| CI/CD        | GitHub Actions                                  |

---

## Local Installation

### Prerequisites

- Java 17+
- Maven 3.9+
- PostgreSQL 17
- Git

### Steps

1. **Clone the repository**

   ```bash
   git clone https://github.com/jhersonsanchez905-art/velour-keno.git
   cd velour-keno
   ```

2. **Create the database**

   ```bash
   psql -U postgres -c "CREATE DATABASE velour_keno;"
   ```

3. **Configure environment variables**

   ```bash
   export DATABASE_URL=jdbc:postgresql://localhost:5432/velour_keno
   export JWT_SECRET=your-256-bit-secret-key-here
   export SPRING_DATASOURCE_USERNAME=postgres
   export SPRING_DATASOURCE_PASSWORD=your-password
   export CORS_ALLOWED_ORIGINS=http://localhost:8080
   export PORT=8080
   ```

   Or create `src/main/resources/application.properties`:

   ```properties
   spring.datasource.url=${DATABASE_URL}
   spring.datasource.username=${SPRING_DATASOURCE_USERNAME}
   spring.datasource.password=${SPRING_DATASOURCE_PASSWORD}
   jwt.secret=${JWT_SECRET}
   cors.allowed-origins=${CORS_ALLOWED_ORIGINS}
   server.port=${PORT}
   ```

4. **Run the application**

   ```bash
   mvn spring-boot:run
   ```

5. **Open in your browser**

   ```
   http://localhost:8080
   ```

---

## Environment Variables

| Variable                | Description                          | Example                                    |
|-------------------------|--------------------------------------|--------------------------------------------|
| `DATABASE_URL`          | PostgreSQL JDBC connection string    | `jdbc:postgresql://localhost:5432/velour_keno` |
| `JWT_SECRET`            | Secret key for JWT signing           | `my-super-secret-key-256-bits-long`        |
| `SPRING_DATASOURCE_USERNAME` | Database user                  | `postgres`                                 |
| `SPRING_DATASOURCE_PASSWORD` | Database password              | `securepass123`                            |
| `CORS_ALLOWED_ORIGINS`  | Allowed CORS origins                 | `http://localhost:8080`                    |
| `PORT`                  | Application server port              | `8080`                                     |
| `GOOGLE_CLIENT_ID`      | Google OAuth2 client ID _(optional)_ | `123456789-xxxxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET`  | Google OAuth2 client secret _(optional)_ | `GOCSPX-xxxxx`                          |

---

## Project Structure

```
velour-keno/
├── src/main/java/com/velour/keno/
│   ├── config/          # WebSocket, Security, CORS configuration
│   ├── controller/      # REST controllers
│   ├── dto/             # Request/Response DTOs
│   ├── entity/          # JPA entities
│   ├── exception/       # Custom exceptions & handler
│   ├── repository/      # Spring Data JPA repositories
│   ├── scheduler/       # Scheduled draw tasks
│   ├── security/        # JWT filter, provider, user details
│   └── service/         # Business logic services
├── src/main/resources/static/
│   ├── css/             # Stylesheets (styles, auth, navbar)
│   ├── js/              # JavaScript modules (api, auth, navbar, utils)
│   └── *.html           # Pages (index, login, register, game)
├── Dockerfile
└── pom.xml
```

---

## Git Workflow

### Branch Strategy

| Branch       | Purpose                                |
|--------------|----------------------------------------|
| `main`       | Production (protected, direct pushes blocked) |
| `develop`    | Integration branch (protected)         |
| `feature/*`  | New feature development                |
| `fix/*`      | Bug fixes                              |

### Conventional Commits

```
feat: add multiplayer room system
fix: correct payout calculation for 7-number matches
chore: update Maven dependencies to latest
docs: add environment variable table to README
refactor: extract WebSocket message handler
```

---

## Team — 4bytes

| Name              | Role                  | GitHub                                      |
|-------------------|-----------------------|---------------------------------------------|
| Jherson Sánchez   | Tech Lead / Fullstack / Docs | [@jhersonsanchez905-art](https://github.com/jhersonsanchez905-art) |
| Oliver Balaguera  | Frontend Developer    | [@oliverbalaguera](https://github.com/oliverbalaguera) |
| Julián Vera       | Database Developer    | [@julianvera](https://github.com/julianvera)     |
| Jairo Florez      | Backend Developer     | [@jairoflorez](https://github.com/jairoflorez)   |

---

## License

MIT License © 2026 Velour Keno — **4bytes Team**

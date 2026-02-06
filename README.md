# 💬 Chat Me

A real-time chat application built with modern technologies featuring WebSocket communication, room-based messaging, and a sleek dark-themed UI.

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Bun](https://img.shields.io/badge/Bun-000000?style=for-the-badge&logo=bun&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2CA5E0?style=for-the-badge&logo=docker&logoColor=white)

## ✨ Features

- 🔐 **User Authentication** - Sign up / Sign in with JWT tokens
- 💬 **Real-time Messaging** - WebSocket-powered instant messaging
- 🏠 **Room-based Chat** - Create and join chat rooms
- 📜 **Message History** - Last 50 messages stored per room
- 🌙 **Modern Dark UI** - Glassmorphism design with smooth animations
- 🔔 **Live Notifications** - User join/leave alerts
- 📱 **Responsive Design** - Works on all screen sizes

## 🛠️ Tech Stack

### Backend
- **Runtime**: [Bun](https://bun.sh/) - Fast JavaScript runtime
- **Database**: PostgreSQL with [Prisma](https://prisma.io/) ORM
- **Auth**: JWT (JSON Web Tokens)
- **Real-time**: Native WebSocket

### Frontend
- **Framework**: [React](https://react.dev/) 18 with TypeScript
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Build Tool**: [Vite](https://vitejs.dev/)

## 📁 Project Structure

```
chatapp/
├── backend/
│   ├── src/
│   │   ├── auth.ts        # JWT & password utilities
│   │   ├── db.ts          # Prisma client singleton
│   │   └── websocket.ts   # WebSocket handlers
│   ├── prisma/
│   │   └── schema.prisma  # Database schema
│   ├── index.ts           # Main server entry
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── context/       # Auth context
│   │   ├── hooks/         # Custom hooks
│   │   ├── types/         # TypeScript types
│   │   └── api.ts         # API client
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- [Bun](https://bun.sh/) v1.0+
- [Node.js](https://nodejs.org/) v18+ (for frontend)
- PostgreSQL database (or use [Neon](https://neon.tech/) for free)

### Local Development

#### 1. Clone the repository

```bash
git clone https://github.com/395ShikharSingh/Chat_Me.git
cd Chat_Me
```

#### 2. Setup Backend

```bash
cd "backend "

# Install dependencies
bun install

# Setup environment
cp .env.example .env
# Edit .env with your DATABASE_URL and JWT_SECRET

# Push database schema
bunx prisma db push

# Generate Prisma client
bunx prisma generate

# Start the server
bun run index.ts
```

#### 3. Setup Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

#### 4. Open the app

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

## 🐳 Docker Deployment

```bash
# Copy environment file
cp .env.example .env

# Build and start all services
docker compose up --build

# Access the app
# Frontend: http://localhost
# Backend: http://localhost:3000
```

## 📡 API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/signup` | Register new user |
| POST | `/auth/signin` | Login user |

### Rooms

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/rooms` | List all rooms |
| POST | `/rooms` | Create a room (auth required) |
| GET | `/rooms/:id/messages` | Get room messages |

### WebSocket

Connect to: `ws://localhost:3000?token=<JWT>`

**Client Messages:**
```json
{ "type": "JOIN_ROOM", "roomId": "room-id" }
{ "type": "LEAVE_ROOM" }
{ "type": "SEND_MESSAGE", "content": "Hello!" }
```

**Server Messages:**
```json
{ "type": "ROOM_JOINED", "roomId": "...", "messages": [...] }
{ "type": "NEW_MESSAGE", "message": {...} }
{ "type": "USER_JOINED", "username": "..." }
{ "type": "USER_LEFT", "username": "..." }
```

## 🌐 Deployment Options

| Service | Component | Free Tier |
|---------|-----------|-----------|
| [Vercel](https://vercel.com) | Frontend | ✅ Unlimited |
| [Render](https://render.com) | Backend | ✅ 750 hrs/mo |
| [Neon](https://neon.tech) | Database | ✅ 0.5 GB |

## 📝 Environment Variables

### Backend
```env
DATABASE_URL=postgresql://user:password@host:5432/dbname
JWT_SECRET=your-secret-key
PORT=3000
```

### Frontend
```env
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

Made with ❤️ by [Shikhar Singh](https://github.com/395ShikharSingh)

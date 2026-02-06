import { db } from "./src/db";
import {
    hashPassword,
    verifyPassword,
    generateToken,
    extractToken,
    verifyToken,
} from "./src/auth";
import {
    authenticateWebSocket,
    handleOpen,
    handleClose,
    handleMessage,
    type WebSocketData,
} from "./src/websocket";

const PORT = process.env.PORT || 3000;

// CORS headers for cross-origin requests
const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

/**
 * Handle HTTP requests
 */
async function handleRequest(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const path = url.pathname;
    const method = req.method;

    // Handle CORS preflight
    if (method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        // Auth routes
        if (path === "/auth/signup" && method === "POST") {
            return await handleSignup(req);
        }

        if (path === "/auth/signin" && method === "POST") {
            return await handleSignin(req);
        }

        // Room routes
        if (path === "/rooms" && method === "GET") {
            return await handleGetRooms();
        }

        if (path === "/rooms" && method === "POST") {
            return await handleCreateRoom(req);
        }

        // Room messages
        const roomMessagesMatch = path.match(/^\/rooms\/([^/]+)\/messages$/);
        if (roomMessagesMatch && roomMessagesMatch[1] && method === "GET") {
            return await handleGetRoomMessages(roomMessagesMatch[1]);
        }

        // Health check
        if (path === "/health") {
            return json({ status: "ok" });
        }

        return json({ error: "Not found" }, 404);
    } catch (error) {
        console.error("Request error:", error);
        return json({ error: "Internal server error" }, 500);
    }
}

/**
 * POST /auth/signup - Register a new user
 */
async function handleSignup(req: Request): Promise<Response> {
    const body = await req.json() as { username?: string; email?: string; password?: string };
    const { username, email, password } = body;

    if (!username || !email || !password) {
        return json({ error: "Username, email, and password are required" }, 400);
    }

    if (password.length < 6) {
        return json({ error: "Password must be at least 6 characters" }, 400);
    }

    // Check if user exists
    const existingUser = await db.user.findFirst({
        where: { OR: [{ email }, { username }] },
    });

    if (existingUser) {
        return json({ error: "Username or email already taken" }, 400);
    }

    // Create user
    const hashedPassword = await hashPassword(password);
    const user = await db.user.create({
        data: {
            username,
            email,
            password: hashedPassword,
        },
    });

    const token = generateToken({ userId: user.id, username: user.username });

    return json({
        user: { id: user.id, username: user.username, email: user.email },
        token,
    });
}

/**
 * POST /auth/signin - Login user
 */
async function handleSignin(req: Request): Promise<Response> {
    const body = await req.json() as { email?: string; password?: string };
    const { email, password } = body;

    if (!email || !password) {
        return json({ error: "Email and password are required" }, 400);
    }

    const user = await db.user.findUnique({ where: { email } });
    if (!user) {
        return json({ error: "Invalid credentials" }, 401);
    }

    const validPassword = await verifyPassword(password, user.password);
    if (!validPassword) {
        return json({ error: "Invalid credentials" }, 401);
    }

    const token = generateToken({ userId: user.id, username: user.username });

    return json({
        user: { id: user.id, username: user.username, email: user.email },
        token,
    });
}

/**
 * GET /rooms - List all rooms
 */
async function handleGetRooms(): Promise<Response> {
    const rooms = await db.room.findMany({
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            name: true,
            createdAt: true,
            _count: { select: { messages: true } },
        },
    });

    return json({ rooms });
}

/**
 * POST /rooms - Create a new room
 */
async function handleCreateRoom(req: Request): Promise<Response> {
    // Verify auth
    const token = extractToken(req.headers.get("Authorization"));
    if (!token || !verifyToken(token)) {
        return json({ error: "Unauthorized" }, 401);
    }

    const body = await req.json() as { name?: string };
    const { name } = body;

    if (!name || name.trim().length === 0) {
        return json({ error: "Room name is required" }, 400);
    }

    // Check if room exists
    const existing = await db.room.findUnique({ where: { name: name.trim() } });
    if (existing) {
        return json({ error: "Room with this name already exists" }, 400);
    }

    const room = await db.room.create({
        data: { name: name.trim() },
    });

    return json({ room });
}

/**
 * GET /rooms/:id/messages - Get last 50 messages for a room
 */
async function handleGetRoomMessages(roomId: string): Promise<Response> {
    const room = await db.room.findUnique({ where: { id: roomId } });
    if (!room) {
        return json({ error: "Room not found" }, 404);
    }

    const messages = await db.message.findMany({
        where: { roomId },
        orderBy: { createdAt: "desc" },
        take: 50,
        include: { user: { select: { username: true } } },
    });

    return json({
        messages: messages.reverse().map((m: { id: string; content: string; user: { username: string }; createdAt: Date }) => ({
            id: m.id,
            content: m.content,
            username: m.user.username,
            createdAt: m.createdAt.toISOString(),
        })),
    });
}

/**
 * JSON response helper
 */
function json(data: unknown, status = 200): Response {
    return new Response(JSON.stringify(data), {
        status,
        headers: { "Content-Type": "application/json", ...corsHeaders },
    });
}

// Start server
const server = Bun.serve({
    port: PORT,
    fetch(req, server) {
        // Upgrade to WebSocket if requested
        if (req.headers.get("upgrade") === "websocket") {
            const auth = authenticateWebSocket(req.url);
            if (!auth) {
                return new Response("Unauthorized", { status: 401 });
            }

            const success = server.upgrade(req, {
                data: {
                    userId: auth.userId,
                    username: auth.username,
                    roomId: null,
                } as WebSocketData,
            });

            return success
                ? undefined
                : new Response("WebSocket upgrade failed", { status: 500 });
        }

        return handleRequest(req);
    },
    websocket: {
        open: handleOpen,
        close: handleClose,
        message: handleMessage,
    },
});

console.log(`🚀 Chat server running on http://localhost:${server.port}`);
console.log(`📡 WebSocket available at ws://localhost:${server.port}?token=<JWT>`);
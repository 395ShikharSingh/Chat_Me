import type { ServerWebSocket } from "bun";
import { db } from "./db";
import { verifyToken, type JwtPayload } from "./auth";

// WebSocket data attached to each connection
export interface WebSocketData {
    userId: string;
    username: string;
    roomId: string | null;
}

// Message types for WebSocket communication
type ClientMessage =
    | { type: "JOIN_ROOM"; roomId: string }
    | { type: "LEAVE_ROOM" }
    | { type: "SEND_MESSAGE"; content: string };

type ServerMessage =
    | { type: "ROOM_JOINED"; roomId: string; messages: MessageData[] }
    | { type: "ROOM_LEFT" }
    | { type: "NEW_MESSAGE"; message: MessageData }
    | { type: "USER_JOINED"; username: string }
    | { type: "USER_LEFT"; username: string }
    | { type: "ERROR"; message: string };

interface MessageData {
    id: string;
    content: string;
    username: string;
    createdAt: string;
}

// Track connected users per room
const roomConnections = new Map<string, Set<ServerWebSocket<WebSocketData>>>();

/**
 * Authenticate WebSocket connection from token in query string
 */
export function authenticateWebSocket(
    url: string
): { userId: string; username: string } | null {
    const urlObj = new URL(url);
    const token = urlObj.searchParams.get("token");

    if (!token) {
        return null;
    }

    const payload = verifyToken(token);
    if (!payload) {
        return null;
    }

    return { userId: payload.userId, username: payload.username };
}

/**
 * Handle WebSocket open event
 */
export function handleOpen(ws: ServerWebSocket<WebSocketData>) {
    console.log(`User ${ws.data.username} connected`);
}

/**
 * Handle WebSocket close event
 */
export function handleClose(ws: ServerWebSocket<WebSocketData>) {
    console.log(`User ${ws.data.username} disconnected`);

    if (ws.data.roomId) {
        leaveRoom(ws);
    }
}

/**
 * Handle incoming WebSocket messages
 */
export async function handleMessage(
    ws: ServerWebSocket<WebSocketData>,
    message: string | Buffer
) {
    try {
        const data: ClientMessage = JSON.parse(message.toString());

        switch (data.type) {
            case "JOIN_ROOM":
                await joinRoom(ws, data.roomId);
                break;

            case "LEAVE_ROOM":
                leaveRoom(ws);
                break;

            case "SEND_MESSAGE":
                await sendMessage(ws, data.content);
                break;

            default:
                sendError(ws, "Unknown message type");
        }
    } catch (error) {
        console.error("Error handling message:", error);
        sendError(ws, "Invalid message format");
    }
}

/**
 * Join a room and receive message history
 */
async function joinRoom(ws: ServerWebSocket<WebSocketData>, roomId: string) {
    // Leave current room if in one
    if (ws.data.roomId) {
        leaveRoom(ws);
    }

    // Verify room exists
    const room = await db.room.findUnique({
        where: { id: roomId },
    });

    if (!room) {
        sendError(ws, "Room not found");
        return;
    }

    // Get last 50 messages
    const messages = await db.message.findMany({
        where: { roomId },
        orderBy: { createdAt: "desc" },
        take: 50,
        include: { user: { select: { username: true } } },
    });

    // Reverse to get chronological order
    const messageData: MessageData[] = messages.reverse().map((m: { id: string; content: string; user: { username: string }; createdAt: Date }) => ({
        id: m.id,
        content: m.content,
        username: m.user.username,
        createdAt: m.createdAt.toISOString(),
    }));

    // Subscribe to room
    ws.subscribe(roomId);
    ws.data.roomId = roomId;

    // Track connection
    if (!roomConnections.has(roomId)) {
        roomConnections.set(roomId, new Set());
    }
    roomConnections.get(roomId)!.add(ws);

    // Send room joined with history
    send(ws, { type: "ROOM_JOINED", roomId, messages: messageData });

    // Notify others
    broadcast(ws, roomId, { type: "USER_JOINED", username: ws.data.username });
}

/**
 * Leave current room
 */
function leaveRoom(ws: ServerWebSocket<WebSocketData>) {
    const roomId = ws.data.roomId;
    if (!roomId) return;

    // Notify others
    broadcast(ws, roomId, { type: "USER_LEFT", username: ws.data.username });

    // Unsubscribe
    ws.unsubscribe(roomId);
    ws.data.roomId = null;

    // Remove from tracking
    roomConnections.get(roomId)?.delete(ws);
    if (roomConnections.get(roomId)?.size === 0) {
        roomConnections.delete(roomId);
    }

    send(ws, { type: "ROOM_LEFT" });
}

/**
 * Send a message to the current room
 */
async function sendMessage(
    ws: ServerWebSocket<WebSocketData>,
    content: string
) {
    const roomId = ws.data.roomId;
    if (!roomId) {
        sendError(ws, "Not in a room");
        return;
    }

    if (!content.trim()) {
        sendError(ws, "Message cannot be empty");
        return;
    }

    // Save to database
    const message = await db.message.create({
        data: {
            content: content.trim(),
            userId: ws.data.userId,
            roomId,
        },
        include: { user: { select: { username: true } } },
    });

    const messageData: MessageData = {
        id: message.id,
        content: message.content,
        username: message.user.username,
        createdAt: message.createdAt.toISOString(),
    };

    // Broadcast to all in room (including sender)
    broadcastToRoom(roomId, { type: "NEW_MESSAGE", message: messageData });

    // Cleanup old messages (keep only 50 per room)
    await cleanupOldMessages(roomId);
}

/**
 * Keep only the last 50 messages per room
 */
async function cleanupOldMessages(roomId: string) {
    const messages = await db.message.findMany({
        where: { roomId },
        orderBy: { createdAt: "desc" },
        skip: 50,
        select: { id: true },
    });

    if (messages.length > 0) {
        await db.message.deleteMany({
            where: { id: { in: messages.map((m: { id: string }) => m.id) } },
        });
    }
}

/**
 * Send message to a single client
 */
function send(ws: ServerWebSocket<WebSocketData>, data: ServerMessage) {
    ws.send(JSON.stringify(data));
}

/**
 * Send error to client
 */
function sendError(ws: ServerWebSocket<WebSocketData>, message: string) {
    send(ws, { type: "ERROR", message });
}

/**
 * Broadcast to all in room except sender
 */
function broadcast(
    ws: ServerWebSocket<WebSocketData>,
    roomId: string,
    data: ServerMessage
) {
    const connections = roomConnections.get(roomId);
    if (!connections) return;

    const message = JSON.stringify(data);
    for (const conn of connections) {
        if (conn !== ws) {
            conn.send(message);
        }
    }
}

/**
 * Broadcast to all in room including sender
 */
function broadcastToRoom(roomId: string, data: ServerMessage) {
    const connections = roomConnections.get(roomId);
    if (!connections) return;

    const message = JSON.stringify(data);
    for (const conn of connections) {
        conn.send(message);
    }
}

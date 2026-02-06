import type { ServerWebSocket } from "bun";
import { db } from "./db";
import { verifyToken, type JwtPayload } from "./auth";

export interface WebSocketData {
    userId: string;
    username: string;
    roomId: string | null;
}

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

const roomConnections = new Map<string, Set<ServerWebSocket<WebSocketData>>>();

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

export function handleOpen(ws: ServerWebSocket<WebSocketData>) {
    console.log(`User ${ws.data.username} connected`);
}

export function handleClose(ws: ServerWebSocket<WebSocketData>) {
    console.log(`User ${ws.data.username} disconnected`);

    if (ws.data.roomId) {
        leaveRoom(ws);
    }
}

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

async function joinRoom(ws: ServerWebSocket<WebSocketData>, roomId: string) {
    if (ws.data.roomId) {
        leaveRoom(ws);
    }

    const room = await db.room.findUnique({
        where: { id: roomId },
    });

    if (!room) {
        sendError(ws, "Room not found");
        return;
    }

    const messages = await db.message.findMany({
        where: { roomId },
        orderBy: { createdAt: "desc" },
        take: 50,
        include: { user: { select: { username: true } } },
    });

    const messageData: MessageData[] = messages.reverse().map((m: { id: string; content: string; user: { username: string }; createdAt: Date }) => ({
        id: m.id,
        content: m.content,
        username: m.user.username,
        createdAt: m.createdAt.toISOString(),
    }));

    ws.subscribe(roomId);
    ws.data.roomId = roomId;

    if (!roomConnections.has(roomId)) {
        roomConnections.set(roomId, new Set());
    }
    roomConnections.get(roomId)!.add(ws);

    send(ws, { type: "ROOM_JOINED", roomId, messages: messageData });
    broadcast(ws, roomId, { type: "USER_JOINED", username: ws.data.username });
}

function leaveRoom(ws: ServerWebSocket<WebSocketData>) {
    const roomId = ws.data.roomId;
    if (!roomId) return;

    broadcast(ws, roomId, { type: "USER_LEFT", username: ws.data.username });

    ws.unsubscribe(roomId);
    ws.data.roomId = null;

    roomConnections.get(roomId)?.delete(ws);
    if (roomConnections.get(roomId)?.size === 0) {
        roomConnections.delete(roomId);
    }

    send(ws, { type: "ROOM_LEFT" });
}

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

    broadcastToRoom(roomId, { type: "NEW_MESSAGE", message: messageData });
    await cleanupOldMessages(roomId);
}

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

function send(ws: ServerWebSocket<WebSocketData>, data: ServerMessage) {
    ws.send(JSON.stringify(data));
}

function sendError(ws: ServerWebSocket<WebSocketData>, message: string) {
    send(ws, { type: "ERROR", message });
}

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

function broadcastToRoom(roomId: string, data: ServerMessage) {
    const connections = roomConnections.get(roomId);
    if (!connections) return;

    const message = JSON.stringify(data);
    for (const conn of connections) {
        conn.send(message);
    }
}

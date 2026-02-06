export interface User {
    id: string;
    username: string;
    email: string;
}

export interface Room {
    id: string;
    name: string;
    createdAt: string;
    _count?: { messages: number };
}

export interface Message {
    id: string;
    content: string;
    username: string;
    createdAt: string;
}

export interface AuthResponse {
    user: User;
    token: string;
}

export type ClientMessage =
    | { type: "JOIN_ROOM"; roomId: string }
    | { type: "LEAVE_ROOM" }
    | { type: "SEND_MESSAGE"; content: string };

export type ServerMessage =
    | { type: "ROOM_JOINED"; roomId: string; messages: Message[] }
    | { type: "ROOM_LEFT" }
    | { type: "NEW_MESSAGE"; message: Message }
    | { type: "USER_JOINED"; username: string }
    | { type: "USER_LEFT"; username: string }
    | { type: "ERROR"; message: string };

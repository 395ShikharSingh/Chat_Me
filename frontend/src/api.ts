const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:3000";

export async function signup(username: string, email: string, password: string) {
    const res = await fetch(`${API_URL}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
    });
    return res.json();
}

export async function signin(email: string, password: string) {
    const res = await fetch(`${API_URL}/auth/signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    });
    return res.json();
}

export async function getRooms() {
    const res = await fetch(`${API_URL}/rooms`);
    return res.json();
}

export async function createRoom(name: string, token: string) {
    const res = await fetch(`${API_URL}/rooms`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name }),
    });
    return res.json();
}

export async function deleteRoom(roomId: string, token: string) {
    const res = await fetch(`${API_URL}/rooms/${roomId}`, {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return res.json();
}

export async function getRoomMessages(roomId: string) {
    const res = await fetch(`${API_URL}/rooms/${roomId}/messages`);
    return res.json();
}

export function createWebSocket(token: string): WebSocket {
    return new WebSocket(`${WS_URL}?token=${token}`);
}

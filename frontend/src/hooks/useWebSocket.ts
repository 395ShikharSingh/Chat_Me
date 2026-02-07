import { useState, useEffect, useCallback, useRef } from "react";
import { createWebSocket } from "../api";
import type { Message, ServerMessage, ClientMessage } from "../types";

interface UseWebSocketReturn {
    messages: Message[];
    notifications: string[];
    isConnected: boolean;
    currentRoomId: string | null;
    roomDeleted: string | null;
    joinRoom: (roomId: string) => void;
    leaveRoom: () => void;
    sendMessage: (content: string) => void;
    clearNotifications: () => void;
    clearRoomDeleted: () => void;
}

export function useWebSocket(token: string | null): UseWebSocketReturn {
    const [messages, setMessages] = useState<Message[]>([]);
    const [notifications, setNotifications] = useState<string[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
    const [roomDeleted, setRoomDeleted] = useState<string | null>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const currentRoomIdRef = useRef<string | null>(null);

    // Keep ref in sync with state
    useEffect(() => {
        currentRoomIdRef.current = currentRoomId;
    }, [currentRoomId]);

    useEffect(() => {
        if (!token) return;

        const ws = createWebSocket(token);
        wsRef.current = ws;

        ws.onopen = () => {
            setIsConnected(true);
        };

        ws.onclose = () => {
            setIsConnected(false);
            setCurrentRoomId(null);
        };

        ws.onmessage = (event) => {
            const data: ServerMessage = JSON.parse(event.data);

            switch (data.type) {
                case "ROOM_JOINED":
                    setCurrentRoomId(data.roomId);
                    setMessages(data.messages);
                    setNotifications([]);
                    break;

                case "ROOM_LEFT":
                    setCurrentRoomId(null);
                    setMessages([]);
                    break;

                case "NEW_MESSAGE":
                    setMessages((prev) => [...prev, { ...data.message, isOwn: false }]);
                    break;

                case "USER_JOINED":
                    setNotifications((prev) => [...prev, `${data.username} joined the room`]);
                    break;

                case "USER_LEFT":
                    setNotifications((prev) => [...prev, `${data.username} left the room`]);
                    break;

                case "ROOM_DELETED":
                    setRoomDeleted(data.roomId);
                    // Use ref to check against current room without triggering effect re-run
                    if (data.roomId === currentRoomIdRef.current) {
                        setCurrentRoomId(null);
                        setMessages([]);
                        setNotifications((prev) => [...prev, "This room has been deleted"]);
                    }
                    break;

                case "ERROR":
                    console.error("WebSocket error:", data.message);
                    setNotifications((prev) => [...prev, `Error: ${data.message}`]);
                    break;
            }
        };

        ws.onerror = (error) => {
            console.error("WebSocket error:", error);
        };

        return () => {
            ws.close();
        };
    }, [token]);

    const send = useCallback((message: ClientMessage) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(message));
        }
    }, []);

    const joinRoom = useCallback(
        (roomId: string) => {
            send({ type: "JOIN_ROOM", roomId });
        },
        [send]
    );

    const leaveRoom = useCallback(() => {
        send({ type: "LEAVE_ROOM" });
    }, [send]);

    const sendMessage = useCallback(
        (content: string) => {
            send({ type: "SEND_MESSAGE", content });
        },
        [send]
    );

    const clearNotifications = useCallback(() => {
        setNotifications([]);
    }, []);

    const clearRoomDeleted = useCallback(() => {
        setRoomDeleted(null);
    }, []);

    return {
        messages,
        notifications,
        isConnected,
        currentRoomId,
        roomDeleted,
        joinRoom,
        leaveRoom,
        sendMessage,
        clearNotifications,
        clearRoomDeleted,
    };
}

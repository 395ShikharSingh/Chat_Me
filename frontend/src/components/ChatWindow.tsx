import { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import type { Message } from "../types";

interface ChatWindowProps {
    messages: Message[];
    notifications: string[];
    currentRoomId: string | null;
    onSendMessage: (content: string) => void;
    onLeaveRoom: () => void;
}

export function ChatWindow({
    messages,
    notifications,
    currentRoomId,
    onSendMessage,
    onLeaveRoom,
}: ChatWindowProps) {
    const [newMessage, setNewMessage] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { user } = useAuth();

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;
        onSendMessage(newMessage.trim());
        setNewMessage("");
    };

    if (!currentRoomId) {
        return (
            <div className="flex-1 flex items-center justify-center bg-slate-900/50">
                <div className="text-center">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-600/20 flex items-center justify-center">
                        <svg
                            className="w-10 h-10 text-indigo-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                            />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Select a Room</h2>
                    <p className="text-slate-400 max-w-sm">
                        Choose a room from the sidebar to start chatting with others
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col bg-slate-900/50">
            {/* Room Header */}
            <div className="px-6 py-4 border-b border-slate-700/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                        <svg
                            className="w-5 h-5 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
                            />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-white font-semibold">Room Chat</h2>
                        <p className="text-xs text-slate-400">{messages.length} messages</p>
                    </div>
                </div>
                <button
                    onClick={onLeaveRoom}
                    className="px-4 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg font-medium transition-colors"
                >
                    Leave Room
                </button>
            </div>

            {/* Notifications */}
            {notifications.length > 0 && (
                <div className="px-6 py-2 bg-indigo-500/10 border-b border-indigo-500/20">
                    {notifications.slice(-3).map((notification, i) => (
                        <p key={i} className="text-sm text-indigo-300">
                            {notification}
                        </p>
                    ))}
                </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-slate-400">No messages yet. Start the conversation!</p>
                    </div>
                ) : (
                    messages.map((message) => {
                        const isOwn = message.username === user?.username;
                        return (
                            <div
                                key={message.id}
                                className={`message-bubble flex gap-3 ${isOwn ? "flex-row-reverse" : ""}`}
                            >
                                {/* Avatar */}
                                <div
                                    className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-semibold ${isOwn
                                            ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white"
                                            : "bg-slate-700 text-slate-300"
                                        }`}
                                >
                                    {message.username.charAt(0).toUpperCase()}
                                </div>

                                {/* Message Bubble */}
                                <div className={`max-w-[70%] ${isOwn ? "text-right" : ""}`}>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span
                                            className={`text-sm font-medium ${isOwn ? "text-indigo-400" : "text-slate-400"
                                                }`}
                                        >
                                            {isOwn ? "You" : message.username}
                                        </span>
                                        <span className="text-xs text-slate-500">
                                            {new Date(message.createdAt).toLocaleTimeString([], {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </span>
                                    </div>
                                    <div
                                        className={`px-4 py-2.5 rounded-2xl ${isOwn
                                                ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-tr-sm"
                                                : "bg-slate-800 text-slate-100 rounded-tl-sm"
                                            }`}
                                    >
                                        <p className="text-sm leading-relaxed">{message.content}</p>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-slate-700/50">
                <form onSubmit={handleSubmit} className="flex gap-3">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none input-glow transition-all"
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="px-6 py-3 btn-gradient rounded-xl text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        <span>Send</span>
                        <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                            />
                        </svg>
                    </button>
                </form>
            </div>
        </div>
    );
}

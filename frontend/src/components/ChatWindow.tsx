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
            <div className="flex-1 flex items-center justify-center bg-slate-900/50 p-4">
                <div className="text-center">
                    <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-4 md:mb-6 rounded-2xl bg-gradient-to-br from-sky-500/20 to-cyan-500/20 flex items-center justify-center">
                        <svg
                            className="w-8 h-8 md:w-10 md:h-10 text-sky-400"
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
                    <h2 className="text-xl md:text-2xl font-bold text-white mb-2">Select a Room</h2>
                    <p className="text-slate-400 text-sm md:text-base max-w-sm">
                        <span className="md:hidden">Tap the menu to see rooms</span>
                        <span className="hidden md:inline">Choose a room from the sidebar to start chatting with others</span>
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col bg-slate-900/50">
            <div className="px-4 md:px-6 py-3 md:py-4 border-b border-slate-700/50 flex items-center justify-between">
                <div className="flex items-center gap-3 ml-10 md:ml-0">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-500 flex items-center justify-center">
                        <svg
                            className="w-4 h-4 md:w-5 md:h-5 text-white"
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
                        <h2 className="text-white font-semibold text-sm md:text-base">Room Chat</h2>
                        <p className="text-xs text-slate-400">{messages.length} messages</p>
                    </div>
                </div>
                <button
                    onClick={onLeaveRoom}
                    className="px-3 py-1.5 md:px-4 md:py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-sm font-medium transition-colors"
                >
                    Leave
                </button>
            </div>

            {notifications.length > 0 && (
                <div className="px-4 md:px-6 py-2 bg-sky-500/10 border-b border-sky-500/20">
                    {notifications.slice(-3).map((notification, i) => (
                        <p key={i} className="text-xs md:text-sm text-sky-300">
                            {notification}
                        </p>
                    ))}
                </div>
            )}

            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3 md:space-y-4">
                {messages.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-slate-400 text-sm md:text-base">No messages yet. Start the conversation!</p>
                    </div>
                ) : (
                    messages.map((message) => {
                        const isOwn = message.username === user?.username;
                        return (
                            <div
                                key={message.id}
                                className={`message-bubble flex gap-2 md:gap-3 ${isOwn ? "flex-row-reverse" : ""}`}
                            >
                                <div
                                    className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs md:text-sm font-semibold ${isOwn
                                        ? "bg-gradient-to-br from-sky-500 to-cyan-500 text-white"
                                        : "bg-slate-700 text-slate-300"
                                        }`}
                                >
                                    {message.username.charAt(0).toUpperCase()}
                                </div>

                                <div className={`max-w-[75%] md:max-w-[70%] ${isOwn ? "text-right" : ""}`}>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span
                                            className={`text-xs md:text-sm font-medium ${isOwn ? "text-sky-400" : "text-slate-400"
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
                                        className={`px-3 py-2 md:px-4 md:py-2.5 rounded-2xl ${isOwn
                                            ? "bg-gradient-to-r from-sky-500 to-cyan-500 text-white rounded-tr-sm"
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

            <div className="p-3 md:p-4 border-t border-slate-700/50">
                <form onSubmit={handleSubmit} className="flex gap-2 md:gap-3">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 px-3 py-2.5 md:px-4 md:py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none input-glow transition-all"
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="px-4 py-2.5 md:px-6 md:py-3 btn-gradient rounded-xl text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
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
                        <span className="hidden md:inline">Send</span>
                    </button>
                </form>
            </div>
        </div>
    );
}

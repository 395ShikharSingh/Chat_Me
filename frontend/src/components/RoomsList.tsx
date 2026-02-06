import { useState, useEffect } from "react";
import { getRooms, createRoom } from "../api";
import { useAuth } from "../context/AuthContext";
import type { Room } from "../types";

interface RoomsListProps {
    onJoinRoom: (roomId: string) => void;
    currentRoomId: string | null;
    isConnected: boolean;
}

export function RoomsList({ onJoinRoom, currentRoomId, isConnected }: RoomsListProps) {
    const [rooms, setRooms] = useState<Room[]>([]);
    const [newRoomName, setNewRoomName] = useState("");
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const { token, user, logout } = useAuth();

    useEffect(() => {
        loadRooms();
    }, []);

    const loadRooms = async () => {
        try {
            const result = await getRooms();
            setRooms(result.rooms || []);
        } catch (error) {
            console.error("Failed to load rooms:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateRoom = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newRoomName.trim() || !token) return;

        setCreating(true);
        try {
            const result = await createRoom(newRoomName.trim(), token);
            if (result.room) {
                setRooms((prev) => [result.room, ...prev]);
                setNewRoomName("");
                setShowCreateModal(false);
            }
        } catch (error) {
            console.error("Failed to create room:", error);
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="w-80 glass-card h-screen flex flex-col">
            <div className="p-4 border-b border-slate-700/50">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                            <span className="text-white font-bold text-lg">
                                {user?.username?.charAt(0).toUpperCase()}
                            </span>
                        </div>
                        <div>
                            <p className="text-white font-medium">{user?.username}</p>
                            <div className="flex items-center gap-1.5">
                                <span
                                    className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-400 online-pulse" : "bg-slate-500"
                                        }`}
                                />
                                <span className="text-xs text-slate-400">
                                    {isConnected ? "Connected" : "Disconnected"}
                                </span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
                        title="Logout"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                            />
                        </svg>
                    </button>
                </div>

                <button
                    onClick={() => setShowCreateModal(true)}
                    className="w-full py-2.5 btn-gradient rounded-xl text-white font-medium flex items-center justify-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    New Room
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-2">
                    Rooms ({rooms.length})
                </h3>

                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <svg className="animate-spin w-6 h-6 text-indigo-400" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                    </div>
                ) : rooms.length === 0 ? (
                    <div className="text-center py-8">
                        <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-slate-800 flex items-center justify-center">
                            <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                        </div>
                        <p className="text-slate-400 text-sm">No rooms yet</p>
                        <p className="text-slate-500 text-xs">Create one to start chatting</p>
                    </div>
                ) : (
                    <div className="space-y-1">
                        {rooms.map((room) => (
                            <button
                                key={room.id}
                                onClick={() => onJoinRoom(room.id)}
                                disabled={!isConnected}
                                className={`w-full p-3 rounded-xl text-left room-card border transition-all disabled:opacity-50 disabled:cursor-not-allowed ${currentRoomId === room.id
                                    ? "bg-indigo-500/20 border-indigo-500/50"
                                    : "bg-transparent border-transparent hover:border-slate-700"
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${currentRoomId === room.id
                                            ? "bg-indigo-500"
                                            : "bg-slate-700"
                                            }`}
                                    >
                                        <span className="text-white font-semibold">
                                            {room.name.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white font-medium truncate">{room.name}</p>
                                        <p className="text-xs text-slate-400">
                                            {room._count?.messages || 0} messages
                                        </p>
                                    </div>
                                    {currentRoomId === room.id && (
                                        <span className="w-2 h-2 rounded-full bg-green-400" />
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="glass-card rounded-2xl p-6 w-full max-w-sm">
                        <h2 className="text-xl font-bold text-white mb-4">Create New Room</h2>
                        <form onSubmit={handleCreateRoom}>
                            <input
                                type="text"
                                value={newRoomName}
                                onChange={(e) => setNewRoomName(e.target.value)}
                                placeholder="Room name"
                                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none input-glow mb-4"
                                autoFocus
                            />
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 rounded-xl text-white font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={!newRoomName.trim() || creating}
                                    className="flex-1 py-2.5 btn-gradient rounded-xl text-white font-medium disabled:opacity-50"
                                >
                                    {creating ? "Creating..." : "Create"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

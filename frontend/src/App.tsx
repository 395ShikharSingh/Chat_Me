import { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { useWebSocket } from "./hooks/useWebSocket";
import { AuthForm } from "./components/AuthForm";
import { RoomsList } from "./components/RoomsList";
import { ChatWindow } from "./components/ChatWindow";

function ChatApp() {
  const { isAuthenticated, token } = useAuth();
  const [showSidebar, setShowSidebar] = useState(false);
  const {
    messages,
    notifications,
    isConnected,
    currentRoomId,
    joinRoom,
    leaveRoom,
    sendMessage,
  } = useWebSocket(token);

  if (!isAuthenticated) {
    return <AuthForm />;
  }

  const handleJoinRoom = (roomId: string) => {
    joinRoom(roomId);
    setShowSidebar(false);
  };

  return (
    <div className="flex h-screen overflow-hidden relative">
      <button
        onClick={() => setShowSidebar(!showSidebar)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-slate-800 rounded-lg text-white"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {showSidebar && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setShowSidebar(false)}
        />
      )}

      <div className={`
        fixed md:relative z-40 h-full transition-transform duration-300
        ${showSidebar ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}>
        <RoomsList
          onJoinRoom={handleJoinRoom}
          currentRoomId={currentRoomId}
          isConnected={isConnected}
        />
      </div>

      <ChatWindow
        messages={messages}
        notifications={notifications}
        currentRoomId={currentRoomId}
        onSendMessage={sendMessage}
        onLeaveRoom={leaveRoom}
      />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <ChatApp />
    </AuthProvider>
  );
}

export default App;

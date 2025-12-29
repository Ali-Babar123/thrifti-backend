const {Server} = require("socket.io");
const {socketAuthMiddleware} = require("../middleware/authmiddleware");
const User = require("../Models/User");
const dotEnv = require("dotenv");

dotEnv.config();

// Global map to track online users: userId -> socketId
const onlineUsers = new Map();

class SocketService {
    constructor(){
        this._io = new Server({
            cors : {
                origin : process.env.CLIENT_URL || ['https://thrifti.temp2027.com','http://localhost:5173'],
                credentials: true,
                methods: ["GET", "POST"]
            }
        });
    }

    initListeners(){
        const io = this._io;
        
        // Apply authentication middleware BEFORE connection
        io.use(socketAuthMiddleware);

        io.on("connection", async (socket) => {
            try {
                // Check if user is authenticated
                if (socket.user && socket.isAuthenticated) {
                    const userId = socket.user._id.toString();
                    
                    // Add user to online users map
                    onlineUsers.set(userId, socket.id);
                    
                    // Update user's lastSeen to current time (they're online)
                    await User.findByIdAndUpdate(userId, { lastSeen: new Date() });

                    // Emit user online status to all connected clients
                    io.emit("user:online", { userId, socketId: socket.id });

                    console.log(`✅ Authenticated user connected: ${socket.user.username || socket.user.email} (${socket.id})`);

                    // Handle joining chat rooms (only for authenticated users)
                    socket.on("event:join-chat", (data) => {
                        if (socket.isAuthenticated && socket.user) {
                            this.joinChat(data, socket);
                        } else {
                            socket.emit("error", { message: "Authentication required to join chat" });
                        }
                    });

                    // Handle typing indicators
                    socket.on("event:typing-start", (data) => {
                        if (socket.isAuthenticated && socket.user && data?.chatId) {
                            const chatId = data.chatId.toString();
                            // Emit to all users in the chat room except the sender
                            socket.to(chatId).emit("event:user-typing", {
                                chatId: chatId,
                                userId: userId,
                                userName: socket.user.fullname || socket.user.username || socket.user.email,
                                isTyping: true
                            });
                        }
                    });

                    socket.on("event:typing-stop", (data) => {
                        if (socket.isAuthenticated && socket.user && data?.chatId) {
                            const chatId = data.chatId.toString();
                            // Emit to all users in the chat room except the sender
                            socket.to(chatId).emit("event:user-typing", {
                                chatId: chatId,
                                userId: userId,
                                userName: socket.user.fullname || socket.user.username || socket.user.email,
                                isTyping: false
                            });
                        }
                    });

                    // Handle disconnection
                    socket.on("disconnect", async () => {
                        // Remove user from online users map
                        onlineUsers.delete(userId);
                        
                        // Update lastSeen when user disconnects
                        await User.findByIdAndUpdate(userId, { lastSeen: new Date() });

                        // Emit user offline status
                        io.emit("user:offline", { userId });

                        console.log(`❌ User disconnected: ${socket.user.username || socket.user.email} (${socket.id})`);
                    });
                } else {
                    // Unauthenticated guest connection
                    console.log(`👤 Guest user connected (${socket.id})`);
                    
                    // Guest users can connect but cannot join chats
                    socket.on("event:join-chat", (data) => {
                        socket.emit("error", { message: "Authentication required to join chat" });
                    });

                    socket.on("disconnect", () => {
                        console.log(`👤 Guest user disconnected (${socket.id})`);
                    });
                }

                // Set global references
                global.socketServer = socket;
                global.server = this._io;

            } catch (error) {
                console.error("Socket connection error:", error);
                // Don't disconnect on error, just log it
            }
        });
    }

    joinChat(data, socket){
        // Ensure user is authenticated
        if (!socket.isAuthenticated || !socket.user) {
            socket.emit("error", { message: "Authentication required to join chat" });
            return;
        }

        if (!data?.chatId) {
            socket.emit("error", { message: "Chat ID is required" });
            return;
        }

        const chatId = data.chatId.toString();
        socket.join(chatId);
        
        console.log(`📨 User ${socket.user.username || socket.user.email} joined chat: ${chatId}`);
        
        socket.emit("event:joined-chat", {
            message: `Joined Chat: ${chatId}`,
            chatId: chatId,
            socketId: socket.id
        });
    }

    // Method to check if user is online
    isUserOnline(userId) {
        return onlineUsers.has(userId.toString());
    }

    // Method to get socket ID for a user
    getSocketId(userId) {
        return onlineUsers.get(userId.toString());
    }

    // Method to get all online users
    getOnlineUsers() {
        return Array.from(onlineUsers.keys());
    }

    io(){
        return this._io;
    }
}

// Export SocketService class as default
// Also export onlineUsers map as a named export
module.exports = SocketService;
module.exports.onlineUsers = onlineUsers;
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import multer from 'multer';
import session from 'express-session';
import bcrypt from 'bcryptjs';
import { mkdirSync, existsSync } from 'fs';
import mongoose from 'mongoose';
import MongoStore from 'connect-mongo';
import sharp from 'sharp';
import { User } from './models/User.js';
import { Message } from './models/Message.js';
import { config } from './config.js';
import fetch from 'node-fetch';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const server = createServer(app);
const io = new Server(server);

// Create required directories if they don't exist
const uploadsDir = join(__dirname, 'uploads');
const avatarsDir = join(uploadsDir, 'avatars');
const thumbsDir = join(avatarsDir, 'thumbnails');
[uploadsDir, avatarsDir, thumbsDir].forEach(dir => {
    if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
    }
});

// Add logging for MongoDB connection
mongoose.set('debug', true);

// Connect to MongoDB with more detailed logging
console.log('Attempting to connect to MongoDB...');
mongoose.connect('mongodb://localhost:27017/chat-app', {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
})
    .then(() => console.log('Successfully connected to MongoDB'))
    .catch(err => {
        console.error('MongoDB connection error:', err);
        console.error('MongoDB connection details:', {
            url: 'mongodb://localhost:27017/chat-app',
            error: err.message,
            stack: err.stack
        });
    });

mongoose.connection.on('error', err => {
    console.error('MongoDB connection error after initial connection:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected');
});

// Session middleware with MongoDB store and detailed logging
const sessionMiddleware = session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: 'mongodb://localhost:27017/chat-app',
        collection: 'sessions',
        ttl: 24 * 60 * 60 // Session TTL (1 day)
    }),
    cookie: {
        secure: false, // Set to true if using HTTPS
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 1 day
    }
});

app.use(sessionMiddleware);
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Add logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// File upload configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const isAvatar = file.fieldname === 'avatar';
        cb(null, isAvatar ? avatarsDir : uploadsDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedMimes = ['image/jpeg', 'image/png', 'image/gif'];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only images (JPEG, PNG, GIF) are allowed.'));
        }
    }
});

// Login endpoint with detailed logging
app.post('/login', async (req, res) => {
    console.log('Login attempt:', {
        username: req.body.username,
        timestamp: new Date().toISOString()
    });

    const { username, password } = req.body;

    if (!username || !password) {
        console.log('Login failed: Missing credentials');
        return res.status(400).json({ error: 'Username and password are required' });
    }

    try {
        console.log('Finding user in database...');
        const user = await User.findOne({ username });

        if (!user) {
            console.log('Login failed: User not found -', username);
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        console.log('Comparing passwords...');
        const isValidPassword = await user.comparePassword(password);

        if (!isValidPassword) {
            console.log('Login failed: Invalid password for user -', username);
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        console.log('Login successful:', username);
        req.session.userId = user._id;
        req.session.isAdmin = user.isAdmin;

        res.json({
            success: true,
            user: {
                id: user._id,
                username: user.username,
                isAdmin: user.isAdmin,
                avatar: user.avatarThumbnail
            }
        });
    } catch (error) {
        console.error('Login error:', {
            error: error.message,
            stack: error.stack,
            username
        });
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Avatar upload endpoint
app.post('/upload/avatar', upload.single('avatar'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!req.session.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
        const thumbnailFilename = `thumb-${req.file.filename}`;
        const thumbnailPath = join(thumbsDir, thumbnailFilename);

        // Resize image and create thumbnail
        await sharp(req.file.path)
            .resize(50, 50)
            .jpeg({ quality: 90 })
            .toFile(thumbnailPath);

        // Update user's avatar in database
        const user = await User.findByIdAndUpdate(
            req.session.userId,
            {
                avatar: `/uploads/avatars/${req.file.filename}`,
                avatarThumbnail: `/uploads/avatars/thumbnails/${thumbnailFilename}`
            },
            { new: true }
        );

        res.json({
            success: true,
            avatar: user.avatar,
            avatarThumbnail: user.avatarThumbnail
        });
    } catch (error) {
        console.error('Avatar upload error:', error);
        res.status(500).json({ error: 'Failed to process avatar' });
    }
});

// File upload endpoint
app.post('/upload', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!req.session.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
        const fileMessage = await Message.create({
            type: 'file',
            userId: req.session.userId,
            file: {
                name: req.file.filename,
                originalName: req.file.originalname,
                path: `/uploads/${req.file.filename}`
            }
        });

        const populatedMessage = await Message.findById(fileMessage._id)
            .populate('userId', 'username avatarThumbnail');

        io.to('chat-room').emit('file-message', populatedMessage);
        res.json(populatedMessage);
    } catch (error) {
        console.error('File upload error:', error);
        res.status(500).json({ error: 'Failed to process file upload' });
    }
});

// Export messages endpoint (admin only)
app.get('/export-messages', async (req, res) => {
    if (!req.session.userId || !req.session.isAdmin) {
        return res.status(403).json({ error: 'Admin access required' });
    }

    try {
        const { startDate, endDate } = req.query;
        const messages = await Message.exportToJSON(startDate, endDate);
        res.json(messages);
    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ error: 'Failed to export messages' });
    }
});

io.use((socket, next) => {
    // Use the existing Express session middleware
    sessionMiddleware(socket.request, {}, next);
});


io.on('connection', async (socket) => {
    const userId = socket.request.session.userId;
    console.log(userId + ' connected')

    try {
        const user = await User.findById(userId).select('username avatarThumbnail');
        if (!user) {
            socket.disconnect();
            return;
        }

        // Add connection tracking
        const connectionEntry = {
            connectionId: socket.id,
            status: 'connected',
            connectedAt: new Date()
        };

        await User.findByIdAndUpdate(userId, {
            $push: { connections: connectionEntry }
        });

        socket.join('chat-room');

        // Get updated user count
        const userCount = io.sockets.adapter.rooms.get('chat-room').size;

        // Send previous messages
        const messages = await Message.find()
            .populate('userId', 'username avatarThumbnail')
            .sort({ timestamp: -1 })
            .limit(50);
        socket.emit('previous-messages', messages.reverse());

        // Broadcast user joined event to everyone EXCEPT the connecting user
        socket.broadcast.to('chat-room').emit('user-joined', { user, userCount });

        socket.on('chat-message', async (messageText) => {
            try {
                // Create the user's message
                const userMessage = await Message.create({
                    type: 'text',
                    userId: userId,
                    text: messageText
                });

                const populatedUserMessage = await Message.findById(userMessage._id)
                    .populate('userId', 'username avatarThumbnail');

                io.to('chat-room').emit('chat-message', populatedUserMessage);

                // Check if message mentions the bot
                if (messageText.toLowerCase().startsWith(config.chatbot.triggerPrefix.toLowerCase())) {
                    // Remove the bot prefix from message
                    const botQuery = messageText.slice(config.chatbot.triggerPrefix.length).trim();

                    try {
                        // Send message to chatbot server
                        const response = await fetch(`${config.chatbot.endpoint}/chat`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                message: botQuery,
                                username: populatedUserMessage.userId.username
                            })
                        });

                        if (response.ok) {
                            const data = await response.json();
                            console.log("Chatbot Server Response:", data);

                            // Fetch the ChatBot user details BEFORE creating the message
                            const chatBotUser = await User.findById(config.chatbot.userId);

                            if (!chatBotUser) {
                                console.error("ChatBot user not found in database!");
                                // Handle the error appropriately, perhaps by sending an error message to the chat
                                return;
                            }

                            // Create bot's response message, using the fetched user object
                            const botMessage = await Message.create({
                                type: 'text',
                                userId: chatBotUser._id,  // Use _id from the fetched user
                                text: data.response
                            });

                            // Populate the message (this should now work correctly)
                            const populatedBotMessage = await Message.findById(botMessage._id)
                                .populate('userId', 'username avatarThumbnail');

                            io.to('chat-room').emit('chat-message', populatedBotMessage);
                            console.log("HERE IS THE MESSAGE " + JSON.stringify(populatedBotMessage));
                        }
                        else {
                            console.error("Chatbot Server Error: ", response.status, response.statusText);
                        }
                    } catch (error) {

                        console.error('Chatbot server error:', error);

                        // Send error message from bot
                        const errorMessage = await Message.create({
                            type: 'text',
                            userId: config.chatbot.userId,
                            text: "Sorry, I'm having trouble processing your message right now."
                        });

                        const populatedErrorMessage = await Message.findById(errorMessage._id)
                            .populate('userId', 'username avatarThumbnail');

                        io.to('chat-room').emit('chat-message', populatedErrorMessage);
                    }
                }
            } catch (error) {
                console.error('Message creation error:', error);
            }
        });

        socket.on('disconnect', async () => {
            // Update connection status
            await User.findByIdAndUpdate(userId, {
                $set: { 'connections.$[elem].status': 'disconnected' }
            }, {
                arrayFilters: [{ 'elem.connectionId': socket.id }]
            });

            const userCount = io.sockets.adapter.rooms.get('chat-room')?.size || 0; 

            // Broadcast user left event 
            socket.broadcast.to('chat-room').emit('user-left', { user, userCount }); 
        });
    } catch (error) {
        console.error('Socket connection error:', error);
        socket.disconnect();
    }
});

const portNumber = 3030;
server.listen(portNumber, () => {
    console.log(`Server running on http://localhost:${portNumber}`);
});

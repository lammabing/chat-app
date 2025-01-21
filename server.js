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

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const server = createServer(app);
const io = new Server(server);

// Create required directories if they don't exist
const uploadsDir = join(__dirname, 'uploads');
const avatarsDir = join(uploadsDir, 'avatars');
const thumbsDir = join(avatarsDir, 'thumbnails');
[uploadsDir, avatarsDir, thumbsDir].forEach(dir =>
{
    if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
    }
});

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/chatapp')
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// Session middleware with MongoDB store
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: 'mongodb://localhost:27017/chatapp',
        collection: 'sessions'
    })
}));

app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// File upload configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) =>
    {
        const isAvatar = file.fieldname === 'avatar';
        cb(null, isAvatar ? avatarsDir : uploadsDir);
    },
    filename: (req, file, cb) =>
    {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Login endpoint
app.post('/login', async (req, res) =>
{
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username });

        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

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
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Avatar upload endpoint
app.post('/upload/avatar', upload.single('avatar'), async (req, res) =>
{
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
app.post('/upload', upload.single('file'), async (req, res) =>
{
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
app.get('/export-messages', async (req, res) =>
{
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

io.on('connection', async (socket) =>
{
    const userId = socket.handshake.auth.userId;

    try {
        const user = await User.findById(userId).select('username avatarThumbnail');
        if (!user) {
            socket.disconnect();
            return;
        }

        socket.join('chat-room');

        // Send previous messages
        const messages = await Message.find()
            .populate('userId', 'username avatarThumbnail')
            .sort({ timestamp: -1 })
            .limit(50);
        socket.emit('previous-messages', messages.reverse());

        socket.broadcast.to('chat-room').emit('user-joined', {
            username: user.username,
            avatar: user.avatarThumbnail
        });

        socket.on('chat-message', async (messageText) =>
        {
            try {
                const message = await Message.create({
                    type: 'text',
                    userId: userId,
                    text: messageText
                });

                const populatedMessage = await Message.findById(message._id)
                    .populate('userId', 'username avatarThumbnail');

                io.to('chat-room').emit('chat-message', populatedMessage);
            } catch (error) {
                console.error('Message creation error:', error);
            }
        });

        socket.on('disconnect', () =>
        {
            socket.broadcast.to('chat-room').emit('user-left', {
                username: user.username
            });
        });
    } catch (error) {
        console.error('Socket connection error:', error);
        socket.disconnect();
    }
});

server.listen(3000, () =>
{
    console.log('Server running on port 3000');
});
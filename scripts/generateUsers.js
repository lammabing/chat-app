import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { writeFileSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

const users = [
    {
        username: 'admin',
        password: 'admin123',
        isAdmin: true
    },
    {
        username: 'sarah_dev',
        password: 'sarah123'
    },
    {
        username: 'john_smith',
        password: 'john123'
    },
    {
        username: 'emily_tech',
        password: 'emily123'
    },
    {
        username: 'alex_chat',
        password: 'alex123'
    },
    {
        username: 'ChatBot',
        password: '123'
    }
];

async function generateUsers()
{
    try {
        await mongoose.connect('mongodb://localhost:27017/chat-app');
        console.log('Connected to MongoDB');

        // Clear existing users
        await User.deleteMany({});

        // Create users
        const createdUsers = await User.create(users);
        console.log('Users created successfully');

        // Generate .logins file content
        const loginsContent = users.map(user =>
            `${user.username}:${user.password}${user.isAdmin ? ' (admin)' : ''}`
        ).join('\n');

        // Write to .logins file
        const loginsPath = join(__dirname, '..', '.logins');
        writeFileSync(loginsPath, loginsContent);
        console.log('.logins file created successfully');

        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

generateUsers();
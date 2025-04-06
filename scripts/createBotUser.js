import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { appendFile } from 'fs/promises';
import { User } from '../models/User.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function createBotUser()
{
    try {
        await mongoose.connect('mongodb://localhost:27017/chat-app');
        console.log('Connected to MongoDB');

        const botPassword = Math.random().toString(36).slice(-8); // Generate random password
        const hashedPassword = await bcrypt.hash(botPassword, 10);

        const botUser = {
            username: 'ChatBot',
            password: hashedPassword,
            isAdmin: false,
            avatar: '/uploads/avatars/default-avatar.png', // Using default avatar for now
            avatarThumbnail: '/uploads/avatars/default-avatar.png'
        };

        // Check if bot user already exists
        const existingBot = await User.findOne({ username: botUser.username });
        if (existingBot) {
            console.log('Bot user already exists. Keys/values:');
            console.log(existingBot);
            await mongoose.disconnect();
            return;
        }

        // Create bot user
        const createdBot = await User.create(botUser);
        console.log('Bot user created successfully');
        console.log('Bot credentials:');
        console.log(`Username: ${botUser.username}`);
        console.log(`Password: ${botPassword}`);
        console.log(`Bot User ID: ${createdBot._id}`);

        // Store bot credentials
        const credentials = `\n${botUser.username}:${botPassword} (bot)`;
        try {
            await appendFile('.logins', credentials, 'utf8');
            console.log('Bot credentials added to .logins file');
        } catch (error) {
            console.error('Failed to write to .logins file:', error);
            console.log('Please manually add these credentials to your .logins file:');
            console.log(credentials);
        }

        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    } catch (error) {
        console.error('Error creating bot user:', error);
        try {
            await mongoose.disconnect();
        } catch {
            // Ignore disconnect error
        }
        process.exit(1);
    }
}

createBotUser();
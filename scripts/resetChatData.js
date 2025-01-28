import mongoose from 'mongoose';
import { Message } from '../models/Message.js';

async function resetChatData()
{
    try {
        await mongoose.connect('mongodb://localhost:27017/chatapp');
        console.log('Connected to MongoDB');

        // Confirm deletion
        const readline = (await import('readline')).default.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        const answer = await new Promise(resolve =>
            readline.question('Delete ALL chat messages? (y/N) ', resolve)
        );

        if (answer.toLowerCase() !== 'y') {
            console.log('Aborting reset');
            await mongoose.disconnect();
            process.exit(0);
        }

        // Delete all messages
        const result = await Message.deleteMany({});
        console.log(`Deleted ${result.deletedCount} messages`);

        await mongoose.disconnect();
        console.log('Reset complete');
        process.exit(0);
    } catch (error) {
        console.error('Error resetting chat data:', error);
        try {
            await mongoose.disconnect();
        } catch {
            // Ignore disconnect error
        }
        process.exit(1);
    }
}

resetChatData();
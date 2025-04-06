import mongoose from 'mongoose';
import { Message } from '../models/Message.js';

async function resetChatData() {
    try {
        // Connect to MongoDB
        await mongoose.connect('mongodb://localhost:27017/chat-app');
        console.log('Connected to MongoDB');

        // Get all collection names
        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();
        const collectionNames = collections.map(collection => collection.name);

        // Check if "Message" collection exists
        if (!collectionNames.includes('messages')) {
            console.error('Error: "Message" collection not found in database!');
            await mongoose.disconnect();
            process.exit(1);
        }

        // Confirm deletion using readline
        const readline = (await import('readline')).default.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        const answer = await new Promise(resolve =>
            readline.question('Delete ALL chat messages from the "Message" collection ONLY? (y/N) ', resolve)
        );

        if (answer.toLowerCase() !== 'y') {
            console.log('Aborting reset');
            await mongoose.disconnect();
            process.exit(0);
        }

        // Delete all messages from the "Message" collection
        const result = await Message.deleteMany({});
        console.log(`Deleted ${result.deletedCount} messages from the "Message" collection`);

        // Disconnect from MongoDB
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

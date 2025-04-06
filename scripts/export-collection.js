
import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Message } from '../models/Message.js';
import fs from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function exportCollectionsToJSON()
{
    try {
        // 1. Connect to MongoDB
        await mongoose.connect('mongodb://localhost:27017/chat-app');
        console.log('Connected to MongoDB');

        // 2. Fetch data from collections
        const users = await User.find().lean().exec(); // Use lean() for plain objects
        const messages = await Message.find()
            .populate('userId', 'username') // Populate user info
            .lean()
            .exec();

        // 3. Create an object to hold the exported data
        const exportData = {
            users: users,
            messages: messages,
        };

        // 4. Define the output path
        const outputPath = join(__dirname, '..', 'collections-export.json');

        // 5. Write to JSON file
        fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2));
        console.log(`Collections exported to ${outputPath} `);

    } catch (error) {
        console.error('Error exporting collections:', error);
    } finally {
        mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

// Run the export function
exportCollectionsToJSON();

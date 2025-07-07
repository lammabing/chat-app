import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'fs';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Define paths for uploads
const uploadsDir = join(__dirname, '../uploads');
const avatarsDir = join(uploadsDir, 'avatars');
const thumbsDir = join(avatarsDir, 'thumbnails');

// Ensure directories exist
[uploadsDir, avatarsDir, thumbsDir].forEach(dir => {
    if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
    }
});

async function updateAvatarScript() {
    const args = process.argv.slice(2); // Get command line arguments

    if (args.length !== 2) {
        console.log('Usage: node update-avatar.js <userId> <imagePath>');
        console.log('Example: node update-avatar.js 686425da0d48766744c4a507 ./path/to/new_avatar.png');
        process.exit(1);
    }

    const userId = args[0];
    const imagePath = args[1];

    if (!existsSync(imagePath)) {
        console.error(`Error: Image file not found at ${imagePath}`);
        process.exit(1);
    }

    try {
        // Connect to MongoDB
        await mongoose.connect('mongodb://localhost:27017/chat-app');
        console.log('Connected to MongoDB');

        const user = await User.findById(userId);
        if (!user) {
            console.error(`Error: User with ID ${userId} not found.`);
            await mongoose.disconnect();
            process.exit(1);
        }

        console.log(`Updating avatar for user: ${user.username} (ID: ${userId})`);

        const originalFilename = join(avatarsDir, `${Date.now()}-${user.username}-${user._id}${user.avatar ? user.avatar.split('.').pop() : '.png'}`);
        const thumbnailFilename = join(thumbsDir, `thumb-${Date.now()}-${user.username}-${user._id}${user.avatar ? user.avatar.split('.').pop() : '.png'}`);

        // Read the image file
        const imageBuffer = readFileSync(imagePath);

        // Save original image
        writeFileSync(originalFilename, imageBuffer);

        // Create and save thumbnail
        await sharp(imageBuffer)
            .resize(50, 50)
            .jpeg({ quality: 90 })
            .toFile(thumbnailFilename);

        // Update user in database
        user.avatar = `/uploads/avatars/${originalFilename.split('/').pop()}`;
        user.avatarThumbnail = `/uploads/avatars/thumbnails/${thumbnailFilename.split('/').pop()}`;
        await user.save();

        console.log('Avatar updated successfully!');
        console.log(`New avatar: ${user.avatar}`);
        console.log(`New thumbnail: ${user.avatarThumbnail}`);

        await mongoose.disconnect();
        process.exit(0);

    } catch (error) {
        console.error('Error updating avatar:', error);
        try {
            await mongoose.disconnect();
        } catch (disconnectError) {
            // Ignore disconnect error
        }
        process.exit(1);
    }
}

updateAvatarScript();
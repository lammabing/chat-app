import mongoose from 'mongoose';
import { User } from '../models/User.js';

async function viewUsers() {
    try {
        // Connect to the database
        await mongoose.connect('mongodb://localhost:27017/your-database-name', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        // Retrieve all users
        const users = await User.find();

        // Log the users to the console
        if (users.length > 0) {
            console.log('Users found:', users);
        } else {
            console.log('No users found.');
        }

        // Close the database connection
        await mongoose.connection.close();
    } catch (error) {
        console.error('Error viewing users:', error);
    }
}

viewUsers();
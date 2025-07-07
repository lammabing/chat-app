import mongoose from 'mongoose';
import { User } from '../models/User.js';

async function resetAdminPassword() {
    try {
        await mongoose.connect('mongodb://localhost:27017/chat-app', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        const adminUser = await User.findOne({ username: 'admin' });
        if (!adminUser) {
            console.log('Admin user not found.');
            return;
        }
        adminUser.password = 'h0ngk0ng'; // Will be hashed by pre-save hook
        await adminUser.save();
        console.log('Admin password has been reset to "h0ngk0ng".');
        await mongoose.connection.close();
    } catch (error) {
        console.error('Error resetting admin password:', error);
    }
}

resetAdminPassword();

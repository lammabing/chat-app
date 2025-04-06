import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    avatar: {
        type: String,
        default: null
    },
    avatarThumbnail: {
        type: String,
        default: null
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    connections: [{
        connectionId: String,
        status: {
            type: String,
            enum: ['connected', 'disconnected'],
            default: 'connected'
        },
        connectedAt: {
            type: Date,
            default: Date.now
        }
    }]
});

// Hash password before saving
userSchema.pre('save', async function (next)
{
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword)
{
    return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model('User', userSchema);

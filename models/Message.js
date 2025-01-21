import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['text', 'file'],
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    text: {
        type: String,
        required: function ()
        {
            return this.type === 'text';
        }
    },
    file: {
        name: String,
        originalName: String,
        path: String
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

// Static method to export messages to JSON
messageSchema.statics.exportToJSON = async function (startDate, endDate)
{
    const query = {};
    if (startDate || endDate) {
        query.timestamp = {};
        if (startDate) query.timestamp.$gte = new Date(startDate);
        if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    return this.find(query)
        .populate('userId', 'username')
        .lean()
        .exec();
};

export const Message = mongoose.model('Message', messageSchema);
import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema(
    {
        userId: {
            type: String,
            required: true,
            index: true
        },
        title: {
            type: String,
            default: 'New Chat',
            trim: true,
        },
    },
    { timestamps: true }
);

export const Chat = mongoose.model('Chat', chatSchema);

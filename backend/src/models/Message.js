import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
    {
        chat: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Chat',
            required: true,
            index: true
        },
        content: {
            type: String,
            required: true,
        },
        role: {
            type: String,
            enum: ['user', 'ai', 'system'],
            required: true,
        },
    },
    { timestamps: true }
);

export const Message = mongoose.model('Message', messageSchema);

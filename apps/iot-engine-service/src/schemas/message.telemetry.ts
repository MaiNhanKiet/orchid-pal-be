import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type MessageDocument = Message & Document;

@Schema({
    timestamps: true,
    collection: 'chat_messages'
})
export class Message {
    @Prop({ required: true, index: true })
    sessionId: string;

    @Prop({ required: true, index: true })
    userId: string;

    @Prop({ required: true, enum: ['user', 'model'] })
    role: string;

    @Prop({ required: true })
    content: string;

    @Prop({
        type: [{
            type: { type: String, enum: ['image'], default: 'image' },
            url: { type: String },
            mimeType: { type: String }
        }],
        default: []
    })
    attachments: Array<{ type: string; url: string; mimeType: string }>;

    @Prop({
        type: {
            model: { type: String },
            serial_number: { type: String },
            tokens: { type: Number },
        },
    })
    metadata: Record<string, any>;

    @Prop({ type: Date, default: Date.now, expires: 5184000 })
    createdAt: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);

MessageSchema.index({ sessionId: 1, createdAt: 1 });
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AutomationLogDocument = AutomationLog & Document;

@Schema({
  collection: 'automation_logs',
  timestamps: { createdAt: 'created_at', updatedAt: false },
})
export class AutomationLog {
  @Prop({ required: true, index: true })
  plant_id: string;

  @Prop({ required: true, index: true })
  device_id: string;

  @Prop({ required: true })
  action: string;

  @Prop({ required: true })
  trigger_reason: string;

  @Prop({ type: Number, required: false })
  value?: number;
}

export const AutomationLogSchema = SchemaFactory.createForClass(AutomationLog);
AutomationLogSchema.index({ device_id: 1, created_at: -1 });

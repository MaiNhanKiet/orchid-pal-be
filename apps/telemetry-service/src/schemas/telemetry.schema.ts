import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TelemetryDocument = Telemetry & Document;

@Schema({
    timeseries: {
        timeField: 'timestamp',
        metaField: 'metadata',
        granularity: 'minutes',
    },
    expireAfterSeconds: 2592000
})
export class Telemetry {
    @Prop({ type: Date, default: Date.now })
    timestamp: Date;

    @Prop({
        type: {
            serial_number: { type: String, required: true },
        },
    })
    metadata: Record<string, any>;

    @Prop({ type: Number })
    temperature: number;

    @Prop({ type: Number })
    humidity: number;

    @Prop({ type: Number })
    soil_moisture: number;

    @Prop({ type: Number })
    light: number;
}

export const TelemetrySchema = SchemaFactory.createForClass(Telemetry);
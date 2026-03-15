import { TelemetryEventDto } from '@app/common';
import { Controller, Param, Sse } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { filter, map, Observable, Subject } from 'rxjs';

@Controller('telemetry')
export class TelemetryController {
    private telemetrySubject = new Subject<TelemetryEventDto>();

    @EventPattern('telemetry_created_event')
    handleNewTelemetry(@Payload() data: TelemetryEventDto) {
        console.log('data', data);
        this.telemetrySubject.next(data);
    }

    @Sse('stream/:serialNumber')
    streamTelemetry(@Param('serialNumber') serialNumber: string): Observable<MessageEvent> {
        return this.telemetrySubject.asObservable().pipe(
            filter(data => data.serialNumber === serialNumber),
            map(data => ({ data: data.sensors } as MessageEvent)),
        );
    }
}
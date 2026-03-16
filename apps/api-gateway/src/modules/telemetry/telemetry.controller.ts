import { GetHistoryTelemetryDto, GetHistoryTelemetryQueryDto, GetLatestTelemetryDto, MICROSERVICES_CLIENTS, TelemetryEventDto } from '@app/common';
import { Controller, Get, Inject, Param, Query, Sse } from '@nestjs/common';
import {
    ClientProxy,
    Ctx,
    EventPattern,
    Payload,
    RmqContext,
} from '@nestjs/microservices';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { filter, firstValueFrom, map, Observable, Subject } from 'rxjs';
import {
    ApiGetHistoryTelemetryDocs,
    ApiGetLatestTelemetryDocs,
    ApiStreamTelemetryDocs,
} from './telemetry.swagger';

@ApiTags('Telemetry')
@ApiBearerAuth('access-token')
@Controller('telemetry')
export class TelemetryController {
    private telemetrySubject = new Subject<TelemetryEventDto>();

    constructor(
        @Inject(MICROSERVICES_CLIENTS.TELEMETRY_SERVICE)
        private readonly telemetryClient: ClientProxy,
    ) { }

    @EventPattern('telemetry_created_event')
    handleNewTelemetry(
        @Payload() data: TelemetryEventDto,
        @Ctx() context: RmqContext,
    ) {
        this.telemetrySubject.next(data);

        const channel = context.getChannelRef();
        const originalMsg = context.getMessage();

        channel.ack(originalMsg);
    }

    @Sse('stream/:serialNumber')
    @ApiStreamTelemetryDocs()
    streamTelemetry(
        @Param('serialNumber') serialNumber: string,
    ): Observable<MessageEvent> {
        return this.telemetrySubject.asObservable().pipe(
            filter((data) => data.serialNumber === serialNumber),
            map((data) => ({ data: data.sensors } as MessageEvent)),
        );
    }

    @Get(':serialNumber/latest')
    @ApiGetLatestTelemetryDocs()
    getLatestTelemetry(@Param() params: GetLatestTelemetryDto) {
        return firstValueFrom(
            this.telemetryClient.send(
                { cmd: 'get_latest_telemetry' },
                { serialNumber: params.serialNumber },
            ),
        );
    }

    @Get(':serialNumber/history')
    @ApiGetHistoryTelemetryDocs()
    getHistoryTelemetry(
        @Param() params: GetHistoryTelemetryDto,
        @Query() query: GetHistoryTelemetryQueryDto,
    ) {
        return firstValueFrom(
            this.telemetryClient.send(
                { cmd: 'get_history_telemetry' },
                {
                    serialNumber: params.serialNumber,
                    hours: query.hours,
                },
            ),
        );
    }
}

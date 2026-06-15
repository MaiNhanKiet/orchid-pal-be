import {
  BypassInterceptors,
  GetHistoryTelemetryDto,
  GetHistoryTelemetryQueryDto,
  GetLatestTelemetryDto,
  MICROSERVICES_CLIENTS,
  Public,
  TelemetryEventDto,
} from '@app/common';
import { GrpcRpcService } from '@app/grpc';
import { Controller, Get, Inject, Param, Query, Sse } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  ClientProxy,
  Ctx,
  EventPattern,
  Payload,
  RmqContext,
} from '@nestjs/microservices';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  firstValueFrom,
  fromEvent,
  interval,
  map,
  merge,
  Observable,
  startWith,
} from 'rxjs';
import {
  ApiGetHistoryTelemetryDocs,
  ApiGetLatestTelemetryDocs,
  ApiOrchidChatDocs,
  ApiStreamTelemetryDocs,
} from './telemetry.swagger';

@ApiTags('15 - Telemetry')
@ApiBearerAuth('access-token')
@Controller('telemetry')
export class TelemetryController {

  constructor(
    private readonly grpcRpc: GrpcRpcService,
    private eventEmitter: EventEmitter2,
  ) { }

  @EventPattern('telemetry_created_event')
  handleNewTelemetry(
    @Payload() data: TelemetryEventDto,
    @Ctx() context: RmqContext,
  ) {
    this.eventEmitter.emit(`telemetry.${data.serialNumber}`, data);

    const channel = context.getChannelRef();
    channel.ack(context.getMessage());
  }

  @Public()
  @BypassInterceptors()
  @Sse('stream/:serialNumber')
  @ApiStreamTelemetryDocs()
  streamTelemetry(
    @Param('serialNumber') serialNumber: string,
  ): Observable<any> {
    const telemetry$ = fromEvent(
      this.eventEmitter,
      `telemetry.${serialNumber}`,
    ).pipe(
      map((data: TelemetryEventDto) => {
        return { data: data.sensors };
      }),
    );

    const heartbeat$ = interval(60000).pipe(
      startWith(0),
      map(() => ({ data: { type: 'ping' } })),
    );

    return merge(telemetry$, heartbeat$);
  }

  @Get(':serialNumber/latest')
  @ApiGetLatestTelemetryDocs()
  getLatestTelemetry(@Param() params: GetLatestTelemetryDto) {
    return this.grpcRpc.send(MICROSERVICES_CLIENTS.IOT_ENGINE_SERVICE, 'get_latest_telemetry', { serialNumber: params.serialNumber });
  }

  @Get(':serialNumber/history')
  @ApiGetHistoryTelemetryDocs()
  getHistoryTelemetry(
    @Param() params: GetHistoryTelemetryDto,
    @Query() query: GetHistoryTelemetryQueryDto,
  ) {
    return this.grpcRpc.send(MICROSERVICES_CLIENTS.IOT_ENGINE_SERVICE, 'get_history_telemetry', {
          serialNumber: params.serialNumber,
          hours: query.hours,
        });
  }

}

import {
  AnalyzeSeasonalConfigDto,
  BypassInterceptors,
  GetHistoryTelemetryDto,
  GetHistoryTelemetryQueryDto,
  GetLatestTelemetryDto,
  MICROSERVICES_CLIENTS,
  Public,
  TelemetryEventDto,
} from '@app/common';
import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Query,
  Sse,
} from '@nestjs/common';
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
  Subject,
} from 'rxjs';
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
    private eventEmitter: EventEmitter2,
  ) {}

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

  @Post('analyze-seasonal-config')
  analyzeSeasonalConfig(@Body() body: AnalyzeSeasonalConfigDto) {
    return firstValueFrom(
      this.telemetryClient.send(
        { cmd: 'analyze_seasonal_config' },
        {
          zoneId: body.zoneId,
          currentConfig: body.currentConfig,
          days: body.days,
        },
      ),
    );
  }
}

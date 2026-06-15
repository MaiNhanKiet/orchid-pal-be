import {
  CurrentUser,
  JwtPayload,
  MICROSERVICES_CLIENTS,
  Permissions,
  UpdateAutomationRulesBodyDto,
  UpdateAutomationRulesDto,
} from '@app/common';
import { AnalyzeSeasonalConfigDto } from '@app/common/dtos/telemetry/analyze-seasonal-config.dto';
import { Permission } from '@app/common/enums';
import { GrpcRpcService } from '@app/grpc';
import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  ApiAnalyzeSeasonalConfigDocs,
  ApiGetZoneAutomationRulesDocs,
  ApiUpdateAutomationRulesDocs,
} from '../garden/zones/zones.swagger';

@ApiTags('17 - Automation')
@ApiBearerAuth('access-token')
@Controller('automation')
export class AutomationController {
  constructor(private readonly grpcRpc: GrpcRpcService) {}

  @Get('zones/:id/rules')
  @Permissions(Permission.ZoneRead)
  @ApiGetZoneAutomationRulesDocs()
  getZoneAutomationRules(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.grpcRpc.send(
      MICROSERVICES_CLIENTS.BALCONY_SERVICE,
      'get_zone_automation_rules',
      { zone_id: id, user_id: user.sub },
    );
  }

  @Patch('zones/:id/rules')
  @ApiUpdateAutomationRulesDocs()
  updateAutomationRules(
    @Param('id') id: string,
    @Body() body: UpdateAutomationRulesBodyDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const payload: UpdateAutomationRulesDto = {
      zone_id: id,
      user_id: user.sub,
      logic: body.logic,
    };
    return this.grpcRpc.send(
      MICROSERVICES_CLIENTS.IOT_ENGINE_SERVICE,
      'update_automation_rules',
      payload,
    );
  }

  @Post('zones/analyze')
  @ApiAnalyzeSeasonalConfigDocs()
  analyzeSeasonalConfig(@Body() body: AnalyzeSeasonalConfigDto) {
    return this.grpcRpc.send(
      MICROSERVICES_CLIENTS.IOT_ENGINE_SERVICE,
      'analyze_seasonal_config',
      {
        zoneId: body.zoneId,
        days: body.days,
      },
    );
  }
}

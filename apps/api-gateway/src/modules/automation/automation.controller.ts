import {
  CurrentUser,
  JwtPayload,
  MICROSERVICES_CLIENTS,
  Permissions,
  RefreshAutomationByPlantDto,
  UpdateAutomationRulesBodyDto,
  UpdateAutomationRulesDto,
} from '@app/common';
import { Permission } from '@app/common/enums';
import { GrpcRpcService } from '@app/grpc';
import { Body, Controller, Delete, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  ApiActivateAutomationRuleDocs,
  ApiDeleteAutomationRuleDocs,
  ApiRefreshAutomationByPlantDocs,
  ApiUpdateAutomationRulesDocs,
} from './automation.swagger';

@ApiTags('08 - Automation')
@ApiBearerAuth('access-token')
@Controller('automation')
export class AutomationController {
  constructor(private readonly grpcRpc: GrpcRpcService) {}

  @Patch('devices/:deviceId/relays/:relayPort')
  @Permissions(Permission.MeDeviceControl)
  @ApiUpdateAutomationRulesDocs()
  updateAutomationRules(
    @Param('deviceId') deviceId: string,
    @Param('relayPort') relayPort: string,
    @Body() body: UpdateAutomationRulesBodyDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const payload: UpdateAutomationRulesDto = {
      device_id: deviceId,
      relay_port: Number(relayPort),
      user_id: user.sub,
      logic: body.logic,
    };
    return this.grpcRpc.send(
      MICROSERVICES_CLIENTS.PLANT_SERVICE,
      'update_automation_rules',
      payload,
    );
  }

  @Post('plants/:plantId/refresh')
  @Permissions(Permission.MeDeviceControl)
  @ApiRefreshAutomationByPlantDocs()
  refreshByPlant(@Param('plantId') plantId: string, @CurrentUser() user: JwtPayload) {
    const payload: RefreshAutomationByPlantDto = {
      plant_id: plantId,
      user_id: user.sub,
    };
    return this.grpcRpc.send(
      MICROSERVICES_CLIENTS.PLANT_SERVICE,
      'refresh_automation_by_plant',
      payload,
    );
  }

  @Post('rules/:ruleId/activate')
  @Permissions(Permission.MeDeviceControl)
  @ApiActivateAutomationRuleDocs()
  activateRule(@Param('ruleId') ruleId: string, @CurrentUser() user: JwtPayload) {
    return this.grpcRpc.send(MICROSERVICES_CLIENTS.PLANT_SERVICE, 'activate_automation_rule', {
      rule_id: ruleId,
      user_id: user.sub,
    });
  }

  @Delete('rules/:ruleId')
  @Permissions(Permission.MeDeviceControl)
  @ApiDeleteAutomationRuleDocs()
  deleteRule(@Param('ruleId') ruleId: string, @CurrentUser() user: JwtPayload) {
    return this.grpcRpc.send(MICROSERVICES_CLIENTS.PLANT_SERVICE, 'delete_automation_rule', {
      rule_id: ruleId,
      user_id: user.sub,
    });
  }
}

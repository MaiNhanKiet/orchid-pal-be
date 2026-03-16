import {
  CreateZoneDto,
  CurrentUser,
  JwtPayload,
  MICROSERVICES_CLIENTS,
  Permissions,
  UpdateAutomationRulesBodyDto,
  UpdateAutomationRulesDto,
} from '@app/common';
import { Permission } from '@app/common/enums';
import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';
import {
  ApiCreateZoneDocs,
  ApiGetZoneAutomationRulesDocs,
  ApiGetZoneDetailDocs,
  ApiGetZonesDocs,
  ApiUpdateAutomationRulesDocs,
} from './zones.swagger';

@ApiTags('Zones')
@ApiBearerAuth('access-token')
@Controller('zones')
export class ZonesController {
  constructor(
    @Inject(MICROSERVICES_CLIENTS.GARDEN_SERVICE)
    private readonly gardenClient: ClientProxy,
    @Inject('AUTOMATION') private readonly automationClient: ClientProxy,
  ) {}

  @Get()
  @Permissions(Permission.ZoneRead)
  @ApiGetZonesDocs()
  getMyZones(@CurrentUser() user: JwtPayload) {
    return firstValueFrom(
      this.gardenClient.send(
        { cmd: 'get_zones_by_user' },
        { user_id: user.sub },
      ),
    );
  }

  @Get(':id')
  @Permissions(Permission.ZoneRead)
  @ApiGetZoneDetailDocs()
  getZoneDetail(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return firstValueFrom(
      this.gardenClient.send(
        { cmd: 'get_zone_detail' },
        { zone_id: id, user_id: user.sub },
      ),
    );
  }

  @Patch(':id/automation-rules')
  // @Permissions(Permission.ZoneUpdate)
  @ApiUpdateAutomationRulesDocs()
  updateAutomationRules(
    @Param('id') id: string,
    @Body() body: UpdateAutomationRulesBodyDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const payload: UpdateAutomationRulesDto = {
      zone_id: id,
      logic: body.logic,
    };
    return firstValueFrom(
      this.automationClient.send({ cmd: 'update_automation_rules' }, payload),
    );
  }
  @Get(':id/automation-rules')
  @Permissions(Permission.ZoneRead)
  @ApiGetZoneAutomationRulesDocs()
  getZoneAutomationRules(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return firstValueFrom(
      this.gardenClient.send(
        { cmd: 'get_zone_automation_rules' },
        { zone_id: id, user_id: user.sub },
      ),
    );
  }

  @Post()
  @Permissions(Permission.ZoneCreate)
  @ApiCreateZoneDocs()
  createZone(
    @Body() createZoneDto: CreateZoneDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return firstValueFrom(
      this.gardenClient.send(
        { cmd: 'create_zone' },
        {
          ...createZoneDto,
          user_id: user.sub,
        },
      ),
    );
  }
}

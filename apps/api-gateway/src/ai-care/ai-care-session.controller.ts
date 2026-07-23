import { CurrentUser, JwtPayload, Permissions } from '@app/common';
import { Permission } from '@app/common/enums';
import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AiCareService } from './ai-care.service';

@ApiTags('12 - AI Care')
@ApiBearerAuth('access-token')
@Controller('chat')
export class AiCareSessionController {
  constructor(private readonly aiCareService: AiCareService) {}

  @Get('session')
  @Permissions(Permission.ChatManage)
  @ApiOperation({ summary: 'Get or create the single AI chat session for the user' })
  getOrCreateSession(@CurrentUser() user: JwtPayload) {
    return this.aiCareService.getOrCreateSession(user.sub);
  }
}

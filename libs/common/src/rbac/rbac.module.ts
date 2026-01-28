import { Module, Global } from '@nestjs/common';
import { PrismaModule } from '@app/prisma';
import { RbacService } from './rbac.service';

@Module({
  imports: [PrismaModule],
  providers: [RbacService],
  exports: [RbacService],
})
export class RbacModule {}

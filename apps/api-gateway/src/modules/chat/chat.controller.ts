import {
    CurrentUser,
    JwtPayload,
    MICROSERVICES_CLIENTS,
    SkipTimeout,
} from '@app/common';
import { GrpcRpcService } from '@app/grpc';
import {
    BadRequestException,
    Body,
    Controller,
    Inject,
    Param,
    Post,
    UploadedFile,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ClientProxy } from '@nestjs/microservices';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';
import { ApiOrchidChatDocs } from './chat.swagger';

@ApiTags('16 - Chat')
@ApiBearerAuth('access-token')
@Controller('chat')
export class ChatController {
    constructor(private readonly grpcRpc: GrpcRpcService) { }

    @Post('sessions/:sessionId/messages')
    @ApiOrchidChatDocs()
    @SkipTimeout()
    @UseInterceptors(
        FileInterceptor('image', {
            limits: {
                fileSize: 8 * 1024 * 1024,
            },
            fileFilter: (_req, file, cb) => {
                if (!file.mimetype?.startsWith('image/')) {
                    return cb(new BadRequestException('Chỉ hỗ trợ file ảnh'), false);
                }
                cb(null, true);
            },
        }),
    )
    async orchidChat(
        @CurrentUser() user: JwtPayload,
        @Param('sessionId') sessionId: string,
        @Body() body: { content: string },
        @UploadedFile() image?: any,
    ) {
        if (!sessionId?.trim()) {
            throw new BadRequestException('sessionId là bắt buộc');
        }

        if (!body.content?.trim()) {
            throw new BadRequestException('content là bắt buộc');
        }

        const imageBase64 = image?.buffer
            ? image.buffer.toString('base64')
            : undefined;

        return this.grpcRpc.send(MICROSERVICES_CLIENTS.IOT_ENGINE_SERVICE, 'orchid_chat', {
                    sessionId: sessionId.trim(),
                    content: body.content.trim(),
                    userId: user.sub,
                    image: imageBase64
                        ? {
                            base64: imageBase64,
                            mimeType: image.mimetype,
                            originalName: image.originalname,
                        }
                        : undefined,
                });
    }
}

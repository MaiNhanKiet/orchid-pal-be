import { PaginationDto, Permissions, Public } from '@app/common';
import { Permission } from '@app/common/enums';
import { Body, Controller, Get, Post, Query } from '@nestjs/common';import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { FeedbackService } from './feedback.service';

@ApiTags('11 - Feedback')
@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post()
  @Public()
  @ApiOperation({ summary: 'Submit landing/product feedback (public)' })
  @ApiResponse({ status: 201, description: 'Feedback saved' })
  createFeedback(@Body() dto: CreateFeedbackDto) {
    return this.feedbackService.createFeedback(dto);
  }

  @Get()
  @Permissions(Permission.FeedbackView)
  @ApiOperation({ summary: 'List user feedback (admin)' })
  listFeedback(
    @Query() pagination: PaginationDto,
    @Query('category') category?: string,
  ) {
    return this.feedbackService.listFeedback({
      page: pagination.page,
      limit: pagination.limit,
      category,
    });
  }
}
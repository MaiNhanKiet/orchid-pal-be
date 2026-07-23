import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ExpertConsultationService } from './expert-consultation.service';

const PURGE_INTERVAL_MS = 6 * 60 * 60 * 1000;
const STARTUP_DELAY_MS = 60_000;

@Injectable()
export class ConsultationArchiveScheduler implements OnModuleInit {
  private readonly logger = new Logger(ConsultationArchiveScheduler.name);

  constructor(
    private readonly expertConsultationService: ExpertConsultationService,
  ) {}

  onModuleInit() {
    const runPurge = () => {
      void this.expertConsultationService
        .purgeExpiredArchivedConversations()
        .then((result) => {
          if (result.deleted > 0) {
            this.logger.log(
              `Purged ${result.deleted} archived conversation(s) past retention`,
            );
          }
        })
        .catch((error: unknown) => {
          this.logger.error(
            'Failed to purge expired archived conversations',
            error instanceof Error ? error.stack : String(error),
          );
        });
    };

    setTimeout(runPurge, STARTUP_DELAY_MS);
    setInterval(runPurge, PURGE_INTERVAL_MS);
    this.logger.log(
      'Archive purge scheduler started (runs every 6 hours, deletes after 7 days)',
    );
  }
}

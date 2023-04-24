import { BullAdapter } from '@bull-board/api/bullAdapter';
import { createBullBoard } from '@bull-board/api';
import { ExpressAdapter } from '@bull-board/express';
import { All, Controller, Next, Request, Response } from '@nestjs/common';
import { Queue } from 'bull';
import express from 'express';
import { BullBoardService } from './bull-board.service';

@Controller('/queue_admin')
export class BullBoardController {
  constructor(private bullboardService: BullBoardService) {}

  @All('*')
  admin(
    @Request() req: express.Request,
    @Response() res: express.Response,
    @Next() next: express.NextFunction,
  ) {
    const queues = this.bullboardService.getQueues();
    const serverAdapter = new ExpressAdapter();
    serverAdapter.setBasePath('/queue_admin');
    const router = serverAdapter.getRouter() as express.Express;
    const { addQueue } = createBullBoard({
      queues: [],
      serverAdapter,
    });
    queues.forEach((queue: Queue) => {
      addQueue(new BullAdapter(queue));
    });
    const entryPointPath = '/queue_admin/';
    req.url = req.url.replace(entryPointPath, '/');
    router(req, res, next);
  }
}

import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Response } from 'express';
import { ContractsService } from './contracts.service';

@Controller('contracts')
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  private uid(h?: string): string {
    const id = h?.trim();
    if (!id) throw new BadRequestException('En-tête x-user-id requis.');
    return id;
  }

  @Get('by-project/:projectId')
  byProject(@Param('projectId') projectId: string) {
    return this.contractsService.findByProject(projectId);
  }

  @Post('accept-proposal/:proposalId')
  acceptProposal(
    @Headers('x-user-id') userId: string | undefined,
    @Param('proposalId') proposalId: string,
    @Body() body: { clientName?: string },
  ) {
    return this.contractsService.acceptProposal(
      proposalId,
      this.uid(userId),
      body?.clientName?.trim() || 'Client',
    );
  }

  @Post(':contractId/sign')
  sign(
    @Headers('x-user-id') userId: string | undefined,
    @Param('contractId') contractId: string,
  ) {
    return this.contractsService.signContract(contractId, this.uid(userId));
  }

  @Get(':contractId/pdf')
  pdf(
    @Param('contractId') contractId: string,
    @Res({ passthrough: false }) res: Response,
  ) {
    void contractId;
    const buf = this.contractsService.getPdfBuffer();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="contrat-bmp.pdf"');
    res.send(buf);
  }

  @Post(':contractId/upload-client-pdf')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 8 * 1024 * 1024 },
    }),
  )
  async uploadClientPdf(
    @Headers('x-user-id') userId: string | undefined,
    @Param('contractId') contractId: string,
    @UploadedFile() file?: { buffer?: Buffer },
  ) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Fichier requis.');
    }
    const b64 = `data:application/pdf;base64,${file.buffer.toString('base64')}`;
    return this.contractsService.setClientPdfUrl(
      contractId,
      this.uid(userId),
      b64,
    );
  }

  @Post(':contractId/upload-expert-pdf')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 8 * 1024 * 1024 },
    }),
  )
  async uploadExpertPdf(
    @Headers('x-user-id') userId: string | undefined,
    @Param('contractId') contractId: string,
    @UploadedFile() file?: { buffer?: Buffer },
  ) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Fichier requis.');
    }
    const b64 = `data:application/pdf;base64,${file.buffer.toString('base64')}`;
    return this.contractsService.setExpertPdfUrl(
      contractId,
      this.uid(userId),
      b64,
    );
  }
}

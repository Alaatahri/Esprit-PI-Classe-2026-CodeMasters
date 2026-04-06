import {
  BadRequestException,
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Headers,
  Param,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { randomBytes } from 'crypto';
import { existsSync, mkdirSync } from 'fs';
import { extname, join } from 'path';
import type { Response } from 'express';
import { AcceptProposalBodyDto } from './dto/accept-proposal-body.dto';
import { ContractsService } from './contracts.service';

const uploadDir = join(process.cwd(), 'public', 'uploads', 'contracts');
if (!existsSync(uploadDir)) mkdirSync(uploadDir, { recursive: true });

const pdfUpload = {
  storage: diskStorage({
    destination: uploadDir,
    filename: (_req, file, cb) => {
      const ext = extname(file.originalname) || '.pdf';
      cb(null, `${randomBytes(16).toString('hex')}${ext}`);
    },
  }),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const name = String(file.originalname || '')
      .toLowerCase()
      .trim();
    const m = String(file.mimetype || '')
      .toLowerCase()
      .trim();
    const ok =
      m === 'application/pdf' ||
      m.includes('pdf') ||
      (name.endsWith('.pdf') &&
        (m === 'application/octet-stream' ||
          m === '' ||
          m === 'binary/octet-stream'));
    if (!ok) {
      cb(null, false);
      return;
    }
    cb(null, true);
  },
};

@Controller('contracts')
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  /** Toujours un objet JSON (évite corps vide / 204 si `null` seul côté Nest). */
  @Get('by-project/:projectId')
  async getByProject(@Param('projectId') projectId: string) {
    const contract = await this.contractsService.findByProjectOrNull(projectId);
    return { contract };
  }

  /** Client: accepte une proposition et génère le contrat */
  @Post('accept-proposal/:proposalId')
  acceptProposal(
    @Param('proposalId') proposalId: string,
    @Body(new DefaultValuePipe({})) body: AcceptProposalBodyDto,
    @Headers('x-user-id') clientIdHeader?: string,
  ) {
    return this.contractsService.acceptProposal({
      proposalId,
      clientId: String(clientIdHeader || ''),
      clientName: body?.clientName,
      expertName: body?.expertName,
    });
  }

  /** PDF professionnel (client ou expert du contrat) */
  @Get(':contractId/pdf')
  async downloadPdf(
    @Param('contractId') contractId: string,
    @Headers('x-user-id') userIdHeader: string | undefined,
    @Res() res: Response,
  ) {
    const buf = await this.contractsService.getContractPdfBuffer(
      contractId,
      String(userIdHeader || ''),
    );
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="contrat-bmp.pdf"',
    );
    res.send(buf);
  }

  /** Client : envoie le PDF signé (horodatage = signature client si pas déjà faite) */
  @Post(':contractId/upload-client-pdf')
  @UseInterceptors(FileInterceptor('file', pdfUpload))
  uploadClientPdf(
    @Param('contractId') contractId: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Headers('x-user-id') userIdHeader?: string,
  ) {
    if (!file) throw new BadRequestException('Envoyez un fichier PDF.');
    return this.contractsService.uploadClientSignedPdf(
      contractId,
      String(userIdHeader || ''),
      file,
    );
  }

  /** Expert : envoie le PDF signé */
  @Post(':contractId/upload-expert-pdf')
  @UseInterceptors(FileInterceptor('file', pdfUpload))
  uploadExpertPdf(
    @Param('contractId') contractId: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Headers('x-user-id') userIdHeader?: string,
  ) {
    if (!file) throw new BadRequestException('Envoyez un fichier PDF.');
    return this.contractsService.uploadExpertSignedPdf(
      contractId,
      String(userIdHeader || ''),
      file,
    );
  }

  /** Signature digitale (client ou expert) */
  @Post(':contractId/sign')
  sign(
    @Param('contractId') contractId: string,
    @Headers('x-user-id') userIdHeader?: string,
  ) {
    return this.contractsService.signContract(
      contractId,
      String(userIdHeader || ''),
    );
  }
}

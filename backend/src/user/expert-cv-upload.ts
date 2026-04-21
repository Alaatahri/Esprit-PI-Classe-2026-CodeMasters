import { BadRequestException } from '@nestjs/common';
import { diskStorage } from 'multer';
import { randomBytes } from 'crypto';
import { existsSync, mkdirSync } from 'fs';
import { extname, join } from 'path';

const uploadDir = join(process.cwd(), 'public', 'uploads', 'expert-cv');
if (!existsSync(uploadDir)) mkdirSync(uploadDir, { recursive: true });

const MAX = 5 * 1024 * 1024;

function isAllowedPdfOrDocx(mimetype: string, originalname: string): boolean {
  const name = String(originalname || '')
    .toLowerCase()
    .trim();
  const m = String(mimetype || '')
    .toLowerCase()
    .trim();
  if (name.endsWith('.pdf')) {
    return (
      m === 'application/pdf' ||
      m === 'application/x-pdf' ||
      m === 'application/octet-stream' ||
      m === ''
    );
  }
  if (name.endsWith('.docx')) {
    return (
      m ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      m === 'application/octet-stream' ||
      m === ''
    );
  }
  if (m === 'application/pdf') return name.endsWith('.pdf') || !name;
  if (
    m ===
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  )
    return name.endsWith('.docx') || !name;
  return false;
}

export const expertCvMulterOptions = {
  storage: diskStorage({
    destination: uploadDir,
    filename: (_req, file, cb) => {
      const ext = extname(file.originalname || '').toLowerCase();
      const safeExt = ext === '.pdf' || ext === '.docx' ? ext : '.bin';
      cb(null, `${randomBytes(16).toString('hex')}${safeExt}`);
    },
  }),
  limits: { fileSize: MAX },
  fileFilter: (
    _req: unknown,
    file: Express.Multer.File,
    cb: (error: Error | null, acceptFile?: boolean) => void,
  ) => {
    if (!isAllowedPdfOrDocx(file.mimetype, file.originalname)) {
      return cb(
        new BadRequestException(
          'CV : formats acceptés PDF ou DOCX uniquement (max 5 Mo).',
        ),
        false,
      );
    }
    cb(null, true);
  },
};

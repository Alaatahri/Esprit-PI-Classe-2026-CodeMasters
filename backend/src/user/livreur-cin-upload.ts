import { BadRequestException } from '@nestjs/common';
import { diskStorage } from 'multer';
import { randomBytes } from 'crypto';
import { existsSync, mkdirSync } from 'fs';
import { extname, join } from 'path';

const uploadDir = join(process.cwd(), 'public', 'uploads', 'livreur-cin');
if (!existsSync(uploadDir)) mkdirSync(uploadDir, { recursive: true });

const MAX = 3 * 1024 * 1024;

function isAllowedCin(mimetype: string, originalname: string): boolean {
  const name = String(originalname || '')
    .toLowerCase()
    .trim();
  const m = String(mimetype || '')
    .toLowerCase()
    .trim();
  if (name.endsWith('.pdf')) {
    return (
      m === 'application/pdf' ||
      m === 'application/octet-stream' ||
      m === ''
    );
  }
  if (name.endsWith('.jpg') || name.endsWith('.jpeg')) {
    return (
      m === 'image/jpeg' ||
      m === 'image/jpg' ||
      m === 'application/octet-stream' ||
      m === ''
    );
  }
  if (name.endsWith('.png')) {
    return (
      m === 'image/png' ||
      m === 'application/octet-stream' ||
      m === ''
    );
  }
  if (m === 'application/pdf') return name.endsWith('.pdf') || !name;
  if (m === 'image/jpeg' || m === 'image/jpg') return /\.jpe?g$/i.test(name);
  if (m === 'image/png') return name.endsWith('.png') || !name;
  return false;
}

export const livreurCinMulterOptions = {
  storage: diskStorage({
    destination: uploadDir,
    filename: (_req, file, cb) => {
      const ext = extname(file.originalname || '').toLowerCase();
      const safe =
        ext === '.pdf' || ext === '.jpg' || ext === '.jpeg' || ext === '.png'
          ? ext === '.jpeg'
            ? '.jpg'
            : ext
          : '.bin';
      cb(null, `${randomBytes(16).toString('hex')}${safe}`);
    },
  }),
  limits: { fileSize: MAX },
  fileFilter: (
    _req: unknown,
    file: Express.Multer.File,
    cb: (error: Error | null, acceptFile?: boolean) => void,
  ) => {
    if (!isAllowedCin(file.mimetype, file.originalname)) {
      return cb(
        new BadRequestException(
          'CIN / permis : JPG, PNG ou PDF uniquement (max 3 Mo).',
        ),
        false,
      );
    }
    cb(null, true);
  },
};

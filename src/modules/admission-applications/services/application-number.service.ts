import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

@Injectable()
export class ApplicationNumberService {
  async generate(tx: Prisma.TransactionClient, instituteId: string): Promise<string> {
    const currentYear = new Date().getFullYear();
    const sequenceType = 'ADMISSION_APPLICATION';
    const prefix = `APP-${currentYear}-`;

    const seq = await tx.numberSequence.upsert({
      where: {
        uq_sequence_type_institute: {
          sequenceType,
          instituteId,
        },
      },
      update: {
        currentNumber: { increment: 1 },
      },
      create: {
        sequenceType,
        instituteId,
        prefix,
        currentNumber: 1,
      },
    });

    const formattedNum = String(seq.currentNumber).padStart(6, '0');
    return `${seq.prefix || prefix}${formattedNum}${seq.suffix || ''}`;
  }
}

import { ConflictException, BadRequestException } from '@nestjs/common';

export class DuplicateLeadException extends ConflictException {
  constructor(message = 'A duplicate lead with the same phone or email already exists in this admission session') {
    super(message);
  }
}

export class ApplicationLockedException extends BadRequestException {
  constructor(message = 'This application has already been processed (APPROVED, REJECTED, or MATRICULATED) and is locked for modification') {
    super(message);
  }
}

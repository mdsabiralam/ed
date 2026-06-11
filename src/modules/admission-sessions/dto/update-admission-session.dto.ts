import { PartialType } from '@nestjs/swagger';
import { CreateAdmissionSessionDto } from './create-admission-session.dto';

export class UpdateAdmissionSessionDto extends PartialType(CreateAdmissionSessionDto) {}

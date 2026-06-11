import { PartialType } from '@nestjs/swagger';
import { CreateLeadFollowupDto } from './create-lead-followup.dto';

export class UpdateLeadFollowupDto extends PartialType(CreateLeadFollowupDto) {}

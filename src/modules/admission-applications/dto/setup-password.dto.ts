import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class SetupPasswordDto {
  @ApiProperty({ example: 'some-secure-uuid-or-token', description: 'Invitation setup password token' })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({ example: 'password123', description: 'New password' })
  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  password: string;
}

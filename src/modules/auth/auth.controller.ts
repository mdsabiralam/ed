import { Controller, Post, Body, Req, UseGuards, HttpStatus, HttpCode } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { JwtRefreshGuard } from '../../common/guards/jwt-refresh.guard';
import { CurrentUser, RequestContextUser } from '../../common/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto, @Req() req: Request) {
    const userAgent = req.get('user-agent') || 'Unknown';
    const ip = req.ip || '127.0.0.1';
    
    // Simple parsing for log registry
    const browser = userAgent.includes('Chrome') ? 'Chrome' : userAgent.includes('Firefox') ? 'Firefox' : 'Safari';
    const os = userAgent.includes('Windows') ? 'Windows' : userAgent.includes('Mac') ? 'macOS' : 'Linux';

    const validatedUser = await this.authService.validateUser(loginDto);
    const result = await this.authService.login(validatedUser, { ip, userAgent, browser, os });

    return {
      success: true,
      message: 'Login successful',
      data: result,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @CurrentUser() user: RequestContextUser,
    @Body('refreshToken') refreshToken: string,
  ) {
    await this.authService.logout(user.userId, refreshToken, user.instituteId);
    return {
      success: true,
      message: 'Logout successful',
    };
  }

  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: any) {
    const userId = req.user.userId;
    const oldRefreshToken = req.user.refreshToken;
    const ip = req.ip || '127.0.0.1';
    const userAgent = req.get('user-agent') || 'Unknown';

    const result = await this.authService.refreshTokens(userId, oldRefreshToken, { ip, userAgent });
    return {
      success: true,
      message: 'Tokens refreshed successfully',
      data: result,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @CurrentUser() user: RequestContextUser,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    await this.authService.changePassword(user.userId, user.instituteId, changePasswordDto);
    return {
      success: true,
      message: 'Password changed successfully. All active sessions have been logged out.',
    };
  }
}

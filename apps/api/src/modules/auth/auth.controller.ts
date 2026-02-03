import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

class RegisterDto {
  email: string;
  password: string;
  name: string;
}

class SyncUserDto {
  appwriteId: string;
  email: string;
  name: string;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Public()
  @ApiOperation({ summary: 'Register a new user' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.createUser(dto.email, dto.password, dto.name);
  }

  @Post('sync')
  @Public()
  @ApiOperation({ summary: 'Sync user from Appwrite to local database' })
  async syncUser(@Body() dto: SyncUserDto) {
    return this.authService.syncUserFromAppwrite(
      dto.appwriteId,
      dto.email,
      dto.name,
    );
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  async getMe(@CurrentUser() user: any) {
    return this.authService.getUserByAppwriteId(user.appwriteId);
  }
}

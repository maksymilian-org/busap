import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Client, Account } from 'node-appwrite';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
  private client: Client;

  constructor(
    private reflector: Reflector,
    private configService: ConfigService,
  ) {
    this.client = new Client()
      .setEndpoint(this.configService.get('APPWRITE_ENDPOINT', 'http://localhost/v1'))
      .setProject(this.configService.get('APPWRITE_PROJECT_ID', 'busap'));
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('No authentication token provided');
    }

    try {
      // Create a client with the user's session token
      const userClient = new Client()
        .setEndpoint(this.configService.get('APPWRITE_ENDPOINT', 'http://localhost/v1'))
        .setProject(this.configService.get('APPWRITE_PROJECT_ID', 'busap'))
        .setSession(token);

      const account = new Account(userClient);
      const user = await account.get();

      // Attach user to request
      request.user = {
        appwriteId: user.$id,
        email: user.email,
        name: user.name,
      };

      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}

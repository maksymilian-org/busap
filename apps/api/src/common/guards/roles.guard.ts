import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRoleType, UserRole } from '@busap/shared';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<UserRoleType[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Get user from database with their company roles
    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      include: {
        companyUsers: {
          where: { isActive: true },
          include: { company: true },
        },
      },
    });

    if (!dbUser) {
      throw new ForbiddenException('User not found in database');
    }

    // Superadmin has access to everything (system-level role)
    if (dbUser.systemRole === UserRole.SUPERADMIN) {
      request.user = { ...request.user, dbUser, isSuperadmin: true, isAdmin: true };
      return true;
    }

    // Admin has access to admin-level features (system-level role)
    if (dbUser.systemRole === UserRole.ADMIN) {
      if (requiredRoles.includes(UserRole.ADMIN) || requiredRoles.includes(UserRole.SUPERADMIN)) {
        request.user = { ...request.user, dbUser, isSuperadmin: false, isAdmin: true };
        return true;
      }
    }

    // Check if user has required role in any company
    const userRoles = dbUser.companyUsers.map((cu: { role: string }) => cu.role);
    const hasRequiredRole = requiredRoles.some((role) =>
      userRoles.includes(role),
    );

    if (!hasRequiredRole) {
      throw new ForbiddenException(
        `Required role: ${requiredRoles.join(' or ')}`,
      );
    }

    request.user = { ...request.user, dbUser };
    return true;
  }
}

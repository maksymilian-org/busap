import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client, Account, ID } from 'node-appwrite';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuthService {
  private client: Client;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.client = new Client()
      .setEndpoint(this.configService.get('APPWRITE_ENDPOINT', 'http://localhost/v1'))
      .setProject(this.configService.get('APPWRITE_PROJECT_ID', 'busap'))
      .setKey(this.configService.get('APPWRITE_API_KEY', ''));
  }

  async createUser(email: string, password: string, name: string) {
    const account = new Account(this.client);

    // Create user in Appwrite
    const appwriteUser = await account.create(ID.unique(), email, password, name);

    // Create user in our database
    const [firstName, ...lastNameParts] = name.split(' ');
    const lastName = lastNameParts.join(' ') || firstName;

    const user = await this.prisma.user.create({
      data: {
        appwriteId: appwriteUser.$id,
        email,
        firstName,
        lastName,
        preferredLanguage: 'pl',
      },
    });

    return { appwriteUser, user };
  }

  async syncUserFromAppwrite(appwriteId: string, email: string, name: string) {
    const existingUser = await this.prisma.user.findUnique({
      where: { appwriteId },
    });

    if (existingUser) {
      return existingUser;
    }

    const [firstName, ...lastNameParts] = name.split(' ');
    const lastName = lastNameParts.join(' ') || firstName;

    return this.prisma.user.create({
      data: {
        appwriteId,
        email,
        firstName,
        lastName,
        preferredLanguage: 'pl',
      },
    });
  }

  async getUserByAppwriteId(appwriteId: string) {
    return this.prisma.user.findUnique({
      where: { appwriteId },
      include: {
        companyUsers: {
          where: { isActive: true },
          include: { company: true },
        },
      },
    });
  }
}

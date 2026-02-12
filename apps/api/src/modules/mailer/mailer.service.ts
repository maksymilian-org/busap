import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private transporter: Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST', 'localhost'),
      port: this.configService.get<number>('SMTP_PORT', 1025),
      secure: this.configService.get('SMTP_SECURE', 'false') === 'true',
      auth:
        this.configService.get('SMTP_USER')
          ? {
              user: this.configService.get('SMTP_USER'),
              pass: this.configService.get('SMTP_PASS'),
            }
          : undefined,
    });
  }

  async sendVerificationEmail(
    email: string,
    token: string,
    firstName: string,
  ): Promise<void> {
    const frontendUrl = this.configService.get(
      'FRONTEND_URL',
      'http://localhost:3000',
    );
    const defaultLocale = this.configService.get('DEFAULT_LOCALE', 'pl');
    const verifyUrl = `${frontendUrl}/${defaultLocale}/verify-email?token=${token}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a1a;">Witaj, ${firstName}!</h2>
        <p>Dziękujemy za rejestrację w Busap. Kliknij poniższy link, aby zweryfikować swój adres email:</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${verifyUrl}"
             style="background-color: #2563eb; color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Zweryfikuj email
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">Link wygasa za 24 godziny.</p>
        <p style="color: #666; font-size: 14px;">Jeśli nie rejestrowałeś się w Busap, zignoruj tę wiadomość.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
        <p style="color: #999; font-size: 12px;">Busap - Platforma transportowa</p>
      </div>
    `;

    await this.sendMail(email, 'Zweryfikuj swój adres email - Busap', html);
  }

  async sendPasswordResetEmail(
    email: string,
    token: string,
    firstName: string,
  ): Promise<void> {
    const frontendUrl = this.configService.get(
      'FRONTEND_URL',
      'http://localhost:3000',
    );
    const defaultLocale = this.configService.get('DEFAULT_LOCALE', 'pl');
    const resetUrl = `${frontendUrl}/${defaultLocale}/reset-password?token=${token}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a1a;">Witaj, ${firstName}!</h2>
        <p>Otrzymaliśmy prośbę o zresetowanie hasła do Twojego konta w Busap.</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetUrl}"
             style="background-color: #2563eb; color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Zresetuj hasło
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">Link wygasa za 1 godzinę.</p>
        <p style="color: #666; font-size: 14px;">Jeśli nie prosiłeś o reset hasła, zignoruj tę wiadomość.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
        <p style="color: #999; font-size: 12px;">Busap - Platforma transportowa</p>
      </div>
    `;

    await this.sendMail(email, 'Reset hasła - Busap', html);
  }

  async sendInvitationEmail(
    email: string,
    token: string,
    invitedByName: string,
    role?: string,
    companyName?: string,
  ): Promise<void> {
    const frontendUrl = this.configService.get(
      'FRONTEND_URL',
      'http://localhost:3000',
    );
    const defaultLocale = this.configService.get('DEFAULT_LOCALE', 'pl');
    const registerUrl = `${frontendUrl}/${defaultLocale}/register?token=${token}`;

    const roleText = role === 'admin' ? 'administratora' : 'użytkownika';
    const companyText = companyName ? ` w firmie <strong>${companyName}</strong>` : '';

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a1a;">Zaproszenie do Busap</h2>
        <p><strong>${invitedByName}</strong> zaprosił Cię do dołączenia do platformy Busap jako ${roleText}${companyText}.</p>
        <p>Busap to nowoczesna platforma do zarządzania transportem autobusowym, która umożliwia śledzenie autobusów w czasie rzeczywistym.</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${registerUrl}"
             style="background-color: #10b981; color: white; padding: 14px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
            Załóż konto
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">Link jest ważny przez 7 dni.</p>
        <p style="color: #666; font-size: 14px;">Jeśli nie spodziewałeś się tego zaproszenia, możesz zignorować tę wiadomość.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
        <p style="color: #999; font-size: 12px;">Busap - Platforma transportowa</p>
      </div>
    `;

    await this.sendMail(email, `${invitedByName} zaprasza Cię do Busap`, html);
  }

  private async sendMail(
    to: string,
    subject: string,
    html: string,
  ): Promise<void> {
    try {
      const from = this.configService.get(
        'MAIL_FROM',
        'Busap <noreply@busap.pl>',
      );
      await this.transporter.sendMail({ from, to, subject, html });
      this.logger.log(`Email sent to ${to}: ${subject}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}: ${error}`);
    }
  }
}

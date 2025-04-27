import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) {}

  sendOTP(email: string, otp: string) {
    this.mailerService
      .sendMail({
        to: email,
        subject: 'One Time Password (OTP)',
        template: 'otp.hbs',
        text: '',
        context: {
          otpCode: otp,
          expiryTime: 5,
        },
      })
      .catch((error) => {
        console.error('Error sending email:', error);
      });
  }

  sendPasswordResetLink(email: string, token: string) {
    this.mailerService
      .sendMail({
        to: email,
        subject: 'Password Reset Link',
        template: 'password-reset.hbs',
        text: '',
        context: {
          resetLink: `https://example.com/reset-password/${token}`,
          expiryTime: 10,
        },
      })
      .catch((error) => {
        console.error('Error sending email:', error);
      });
  }

  sendConfirmPasswordUpdated(name: string, email: string) {
    this.mailerService
      .sendMail({
        to: email,
        subject: 'Your new password is set',
        template: 'confirm-password.hbs',
        text: '',
        context: {
          username: name,
        },
      })
      .catch((error) => {
        console.error('Error sending email:', error);
      });
  }
}

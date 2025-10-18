// src/services/email.service.ts
import nodemailer from 'nodemailer';

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendWelcomeEmail(to: string, userName: string): Promise<void> {
    await this.sendEmail({
      to,
      subject: 'Bem-vindo ao Etchi!',
      template: 'welcome',
      context: { userName },
    });
  }

  async sendPasswordResetEmail(to: string, userName: string, resetToken: string): Promise<void> {
    await this.sendEmail({
      to,
      subject: 'Redefinir sua senha - Etchi',
      template: 'password-reset',
      context: { 
        userName, 
        resetLink: `${process.env.CLIENT_URL}/reset-password?token=${resetToken}` 
      },
    });
  }

  async sendPasswordChangedConfirmation(to: string, userName: string): Promise<void> {
    await this.sendEmail({
      to,
      subject: 'Senha alterada - Etchi',
      template: 'password-changed',
      context: { userName },
    });
  }

  async sendEmail(options: {
    to: string;
    subject: string;
    template: string;
    context: any;
  }): Promise<void> {
    try {
      const html = this.renderTemplate(options.template, options.context);
      
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: options.to,
        subject: options.subject,
        html,
      });

      console.log(`Email enviado para: ${options.to}`);
    } catch (error: any) {
      console.error(`Erro ao enviar email para ${options.to}: ${error.message}`);
    }
  }

  private renderTemplate(template: string, context: any): string {
    const templates: any = {
      welcome: `
        <h1>Bem-vindo ao Etchi, ${context.userName}!</h1>
        <p>Estamos felizes por ter você conosco.</p>
      `,
      'password-reset': `
        <h1>Redefinir Senha</h1>
        <p>Olá ${context.userName},</p>
        <p>Clique no link abaixo para redefinir sua senha:</p>
        <a href="${context.resetLink}">Redefinir Senha</a>
      `,
      'password-changed': `
        <h1>Senha Alterada</h1>
        <p>Olá ${context.userName},</p>
        <p>Sua senha foi alterada com sucesso.</p>
      `,
    };

    return templates[template] || '<p>Email do Etchi</p>';
  }
}
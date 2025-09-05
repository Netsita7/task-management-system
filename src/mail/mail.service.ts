import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  constructor(private configService: ConfigService) {}

  async sendInvitationEmail(
    to: string,
    from: string,
    projectName: string,
    token: string
  ): Promise<void> {
    console.log('=== PROJECT INVITATION DETAILS ===');
    console.log(`nvited Email: ${to}`);
    console.log(`Invited By: ${from}`);
    console.log(`Project: ${projectName}`);
    console.log(`Invitation Token: ${token}`);
    console.log('Use this token to test the accept-invitation endpoint');
    console.log('=====================================');
    
  }
}
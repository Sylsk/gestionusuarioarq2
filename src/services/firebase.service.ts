import { Injectable, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly auth: admin.auth.Auth;

  constructor(private readonly configService: ConfigService) {
    const serviceAccount = {
      type: 'service_account',
      project_id: this.configService.get<string>('FIREBASE_PROJECT_ID'),
      private_key_id: this.configService.get<string>('FIREBASE_PRIVATE_KEY_ID'),
      private_key: this.configService.get<string>('FIREBASE_PRIVATE_KEY')?.replace(/\\n/g, '\n'),
      client_email: this.configService.get<string>('FIREBASE_CLIENT_EMAIL'),
      client_id: this.configService.get<string>('FIREBASE_CLIENT_ID'),
      auth_uri: 'https://accounts.google.com/o/oauth2/auth',
      token_uri: 'https://oauth2.googleapis.com/token',
      auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
      client_x509_cert_url: this.configService.get<string>('FIREBASE_CLIENT_CERT_URL'),
    };

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
      });
    }

    this.auth = admin.auth();
  }

  onModuleInit() {
    console.log('Firebase Service initialized');
  }

  async verifyToken(token: string): Promise<admin.auth.DecodedIdToken> {
    try {
      return await this.auth.verifyIdToken(token);
    } catch (error) {
      throw new Error(`Invalid Firebase token: ${error.message}`);
    }
  }

  async getUserByUid(uid: string): Promise<admin.auth.UserRecord> {
    try {
      return await this.auth.getUser(uid);
    } catch (error) {
      throw new Error(`User not found in Firebase: ${error.message}`);
    }
  }
}
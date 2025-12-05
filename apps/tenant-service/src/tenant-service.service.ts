import { Injectable } from '@nestjs/common';

@Injectable()
export class TenantServiceService {
  getHello(): string {
    return 'Hello World!';
  }
}

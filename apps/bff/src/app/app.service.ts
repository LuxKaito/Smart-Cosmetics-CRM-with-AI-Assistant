import { BadRequestException, Injectable } from '@nestjs/common';
import { PORT } from '@common/constants/common.constant';
@Injectable()
export class AppService {
  getData(): { message: string } {
    console.log(`Server is running on port ${PORT}`);

    // throw new BadRequestException('Bad Request Exception from AppService');

    return { message: 'Hello API' };
  }
}

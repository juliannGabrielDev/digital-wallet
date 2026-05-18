import { Injectable } from '@nestjs/common';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async createTransactionNotifications(data: any) {
    const { sender_user_id, receiver_user_id, amount, currency } = data;
    
    // Guardar notificación para el emisor
    await this.prisma.notification.create({
      data: {
        userId: sender_user_id,
        message: `Has enviado ${amount} ${currency}`,
        type: 'TRANSFER_SENT',
      },
    });

    // Guardar notificación para el receptor
    await this.prisma.notification.create({
      data: {
        userId: receiver_user_id,
        message: `Has recibido ${amount} ${currency}`,
        type: 'TRANSFER_RECEIVED',
      },
    });
  }

  findByUserId(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  create(createNotificationDto: CreateNotificationDto) {
    return 'This action adds a new notification';
  }

  findAll() {
    return this.prisma.notification.findMany();
  }

  findOne(id: number) {
    return this.prisma.notification.findUnique({ where: { id } });
  }

  update(id: number, updateNotificationDto: UpdateNotificationDto) {
    return `This action updates a #${id} notification`;
  }

  remove(id: number) {
    return this.prisma.notification.delete({ where: { id } });
  }
}

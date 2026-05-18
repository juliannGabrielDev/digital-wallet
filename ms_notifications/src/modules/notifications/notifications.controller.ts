import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { EventPattern, Payload } from '@nestjs/microservices';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @EventPattern('transaction.completed')
  async handleTransactionCompleted(@Payload() data: any) {
    console.log(`[ms_notifications] 🎉 Nuevo Evento de Transacción Recibido:`, data);
    
    // Llamar a notificationsService para guardar en BD
    await this.notificationsService.createTransactionNotifications(data);
    
    console.log(`[ms_notifications] Notificaciones guardadas en la base de datos para emisor y receptor.`);
  }

  // Endpoint para que la app de Expo consulte sus notificaciones
  @Get('user/:userId')
  findByUserId(@Param('userId') userId: string) {
    return this.notificationsService.findByUserId(userId);
  }

  @Post()
  create(@Body() createNotificationDto: CreateNotificationDto) {
    return this.notificationsService.create(createNotificationDto);
  }

  @Get()
  findAll() {
    return this.notificationsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.notificationsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateNotificationDto: UpdateNotificationDto) {
    return this.notificationsService.update(+id, updateNotificationDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.notificationsService.remove(+id);
  }
}

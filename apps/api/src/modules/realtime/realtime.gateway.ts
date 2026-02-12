import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Inject, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Server, Socket } from 'socket.io';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../../config/redis.module';

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:8081'],
  },
  namespace: '/realtime',
})
export class RealtimeGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private subscriber: Redis;
  private readonly logger = new Logger(RealtimeGateway.name);
  private readonly POSITION_CHANNEL = 'bus:positions';

  constructor(
    @Inject(REDIS_CLIENT) private redis: Redis,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  afterInit() {
    // Create a dedicated subscriber connection
    this.subscriber = this.redis.duplicate();

    this.subscriber.subscribe(this.POSITION_CHANNEL, (err) => {
      if (err) {
        this.logger.error(`Failed to subscribe to ${this.POSITION_CHANNEL}`, err);
      } else {
        this.logger.log(`Subscribed to Redis channel: ${this.POSITION_CHANNEL}`);
      }
    });

    this.subscriber.on('message', (channel, message) => {
      if (channel === this.POSITION_CHANNEL) {
        try {
          const data = JSON.parse(message);
          // Emit to trip-specific room
          if (data.tripId) {
            this.server.to(`trip:${data.tripId}`).emit('position:update', data);
          }
          // Emit to route-specific room
          if (data.routeId) {
            this.server.to(`route:${data.routeId}`).emit('position:update', data);
          }
        } catch (err) {
          this.logger.error('Failed to parse position message', err);
        }
      }
    });
  }

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get('JWT_SECRET'),
      });

      client.data.userId = payload.sub;
      client.data.email = payload.email;

      this.logger.log(`Client connected: ${client.id} (user: ${payload.sub})`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('subscribe:trip')
  handleSubscribeTrip(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { tripId: string },
  ) {
    client.join(`trip:${data.tripId}`);
    return { event: 'subscribed', data: { room: `trip:${data.tripId}` } };
  }

  @SubscribeMessage('subscribe:route')
  handleSubscribeRoute(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { routeId: string },
  ) {
    client.join(`route:${data.routeId}`);
    return { event: 'subscribed', data: { room: `route:${data.routeId}` } };
  }

  @SubscribeMessage('unsubscribe:trip')
  handleUnsubscribeTrip(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { tripId: string },
  ) {
    client.leave(`trip:${data.tripId}`);
    return { event: 'unsubscribed', data: { room: `trip:${data.tripId}` } };
  }

  @SubscribeMessage('unsubscribe:route')
  handleUnsubscribeRoute(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { routeId: string },
  ) {
    client.leave(`route:${data.routeId}`);
    return { event: 'unsubscribed', data: { room: `route:${data.routeId}` } };
  }
}

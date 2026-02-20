import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ConnectionsService } from './connections.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('connections')
@ApiBearerAuth()
@Controller('connections')
export class ConnectionsController {
  constructor(private readonly connectionsService: ConnectionsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all saved connections for current user' })
  findAll(@CurrentUser() user: any) {
    const userId = user.dbUser?.id ?? user.id;
    return this.connectionsService.findAll(userId);
  }

  @Post()
  @ApiOperation({ summary: 'Save a new connection' })
  create(
    @CurrentUser() user: any,
    @Body() body: { fromStopId: string; toStopId: string; name?: string },
  ) {
    const userId = user.dbUser?.id ?? user.id;
    return this.connectionsService.create(userId, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a saved connection' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    const userId = user.dbUser?.id ?? user.id;
    return this.connectionsService.remove(id, userId);
  }
}

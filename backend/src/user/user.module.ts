import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { User, UserSchema } from './schemas/user.schema';
import { ProjectModule } from '../project/project.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    ProjectModule,
  ],
  controllers: [UserController],
  providers: [UserService],
  /** Permet d’injecter le modèle User dans d’autres modules (ex. Messages). */
  exports: [MongooseModule, UserService],
})
export class UserModule {}

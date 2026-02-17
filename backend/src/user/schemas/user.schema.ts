import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  nom: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true, select: false })
  mot_de_passe: string;

  @Prop({ 
    required: true,
    enum: ['client', 'expert', 'artisan', 'manufacturer', 'admin']
  })
  role: string;

  @Prop({ required: true })
  telephone: string;
}

export const UserSchema = SchemaFactory.createForClass(User);

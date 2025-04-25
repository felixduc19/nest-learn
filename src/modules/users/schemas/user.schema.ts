import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({
  timestamps: true,
  versionKey: false,
})
export class User {
  @Prop()
  name: string;

  @Prop()
  email: string;

  @Prop()
  role: string;

  @Prop()
  isActive: boolean;

  @Prop({ select: false, required: true })
  password: string;

  @Prop()
  phone: string;

  @Prop()
  address: string;

  @Prop()
  image: string;

  @Prop()
  accountType: string;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.set('toJSON', {
  virtuals: true,
  transform: function (doc, ret) {
    delete ret._id;
    delete ret.password;
    delete ret.__v;
    return ret;
  },
});

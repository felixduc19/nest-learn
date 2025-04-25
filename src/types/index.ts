import { JwtPayload } from 'jsonwebtoken';

export interface JwtPayloadCustom extends JwtPayload {
  id: string;
  email: string;
  name: string;
  isActive: boolean;
}
export interface RequestWithUser extends Request {
  user: JwtPayloadCustom;
}

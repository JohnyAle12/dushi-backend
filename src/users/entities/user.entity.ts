import { Role } from '../../common/enums/role.enum';

export class User {
  id: string;
  name: string;
  email: string;
  password: string;
  storeId: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}

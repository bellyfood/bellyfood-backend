export interface AuthDto {
  phone: string;
  password: string;
  name?: string;
}

export interface User {
  _id: string;
  name: string;
  gender: string;
  phone: string;
  password: string;
  roles: string[];
  createdAt: Date;
  updatedAt: Date;
}

export class UsersFilter {
  approved?: boolean;
  paid?: boolean;
  delivered?: boolean;
  agentCode?: number;
}

export class CustomersFilter extends UsersFilter {
  role: string;
}

export class CreateAdmin {
  name: string;
  gender: string;
  phone: string;
  password: string;
  roles: string[] = ["ADMIN"];
}

export class CreateCustomer {
  name: string;
  gender: string;
  agentCode: number;
  phone: string;
  password: string;
  location: string;
  roles: string[] = ["CUSTOMER"];
  approved: boolean = false;
  packageDetails: { name: string; price: number };
}

export class AddPayment {
  phone: string;
  amount: number;
}

declare module "otp-generator";

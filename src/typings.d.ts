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

export class CustomersFilter {
  approved?: boolean;
  agentCode?: number;
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
  customerId: string;
  amount: number;
}

declare module "otp-generator";

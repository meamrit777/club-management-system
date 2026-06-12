export type UserRole = "SuperAdmin" | "Admin" | "Member";

export interface IUser {
  _id: string;

  firstName: string;
  lastName: string;

  email: string;
  phoneNumber: string;

  position: string;

  password: string;

  role: UserRole;
  isActive: boolean;
  profileImage: string;

  token?: string;
  tokenVersion: number;

  loginAttempts: number;
  lockUntil?: Date;

  createdAt: Date;
  updatedAt: Date;
}

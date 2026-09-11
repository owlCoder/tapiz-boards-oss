import type { Role, UserDto } from "@/domain/types";

export interface UserRecord extends UserDto {
  passwordHash: string;
}

export interface NewUser {
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  role: Role;
  isActive?: boolean;
}

export interface UsersRepo {
  listAll(): Promise<UserDto[]>;
  countActiveAdmins(): Promise<number>;
  findById(id: string): Promise<UserDto | null>;
  /** Like findById, but includes the password hash — for password changes. */
  findRecordById(id: string): Promise<UserRecord | null>;
  findByEmail(email: string): Promise<UserRecord | null>;
  create(user: NewUser): Promise<UserDto>;
  update(id: string, patch: Partial<NewUser>): Promise<void>;
  delete(id: string): Promise<void>;
}

export interface User {
  id: number;
  name: string;
  email: string;
}

export enum RoleI  {
    TEACHER = "teacher",
     STUDENT = "student"
}

export interface LoginRequestI {
  email: string;
  password: string;
}

export interface LoginResponseI {
  access: string;
  refresh: string;
}

export interface RefreshRequestI {
  refresh: string;
}

export interface UserCreateRequestI {
  name: string;
  email: string;
  role: string;
  status: string;
  password: string;
}

export interface AuthRegisterResponse {
  id: number;
  created_at: string;
  created_by: string | null;
  modified_at: string | null;
  modified_by: string | null;
  deleted_at: string | null;
  deleted_by: string | null;
  active: boolean;
  name: string;
  email: string;
  password: string;
  role: string;
  status: string;
  school: string | null;
  parent_name: string | null;
  parent_phone: string | null;
  avata: string | null;
}

export interface ChangePasswordRequestI {
  id: number;
  old_password: string;
  new_password: string;
}

export interface ChangeUserRequestI {
  name: string;
  email: string;
  school: string;
  parent_name: string;
  parent_phone: string;
  avata: {
    id: 0;
    url: string;
    payload: string;
  };
}

export interface GetUserResponseI {
  id: number;
  created_at: string | null;
  created_by:string | null;
  modified_at: string;
  modified_by: null;
  deleted_at: null;
  deleted_by: null;
  active: boolean;
  name: string;
  email: string;
  password: string;
  role: RoleI;
  status: string;
  school: string;
  parent_name: string;
  parent_phone: string;
  avata:string | null;
}

enum RoleI {
  TEACHER = "teacher",
  STUDENT = "student",
}

export interface UserI {
  id: number;
  name: string;
  role: RoleI;
  status: 'confirmed' | 'pending' | 'rejected';
}

export interface ClassI {
  code: string;
  id?: number;
  name: string;
  users: UserI[];
}

export interface FormCreateClassI {
  code: string;
  name: string;
}

// routes.ts
export const ROUTES = {
  // Auth routes
  ROOT: '/',
  LANDING: '/landing',
  LOGIN: '/login',
  REGISTER: '/register',

  // Main routes
  CLASSES: '/class',
  CREATE_CLASS: '/class/create',
  PROFILE: '/profile',

  // Class detail routes
  CLASS_DETAIL: '/class/:id',
  CLASS_EXAMS: '/class/:id/exam',
  EXAM_DETAIL: '/class/:id/exam/:exam_group_id',
  CREATE_EXAM: '/class/:id/exam/:exam_group_id/create',
  EDIT_EXAM: '/class/:id/exam/:exam_group_id/:exam_id',
  CLASS_MEMBERS: '/class/:id/members',
} as const;

// Helper functions để generate dynamic routes
export const generateRoutes = {
  classDetail: (id: number) => `/class/${id}`,
  classExams: (id: string) => `/class/${id}/exam`,
  examDetail: (classId: string, examGroupId: string) => 
    `/class/${classId}/exam/${examGroupId}`,
  createExam: (classId: string, examGroupId: string) => 
    `/class/${classId}/exam/${examGroupId}/create`,
  editExam: (classId: string, examGroupId: string, examId: string) => 
    `/class/${classId}/exam/${examGroupId}/${examId}`,
  classMembers: (classId: string) => `/class/${classId}/members`,
};

// Type definitions cho route parameters
export type RouteParams = {
  id: string;
  exam_group_id: string;
  exam_id: string;
};
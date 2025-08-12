// AppRouter.tsx
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from 'react-router-dom';
import { ROUTES } from './routes';
import Layout from '../components/common/Layout/Layout';
import MainLayout from '../components/common/Layout/MainLayout';
import AuthLayout from '../components/common/Layout/AuthLayout';
import LandingPage from '../pages/landing/LandingPage';
import Login from '../pages/auth/Login/Login';
import Register from '../pages/auth/Register/Register';
import ClassList from '../pages/classes/ClassList/ClassList';
import CreateClass from '../pages/classes/CreateClass/CreateClass';
import ClassDetail from '../pages/classes/ClassDetail/ClassDetail';
import ExamList from '../pages/exams/ExamList/ExamList';
import ExamDetail from '../pages/exams/ExamDetail/ExamDetail';
import CreateExam from '../pages/exams/CreateExam/CreateExam';
import Profile from '../pages/profile/Profile';
import MemberList from '../pages/members/MemberList/MemberList';
import EditExam from '../pages/exams/EditExam/EditExam';

const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [
      { path: ROUTES.LOGIN, element: <Login /> },
      { path: ROUTES.REGISTER, element: <Register /> },
      { path: ROUTES.ROOT, element: <Navigate to={ROUTES.LANDING} /> },
      { path: ROUTES.LANDING, element: <LandingPage /> },
    ],
  },
  {
    element: <Layout />,
    children: [
      { path: ROUTES.CLASS_DETAIL, element: <ClassDetail /> },
      { path: ROUTES.CLASS_EXAMS, element: <ExamList /> },
      { path: ROUTES.EXAM_DETAIL, element: <ExamDetail /> },
      { path: ROUTES.CREATE_EXAM, element: <CreateExam /> },
      { path: ROUTES.EDIT_EXAM, element: <EditExam /> },
      { path: ROUTES.CLASS_MEMBERS, element: <MemberList /> },
    ],
  },
  {
    element: <MainLayout />,
    children: [
      { path: ROUTES.CLASSES, element: <ClassList /> },
      { path: ROUTES.CREATE_CLASS, element: <CreateClass /> },
      { path: ROUTES.PROFILE, element: <Profile /> },
    ],
  },
]);

const AppRouter: React.FC = () => {
  return <RouterProvider router={router} />;
};

export default AppRouter;
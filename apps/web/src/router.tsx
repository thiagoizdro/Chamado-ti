import { createBrowserRouter } from 'react-router';

import App from './App';
import LoginPage from './pages/LoginPage';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '*', element: <App /> },
]);

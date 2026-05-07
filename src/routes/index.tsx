import { createBrowserRouter, Navigate } from "react-router";
import Main from "../layouts/Main/Main";
import Auth from "../layouts/Auth/Auth";
import NotFoundPage from "../app/NotFoundPage";
import { dashboardItems } from "../constants/router.constants";
import { routesGenerators } from "../lib/helpers/routesGenerators";
import SignIn from "../app/Authentication/SignIn";
import ForgotPassword from "../app/Authentication/ForgotPassword";
import VerifyEmail from "../app/Authentication/VerifyEmail";
import ResetPassword from "../app/Authentication/ResetPassword";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Main />,
    children: routesGenerators(dashboardItems),

    // errorElement: <div>404 Not Found</div>,
  },
  {
    path: "/auth",
    element: <Auth />,
    children: [
      {
        path: "/auth",
        element: <Navigate to={"/auth/sign-in"} />,
      },
      {
        path: "/auth/sign-in",
        element: <SignIn />,
      },
      {
        path: "/auth/forgot-password",
        element: <ForgotPassword />,
      },
      {
        path: "/auth/verify-email",
        element: <VerifyEmail />,
      },
      {
        path: "/auth/reset-password",
        element: <ResetPassword />,
      },
    ],
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);

export default router;

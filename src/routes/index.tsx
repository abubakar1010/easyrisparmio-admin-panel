import { createBrowserRouter, Navigate } from "react-router";
import { useEffect } from "react";
import Main from "../layouts/Main/Main";
import Auth from "../layouts/Auth/Auth";
import NotFoundPage from "../app/NotFoundPage";
import { dashboardItems } from "../constants/router.constants";
import { routesGenerators } from "../lib/helpers/routesGenerators";
import SignIn from "../app/Authentication/SignIn";
import ForgotPassword from "../app/Authentication/ForgotPassword";
import VerifyEmail from "../app/Authentication/VerifyEmail";
import ResetPassword from "../app/Authentication/ResetPassword";
import { useAppSelector, useAppDispatch } from "../redux/hooks";
import { useGetMeQuery } from "../redux/features/Auth/authApi";
import { setUser, logout } from "../redux/features/Auth/authSlice";
import { Spin } from "antd";

const ProtectedRoute = () => {
  const dispatch = useAppDispatch();
  const { token, user, isLoading } = useAppSelector((state) => state.auth);

  const { data, error, isLoading: isMeLoading } = useGetMeQuery(undefined, {
    skip: !token,
  });

  useEffect(() => {
    if (data) {
      dispatch(setUser({ user: data }));
    }
  }, [data, dispatch]);

  useEffect(() => {
    if (error) {
      const shouldLogout =
        ("status" in error && error.status === 401) || !user;

      if (shouldLogout) {
        // baseQueryWithReauth already handles 401 → refresh → retry → logout,
        // so we only dispatch logout() here as defense-in-depth (idempotent).
        dispatch(logout());
      } else {
        // Network error or server error — stop loading, use cached user
        dispatch(setUser({ user }));
      }
    }
  }, [error, dispatch]);

  if (!token) {
    return <Navigate to="/auth/sign-in" replace />;
  }

  if (isLoading || isMeLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  if (user && user.role !== "admin") {
    return <Navigate to="/auth/sign-in" replace />;
  }

  return <Main />;
};

const AuthRoute = () => {
  const { token } = useAppSelector((state) => state.auth);

  if (token) {
    return <Navigate to="/" replace />;
  }

  return <Auth />;
};

const router = createBrowserRouter([
  {
    path: "/",
    element: <ProtectedRoute />,
    children: routesGenerators(dashboardItems),
  },
  {
    path: "/auth",
    element: <AuthRoute />,
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

import { createBrowserRouter, Navigate } from "react-router-dom";
import React, { Suspense } from "react";
import { isLogin } from "../utils/auth";
import RequireAuth from "../utils/RequireAuth";


const Home = React.lazy(() => import("../page/home"));
const Login = React.lazy(() => import("../page/login"));
const NotFound = React.lazy(() => import("../page/404"));
const Register = React.lazy(() => import("../page/register"));


const router = createBrowserRouter([
  {
    path: "/",
    element: <RequireAuth allowed={true} redirectTo="/login"> <Home /></RequireAuth>,
  },
  
  {
    path: "/Login",
    element: <RequireAuth allowed={false} redirectTo="/"> <Login/></RequireAuth>, 
      
  
  },
  {
    path: "/register",
    element: <Register />,
  },
  
  {
    path: "*",
    element: <NotFound />,
  },
]);

export default router;
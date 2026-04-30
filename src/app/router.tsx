import { createBrowserRouter } from "react-router-dom";
import AppLayout from "./AppLayout";
import Dashboard from "../pages/Dashboard";
import PublicBooking from "../pages/PublicBooking";
import Login from "../pages/Login";
import Onboarding from "../pages/Onboarding";
import TodaySchedule from "../features/dashboard/components/TodaysSchedule";


export const router = createBrowserRouter([
    {
    path: "/onboarding",
    element: <Onboarding />,
  },

  {
    path: "/",
    element: <AppLayout />,
    children: [
      {
        path: "/dashboard/:slug",
        element: <Dashboard />,
      },
      {
        path: "/todays-schedule/:slug",
        element: <TodaySchedule />,
      },
    ]
  },
  {
    path: "/b/:slug",
    element: <PublicBooking />,
  },
  {
    path: "/login",
    element: <Login />,
  },
   
]);

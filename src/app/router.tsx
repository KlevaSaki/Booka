import { createBrowserRouter } from "react-router-dom";
import AppLayout from "./AppLayout";
import Dashboard from "../pages/Dashboard";
import PublicBooking from "../pages/PublicBooking";
import Login from "../pages/Login";
import Onboarding from "../pages/Onboarding";
import TodaySchedule from "../features/dashboard/components/TodaysSchedule";
import Settings from "../features/bookings/components/Settings";
import BusinessSetup from "../pages/BusinessSetup";


export const router = createBrowserRouter([
    {
    path: "/",
    element: <Onboarding />,
  },

  {
    element: <AppLayout />,
    children: [
      {
        path: "setup/:slug",
        element: <BusinessSetup />
      },
      {
        path: "dashboard/:slug",
        element: <Dashboard />,
      },
      {
        path: "todays-schedule/:slug",
        element: <TodaySchedule />,
      },
      {
        path: "settings/:slug",
        element: <Settings />,
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

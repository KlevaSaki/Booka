import { createBrowserRouter } from "react-router-dom";
import AppLayout from "./AppLayout";
import Dashboard from "../pages/Dashboard";
import PublicBooking from "../pages/PublicBooking";
import Login from "../pages/Login";
import NewBooking from "../pages/NewBooking";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: "/new-booking",
        element: <NewBooking />,
      },
    ]
  },
  {
    path: "/book/:businessId",
    element: <PublicBooking />,
  },
  {
    path: "/login",
    element: <Login />,
  },
   
]);

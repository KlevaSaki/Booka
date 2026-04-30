import { Link, Outlet } from "react-router-dom";
import { useBusinessStore } from "../features/business/store";

export default function AppLayout() {

    const activeSlug = useBusinessStore(
    (s) => s.activeBusinessSlug
  );
 
  return (
    
    <div className="flex min-h-screen bg-background">

      
      {/* SIDEBAR */}
      <aside className="w-64 bg-[#0F3D2E] text-white p-4 min-h-screen">
        <h1 className="text-xl font-bold mb-6">Booka</h1>

        <nav className="space-y-3">
          <Link className="block" to={activeSlug ? `/dashboard/${activeSlug}` : "/"}>
            Dashboard
          </Link>

          <Link
            className="block"
            to={activeSlug ? `/todays-schedule/${activeSlug}` : "/"}
            >
            Todays Schedule
        </Link>
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-6">
        <Outlet />
      </main>

    </div>
  );
}
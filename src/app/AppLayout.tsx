import { Link, Outlet } from "react-router-dom";

export default function AppLayout() {
  return (
    
    <div className="flex min-h-screen bg-background">

      
      {/* SIDEBAR */}
      <aside className="w-64 bg-[#0F3D2E] text-white p-4 min-h-screen">
        <h1 className="text-xl font-bold mb-6">Booka</h1>

        <nav className="space-y-3">
          <Link className="block" to="/">
            Dashboard
          </Link>

          <Link className="block" to="/new-booking">
            New Booking
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
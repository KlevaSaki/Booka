import { Link, Outlet } from "react-router-dom";
import { useBusinessStore } from "../features/business/store";

export default function AppLayout() {

    const activeSlug = useBusinessStore(
    (s) => s.activeBusinessSlug
  );
 
  return (
    
    <div className="flex min-h-screen bg-background">

      
      {/* SIDEBAR */}
      <aside className="w-64 bg-[#0F3D2E] text-white p-4 min-h-screen flex flex-col">

  {/* BRAND */}
  <div className="mb-6">
    <h1 className="text-2xl font-bold">Booka</h1>
    <p className="text-xs text-white/60">
      Business OS
    </p>
  </div>

  {/* ACTIVE BUSINESS CARD */}
  {activeSlug && (
    <div className="mb-6 p-3 bg-white/10 rounded-lg">
      <p className="text-xs text-white/60">Active Business</p>
      <p className="font-semibold truncate">
        {activeSlug}
      </p>
    </div>
  )}

  {/* NAVIGATION */}
  <nav className="space-y-2 flex-1">

    <p className="text-xs text-white/50 uppercase mb-2">
      Main
    </p>

    <Link
      className="block px-3 py-2 rounded hover:bg-white/10"
      to={activeSlug ? `/dashboard/${activeSlug}` : "/"}
    >
      📊 Dashboard
    </Link>

    <Link
      className="block px-3 py-2 rounded hover:bg-white/10"
      to={activeSlug ? `/todays-schedule/${activeSlug}` : "/"}
    >
      📅 Today’s Schedule
    </Link>

    <Link
      className="block px-3 py-2 rounded hover:bg-white/10"
      to={activeSlug ? `/settings/${activeSlug}` : "/"}
    >
      ⚙ Settings
    </Link>

    <p className="text-xs text-white/50 uppercase mt-4 mb-2">
      Tools
    </p>

    <Link
      className="block px-3 py-2 rounded hover:bg-white/10"
      to={activeSlug ? `/b/${activeSlug}` : "/"}
    >
      🔗 Public Booking Link
    </Link>

  </nav>

  {/* QUICK ACTIONS */}
  <div className="mt-auto pt-4 border-t border-white/10">

    <p className="text-xs text-white/50 mb-2">
      Quick Actions
    </p>

    {activeSlug && (
      <a
        href={`https://wa.me/?text=Check my business: ${window.location.origin}/b/${activeSlug}`}
        target="_blank"
        className="block text-center bg-white text-[#0F3D2E] py-2 rounded font-medium mb-2"
      >
        Share on WhatsApp
      </a>
    )}

  </div>

</aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-6">
        <Outlet />
      </main>

    </div>
  );
}
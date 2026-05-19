import { useMemo, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  CalendarDays,
  Check,
  Clipboard,
  ExternalLink,
  LayoutDashboard,
  Link as LinkIcon,
  Menu,
  Settings,
  Share2,
  X,
} from "lucide-react";
import { useBusinessStore } from "../features/business/store";

export default function AppLayout() {
  const [copied, setCopied] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const activeSlug = useBusinessStore((s) => s.activeBusinessSlug);
  const business = useBusinessStore((s) =>
    s.businesses.find((b) => b.slug === activeSlug)
  );

  const bookingLink = useMemo(() => {
    if (!activeSlug) return "";
    return `${window.location.origin}/b/${activeSlug}`;
  }, [activeSlug]);

  const navItems = [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      to: activeSlug ? `/dashboard/${activeSlug}` : "/",
    },
    {
      label: "Schedule",
      icon: CalendarDays,
      to: activeSlug ? `/todays-schedule/${activeSlug}` : "/",
    },
    {
      label: "Settings",
      icon: Settings,
      to: activeSlug ? `/settings/${activeSlug}` : "/",
    },
  ];

  async function copyBookingLink() {
    if (!bookingLink) return;

    await navigator.clipboard.writeText(bookingLink);
    setCopied(true);

    window.setTimeout(() => {
      setCopied(false);
    }, 1800);
  }

  function closeSidebar() {
    setSidebarOpen(false);
  }

  return (
    <div className="min-h-screen bg-[#FAF7EF] text-gray-900 lg:flex">
      {/* MOBILE HEADER */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[#D8D0BE] bg-[#0F3D2E] px-4 py-3 text-white lg:hidden">
        <div>
          <h1 className="text-lg font-semibold">Booka</h1>
          <p className="text-xs text-white/60">
            {business?.name || "Business OS"}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm font-medium"
        >
          <Menu className="h-4 w-4" />
          Menu
        </button>
      </header>

      {/* MOBILE OVERLAY */}
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={closeSidebar}
          className="fixed inset-0 z-40 bg-black/45 lg:hidden"
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-screen w-72 flex-col bg-[#0F3D2E] p-5 text-white shadow-2xl transition-transform duration-300 lg:sticky lg:top-0 lg:z-auto lg:translate-x-0 lg:shadow-none ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* BRAND */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FAF7EF] text-[#0F3D2E]">
              <CalendarDays className="h-5 w-5" />
            </div>

            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Booka</h1>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/55">
                Business OS
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeSidebar}
            className="rounded-lg bg-white/10 p-2 text-white/80 hover:bg-white/15 lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ACTIVE BUSINESS CARD */}
        {business && (
          <div className="mb-6 rounded-xl border border-white/10 bg-white/10 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-white/50">
              Active Business
            </p>
            <p className="mt-1 truncate text-base font-semibold">
              {business.name}
            </p>
            <p className="mt-1 truncate text-sm text-white/60">
              {business.location}
            </p>
          </div>
        )}

        {/* NAVIGATION */}
        <nav className="flex-1 space-y-1 overflow-y-auto">
          <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wide text-white/45">
            Main
          </p>

          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.label}
                to={item.to}
                onClick={closeSidebar}
                className={({ isActive }) =>
                  [
                    "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition",
                    isActive
                      ? "bg-[#FAF7EF] text-[#0F3D2E] shadow-sm"
                      : "text-white/75 hover:bg-white/10 hover:text-white",
                  ].join(" ")
                }
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            );
          })}

          <p className="mb-2 mt-6 px-3 text-xs font-medium uppercase tracking-wide text-white/45">
            Tools
          </p>

          <NavLink
            to={activeSlug ? `/b/${activeSlug}` : "/"}
            onClick={closeSidebar}
            className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-white/75 transition hover:bg-white/10 hover:text-white"
          >
            <ExternalLink className="h-4 w-4" />
            Public Booking Page
          </NavLink>
        </nav>

        {/* QUICK ACTIONS */}
        {activeSlug && (
          <div className="space-y-3 border-t border-white/10 pt-4">
            <div className="rounded-xl bg-black/10 p-3">
              <div className="mb-2 flex items-center gap-2 text-xs font-medium text-white/55">
                <LinkIcon className="h-3.5 w-3.5" />
                Booking Link
              </div>

              <p className="truncate text-xs text-white/75">{bookingLink}</p>
            </div>

            <button
              type="button"
              onClick={copyBookingLink}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#FAF7EF] px-4 py-3 text-sm font-semibold text-[#0F3D2E] transition hover:bg-white"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied
                </>
              ) : (
                <>
                  <Clipboard className="h-4 w-4" />
                  Copy Link
                </>
              )}
            </button>

            <a
              href={`https://wa.me/?text=${encodeURIComponent(
                `Book with ${business?.name || "my business"}: ${bookingLink}`
              )}`}
              target="_blank"
              rel="noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              <Share2 className="h-4 w-4" />
              Share on WhatsApp
            </a>
          </div>
        )}
      </aside>

      {/* MAIN CONTENT */}
      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
}
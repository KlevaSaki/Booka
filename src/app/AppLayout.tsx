import { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
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
import { supabase } from "../lib/supabase-client";

type Business = {
  slug: string;
  name: string;
  location?: string | null;
};

function getSlugFromPath(pathname: string) {
  const parts = pathname.split("/").filter(Boolean);
  return parts[1] || "";
}

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const [copied, setCopied] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [business, setBusiness] = useState<Business | null>(null);
  const [isLoadingBusiness, setIsLoadingBusiness] = useState(true);

  const routeSlug = getSlugFromPath(location.pathname);
  const activeSlug = routeSlug || business?.slug || "";

  useEffect(() => {
    async function loadActiveBusiness() {
      setIsLoadingBusiness(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setBusiness(null);
        setIsLoadingBusiness(false);
        return;
      }

      let query = supabase
        .from("businesses")
        .select("slug, name, location")
        .eq("user_id", user.id);

      if (routeSlug) {
        query = query.eq("slug", routeSlug);
      }

      const { data, error } = await query.limit(1).maybeSingle();

      if (error || !data) {
        setBusiness(null);
        setIsLoadingBusiness(false);
        return;
      }

      setBusiness(data as Business);
      setIsLoadingBusiness(false);
    }

    loadActiveBusiness();
  }, [routeSlug]);

  const bookingLink = useMemo(() => {
    if (!activeSlug) return "";
    return `${window.location.origin}/b/${activeSlug}`;
  }, [activeSlug]);

  const navItems = [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      to: activeSlug ? `/dashboard/${activeSlug}` : "",
    },
    {
      label: "Schedule",
      icon: CalendarDays,
      to: activeSlug ? `/todays-schedule/${activeSlug}` : "",
    },
    {
      label: "Settings",
      icon: Settings,
      to: activeSlug ? `/settings/${activeSlug}` : "",
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

  function handleMissingBusiness() {
    closeSidebar();
    navigate("/");
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#FAF7EF] text-gray-900 lg:flex">
      <header className="sticky top-0 z-30 flex min-w-0 items-center justify-between gap-3 border-b border-[#D8D0BE] bg-[#0F3D2E] px-4 py-3 text-white lg:hidden">
        <div className="min-w-0">
          <h1 className="truncate text-lg font-semibold">Booka</h1>
          <p className="truncate text-xs text-white/60">
            {business?.name || "Business OS"}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm font-medium"
        >
          <Menu className="h-4 w-4" />
          Menu
        </button>
      </header>

      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={closeSidebar}
          className="fixed inset-0 z-40 bg-black/45 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-dvh w-72 max-w-[85vw] flex-col bg-[#0F3D2E] p-5 text-white shadow-2xl transition-transform duration-300 lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:max-w-none lg:translate-x-0 lg:shadow-none ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-8 flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FAF7EF] text-[#0F3D2E]">
              <CalendarDays className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <h1 className="truncate text-2xl font-semibold tracking-tight">
                Booka
              </h1>
              <p className="truncate text-xs font-medium uppercase tracking-[0.18em] text-white/55">
                Booking Made Easy
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeSidebar}
            className="shrink-0 rounded-lg bg-white/10 p-2 text-white/80 hover:bg-white/15 lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {business && (
          <div className="mb-6 min-w-0 rounded-xl border border-white/10 bg-white/10 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-white/50">
              Active Business
            </p>
            <p className="mt-1 truncate text-base font-semibold">
              {business.name}
            </p>
            <p className="mt-1 truncate text-sm text-white/60">
              {business.location || "Location not set"}
            </p>
          </div>
        )}

        {!business && !isLoadingBusiness && (
          <div className="mb-6 rounded-xl border border-white/10 bg-white/10 p-4 text-sm text-white/70">
            No active business found.
          </div>
        )}

        <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto">
          <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wide text-white/45">
            Main
          </p>

          {navItems.map((item) => {
            const Icon = item.icon;

            if (!item.to) {
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={handleMissingBusiness}
                  className="flex w-full min-w-0 items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-white/45"
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            }

            return (
              <NavLink
                key={item.label}
                to={item.to}
                onClick={closeSidebar}
                className={({ isActive }) =>
                  [
                    "flex min-w-0 items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition",
                    isActive
                      ? "bg-[#FAF7EF] text-[#0F3D2E] shadow-sm"
                      : "text-white/75 hover:bg-white/10 hover:text-white",
                  ].join(" ")
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            );
          })}

          <p className="mb-2 mt-6 px-3 text-xs font-medium uppercase tracking-wide text-white/45">
            Tools
          </p>

          {activeSlug ? (
            <NavLink
              to={`/b/${activeSlug}`}
              onClick={closeSidebar}
              className="flex min-w-0 items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-white/75 transition hover:bg-white/10 hover:text-white"
            >
              <ExternalLink className="h-4 w-4 shrink-0" />
              <span className="truncate">Public Booking Page</span>
            </NavLink>
          ) : (
            <button
              type="button"
              onClick={handleMissingBusiness}
              className="flex w-full min-w-0 items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-white/45"
            >
              <ExternalLink className="h-4 w-4 shrink-0" />
              <span className="truncate">Public Booking Page</span>
            </button>
          )}
        </nav>

        {activeSlug && (
          <div className="space-y-3 border-t border-white/10 pt-4">
            <div className="min-w-0 rounded-xl bg-black/10 p-3">
              <div className="mb-2 flex items-center gap-2 text-xs font-medium text-white/55">
                <LinkIcon className="h-3.5 w-3.5 shrink-0" />
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
                  <Check className="h-4 w-4 shrink-0" />
                  Copied
                </>
              ) : (
                <>
                  <Clipboard className="h-4 w-4 shrink-0" />
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
              <Share2 className="h-4 w-4 shrink-0" />
              <span className="truncate">Share on WhatsApp</span>
            </a>
          </div>
        )}
      </aside>

      <main className="min-w-0 flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
}
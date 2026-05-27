import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  CalendarDays,
  Check,
  Clipboard,
  Clock,
  ExternalLink,
  MapPin,
  Settings,
  Share2,
  Wallet,
} from "lucide-react";

import { supabase } from "../lib/supabase-client";

type Service = {
  name: string;
  price: number;
};

type WorkingHours = {
  days: string[];
  open: string;
  close: string;
};

type Business = {
  id: string;
  userId: string;
  name: string;
  owner?: string;
  email?: string;
  phone?: string;
  location: string;
  description?: string;
  slug: string;
  bookingLink?: string;
  images: string[];
  department?: string;
  services: Service[];
  workingHours?: WorkingHours;
  socialLinks?: {
    instagram?: string;
    facebook?: string;
    website?: string;
  };
  isSetupComplete: boolean;
  statusText?: string;
  statusCreatedAt?: string;
};

type Booking = {
  id: string;
  businessSlug: string;
  service: string;
  name: string;
  phone: string;
  datetime: string;
};

type BusinessRow = {
  id: string;
  user_id: string;
  name: string;
  owner?: string;
  email?: string;
  phone?: string;
  location: string;
  description?: string | null;
  slug: string;
  booking_link?: string | null;
  images?: string[] | null;
  department?: string | null;
  services?: Service[] | null;
  working_hours?: WorkingHours | null;
  social_links?: {
    instagram?: string;
    facebook?: string;
    website?: string;
  } | null;
  is_setup_complete?: boolean | null;
  status_text?: string | null;
  status_created_at?: string | null;
};

type BookingRow = {
  id: string;
  business_slug: string;
  service: string;
  name: string;
  phone: string;
  datetime: string;
};

function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function getDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDate(datetime?: string) {
  if (!datetime) return "No date";

  return new Date(datetime).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

function formatTime(datetime?: string) {
  if (!datetime) return "";

  return new Date(datetime).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatPrice(price: number) {
  return `KES ${price.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function normalizeBusiness(row: BusinessRow): Business {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    owner: row.owner,
    email: row.email,
    phone: row.phone,
    location: row.location,
    description: row.description || "",
    slug: row.slug,
    bookingLink: row.booking_link || `/b/${row.slug}`,
    images: row.images || [],
    department: row.department || undefined,
    services: row.services || [],
    workingHours: row.working_hours || undefined,
    socialLinks: row.social_links || undefined,
    isSetupComplete: Boolean(row.is_setup_complete),
    statusText: row.status_text || undefined,
    statusCreatedAt: row.status_created_at || undefined,
  };
}

function normalizeBooking(row: BookingRow): Booking {
  return {
    id: row.id,
    businessSlug: row.business_slug,
    service: row.service,
    name: row.name,
    phone: row.phone,
    datetime: row.datetime,
  };
}

export default function Dashboard() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [copied, setCopied] = useState(false);
  const [business, setBusiness] = useState<Business | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusText, setStatusText] = useState("");
  const [statusError, setStatusError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      setIsLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate("/");
        return;
      }

      const { data: businessData, error: businessError } = await supabase
        .from("businesses")
        .select("*")
        .eq("slug", slug)
        .eq("user_id", user.id)
        .single();

      if (businessError || !businessData) {
        setBusiness(null);
        setIsLoading(false);
        return;
      }

      const mappedBusiness = normalizeBusiness(businessData as BusinessRow);

      setBusiness(mappedBusiness);
      setStatusText(mappedBusiness.statusText || "");

      if (!mappedBusiness.isSetupComplete) {
        navigate(`/setup/${mappedBusiness.slug}`);
        return;
      }

      const { data: bookingData } = await supabase
        .from("bookings")
        .select("*")
        .eq("business_slug", slug)
        .order("datetime", { ascending: true });

      setBookings(
        ((bookingData || []) as BookingRow[]).map((booking) =>
          normalizeBooking(booking)
        )
      );

      setIsLoading(false);
    }

    loadDashboard();
  }, [slug, navigate]);

  async function updateStatus() {
    if (!business) return;

    setStatusError("");

    const trimmed = statusText.trim();

    if (!trimmed) {
      setStatusError("Enter a short status update first.");
      return;
    }

    const createdAt = new Date().toISOString();

    const { error } = await supabase
      .from("businesses")
      .update({
        status_text: trimmed,
        status_created_at: createdAt,
      })
      .eq("slug", business.slug);

    if (error) {
      setStatusError(error.message);
      return;
    }

    setBusiness({
      ...business,
      statusText: trimmed,
      statusCreatedAt: createdAt,
    });
  }

  const businessBookings = useMemo(() => {
    return bookings.filter((booking) => booking.businessSlug === slug);
  }, [bookings, slug]);

  const todayBookings = useMemo(() => {
    const today = getDateKey(new Date());

    return businessBookings.filter((booking) => {
      if (!booking.datetime) return false;
      return getDateKey(new Date(booking.datetime)) === today;
    });
  }, [businessBookings]);

  const upcomingBookings = useMemo(() => {
    const now = new Date();

    return businessBookings
      .filter((booking) => booking.datetime && new Date(booking.datetime) >= now)
      .sort(
        (a, b) =>
          new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
      )
      .slice(0, 5);
  }, [businessBookings]);

  const totalRevenue = useMemo(() => {
    if (!business?.services?.length) return 0;

    return businessBookings.reduce((total, booking) => {
      const service = business.services.find(
        (item: Service) => item.name === booking.service
      );

      return total + (service?.price || 0);
    }, 0);
  }, [business?.services, businessBookings]);

  const status = useMemo(() => {
    if (!business?.workingHours) return "Unknown";

    const { days, open, close } = business.workingHours;

    const now = new Date();
    const currentDay = now.toLocaleDateString("en-US", {
      weekday: "long",
    });

    const isWorkingDay = days?.includes(currentDay);

    if (!isWorkingDay) return "Closed";

    const currentTime = now.getHours() * 60 + now.getMinutes();
    const openTime = timeToMinutes(open);
    const closeTime = timeToMinutes(close);

    return currentTime >= openTime && currentTime <= closeTime
      ? "Open"
      : "Closed";
  }, [business]);

  if (isLoading) {
    return (
      <main className="min-h-screen overflow-x-hidden bg-[#FAF7EF] p-4 sm:p-6">
        <div className="mx-auto max-w-md rounded-2xl border border-[#D8D0BE] bg-white p-6 text-center shadow-sm sm:p-8">
          <h2 className="text-xl font-semibold text-gray-950">
            Loading dashboard
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Preparing your business data.
          </p>
        </div>
      </main>
    );
  }

  if (!business) {
    return (
      <main className="min-h-screen overflow-x-hidden bg-[#FAF7EF] p-4 sm:p-6">
        <div className="mx-auto max-w-md rounded-2xl border border-[#D8D0BE] bg-white p-6 text-center shadow-sm sm:p-8">
          <h2 className="text-xl font-semibold text-gray-950">
            Business not found
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            This dashboard link is invalid.
          </p>
        </div>
      </main>
    );
  }

  const bookingLink = `${window.location.origin}/b/${business.slug}`;

  async function copyBookingLink() {
    await navigator.clipboard.writeText(bookingLink);
    setCopied(true);

    window.setTimeout(() => {
      setCopied(false);
    }, 1800);
  }

  return (
    <div className="min-w-0 space-y-6 overflow-x-hidden">
      <section className="overflow-hidden rounded-2xl border border-[#D8D0BE] bg-white shadow-sm">
  <div className="relative min-h-64 bg-[#0F3D2E]">
    {business.images?.[0] && (
      <img
        src={business.images[0]}
        alt={business.name}
        className="absolute inset-0 h-full w-full object-cover"
      />
    )}

    <div className="absolute inset-0 bg-linear-to-r from-[#0F3D2E]/95 via-[#0F3D2E]/75 to-black/20" />

    <Link
      to={`/settings/${business.slug}`}
      aria-label="Settings"
      className="absolute right-4 top-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#FAF7EF] text-[#0F3D2E] shadow-sm transition hover:bg-white"
    >
      <Settings className="h-4 w-4" />
    </Link>

    <div className="relative flex min-h-64 flex-col justify-between p-5 text-white sm:p-8">
      <div className="min-w-0 pr-14">
        <div
          className={`mb-4 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
            status === "Open"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {status}
        </div>

        <h1 className="max-w-2xl wrap-break-word text-3xl font-semibold tracking-tight sm:text-4xl">
          {business.name}
        </h1>
      </div>

      <div className="mt-8 max-w-2xl">
        <div className="mb-3 flex min-w-0 flex-wrap gap-3 text-sm text-white/80">
          <span className="inline-flex min-w-0 items-center gap-1">
            <MapPin className="h-4 w-4 shrink-0" />
            <span className="truncate">{business.location}</span>
          </span>

          {business.department && (
            <span className="rounded-full bg-white/10 px-3 py-1 capitalize">
              {business.department}
            </span>
          )}
        </div>

        {business.description && (
          <p className="wrap-break-word text-sm leading-6 text-white/75 sm:text-base">
            {business.description}
          </p>
        )}
      </div>
    </div>
  </div>
      </section>

      <section className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="min-w-0 rounded-2xl border border-[#D8D0BE] bg-white p-5 shadow-sm">
          <p className="flex items-center gap-2 text-sm text-gray-500">
            <CalendarDays className="h-4 w-4 shrink-0 text-[#0F3D2E]" />
            Today
          </p>
          <p className="mt-3 truncate text-3xl font-semibold text-gray-950">
            {todayBookings.length}
          </p>
        </div>

        <div className="min-w-0 rounded-2xl border border-[#D8D0BE] bg-white p-5 shadow-sm">
          <p className="flex items-center gap-2 text-sm text-gray-500">
            <Clipboard className="h-4 w-4 shrink-0 text-[#0F3D2E]" />
            Total Bookings
          </p>
          <p className="mt-3 truncate text-3xl font-semibold text-gray-950">
            {businessBookings.length}
          </p>
        </div>

        <div className="min-w-0 rounded-2xl border border-[#D8D0BE] bg-white p-5 shadow-sm">
          <p className="flex items-center gap-2 text-sm text-gray-500">
            <Wallet className="h-4 w-4 shrink-0 text-[#0F3D2E]" />
            Estimated Revenue
          </p>
          <p className="mt-3 truncate text-2xl font-semibold text-gray-950">
            {formatPrice(totalRevenue)}
          </p>
        </div>

        <div className="min-w-0 rounded-2xl border border-[#D8D0BE] bg-white p-5 shadow-sm">
          <p className="flex items-center gap-2 text-sm text-gray-500">
            <Clock className="h-4 w-4 shrink-0 text-[#0F3D2E]" />
            Business Status
          </p>
          <p
            className={`mt-3 truncate text-3xl font-semibold ${
              status === "Open" ? "text-green-600" : "text-red-500"
            }`}
          >
            {status}
          </p>
        </div>
      </section>

      <section className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-6">
          <div className="min-w-0 rounded-2xl border border-[#D8D0BE] bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-4 flex min-w-0 items-center justify-between gap-3">
              <h2 className="min-w-0 truncate text-lg font-semibold text-gray-950">
                Services Offered
              </h2>
              <span className="shrink-0 rounded-full bg-[#FAF7EF] px-3 py-1 text-xs font-semibold text-[#0F3D2E]">
                {business.services?.length || 0} services
              </span>
            </div>

            {business.services?.length ? (
              <div className="grid min-w-0 gap-3 sm:grid-cols-2">
                {business.services.map((service: Service) => (
                  <div
                    key={service.name}
                    className="min-w-0 rounded-xl border border-gray-200 bg-[#FAF7EF] p-4"
                  >
                    <p className="truncate font-semibold text-gray-950">
                      {service.name}
                    </p>
                    <p className="mt-1 truncate text-sm font-medium text-[#0F3D2E]">
                      {formatPrice(service.price)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No services added yet.</p>
            )}
          </div>

          <div className="min-w-0 rounded-2xl border border-[#D8D0BE] bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-semibold text-gray-950">
              Upcoming Bookings
            </h2>

            {upcomingBookings.length ? (
              <div className="mt-4 space-y-3">
                {upcomingBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="flex min-w-0 flex-col gap-3 rounded-xl border border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-gray-950">
                        {booking.name}
                      </p>
                      <p className="truncate text-sm text-gray-500">
                        {booking.service}
                      </p>
                    </div>

                    <div className="shrink-0 text-sm text-gray-600 sm:text-right">
                      <p className="font-medium text-gray-950">
                        {formatDate(booking.datetime)}
                      </p>
                      <p>{formatTime(booking.datetime)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-gray-500">
                No upcoming bookings yet.
              </p>
            )}
          </div>
        </div>

        <aside className="min-w-0 space-y-6 xl:sticky xl:top-6 xl:self-start">
          <div className="min-w-0 rounded-2xl border border-[#D8D0BE] bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-semibold text-gray-950">
              Business Schedule
            </h2>

            {business.workingHours ? (
              <div className="mt-4 space-y-4 text-sm">
                <div className="min-w-0">
                  <p className="font-medium text-gray-950">Working Days</p>
                  <p className="mt-1 wrap-break-word text-gray-500">
                    {business.workingHours.days?.join(", ")}
                  </p>
                </div>

                <div>
                  <p className="font-medium text-gray-950">Hours</p>
                  <p className="mt-1 text-gray-500">
                    {business.workingHours.open} - {business.workingHours.close}
                  </p>
                </div>
              </div>
            ) : (
              <p className="mt-3 text-sm text-gray-500">
                Working hours not set.
              </p>
            )}
          </div>

          <div className="min-w-0 rounded-2xl border border-[#D8D0BE] bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-semibold text-gray-950">
              Business Status
            </h2>

            <textarea
              value={statusText}
              onChange={(e) => setStatusText(e.target.value)}
              maxLength={120}
              rows={3}
              placeholder="Post a short update for clients"
              className="mt-4 w-full min-w-0 resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-gray-400 focus:border-[#0F3D2E] focus:ring-4 focus:ring-[#0F3D2E]/10"
            />

            {statusError && (
              <p className="mt-2 text-sm text-red-600">{statusError}</p>
            )}

            <button
              type="button"
              onClick={updateStatus}
              className="mt-3 w-full rounded-xl bg-[#0F3D2E] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0c2f23]"
            >
              Post Status
            </button>

            <p className="mt-2 text-xs text-gray-500">
              This status is shown on your public booking page for 24 hours.
            </p>
          </div>

          <div className="min-w-0 rounded-2xl border border-[#D8D0BE] bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-semibold text-gray-950">
              Share Your Business
            </h2>

            <div className="mt-4 min-w-0 rounded-xl bg-[#FAF7EF] p-3">
              <p className="truncate text-sm text-gray-600">{bookingLink}</p>
            </div>

            <div className="mt-4 grid gap-3">
              <button
                type="button"
                onClick={copyBookingLink}
                className="inline-flex min-w-0 items-center justify-center gap-2 rounded-xl bg-[#0F3D2E] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0c2f23]"
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
                  `Book with ${business.name}: ${bookingLink}`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-w-0 items-center justify-center gap-2 rounded-xl border border-[#0F3D2E]/20 px-4 py-3 text-sm font-semibold text-[#0F3D2E] transition hover:bg-[#FAF7EF]"
              >
                <Share2 className="h-4 w-4 shrink-0" />
                <span className="truncate">Share on WhatsApp</span>
              </a>

              <Link
                to={`/b/${business.slug}`}
                className="inline-flex min-w-0 items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                <ExternalLink className="h-4 w-4 shrink-0" />
                <span className="truncate">View Public Page</span>
              </Link>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
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
import { useBusinessStore } from "../features/business/store";
import { useBookingStore } from "../features/bookings/store";

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

export default function Dashboard() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [copied, setCopied] = useState(false);

  const business = useBusinessStore((s) =>
    s.businesses.find((b) => b.slug === slug)
  );

  const bookings = useBookingStore((s) => s.bookings);

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
        (item) => item.name === booking.service
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

  useEffect(() => {
    if (business && !business.isSetupComplete) {
      navigate(`/setup/${business.slug}`);
    }
  }, [business, navigate]);

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

          <div className="absolute inset-0 bg-gradient-to-r from-[#0F3D2E]/95 via-[#0F3D2E]/75 to-black/20" />

          <div className="relative flex min-h-64 flex-col justify-between p-5 text-white sm:p-8">
            <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div
                  className={`mb-4 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                    status === "Open"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {status}
                </div>

                <h1 className="max-w-2xl break-words text-3xl font-semibold tracking-tight sm:text-4xl">
                  {business.name}
                </h1>

                <div className="mt-3 flex min-w-0 flex-wrap gap-3 text-sm text-white/75">
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
              </div>

              <Link
                to={`/settings/${business.slug}`}
                className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-[#FAF7EF] px-4 py-3 text-sm font-semibold text-[#0F3D2E] transition hover:bg-white sm:w-fit"
              >
                <Settings className="h-4 w-4 shrink-0" />
                Settings
              </Link>
            </div>

            {business.description && (
              <p className="mt-8 max-w-2xl break-words text-sm leading-6 text-white/75 sm:text-base">
                {business.description}
              </p>
            )}
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
                {business.services.map((service) => (
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
                  <p className="mt-1 break-words text-gray-500">
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
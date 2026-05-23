import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Globe,
  MapPin,
  Menu,
  MessageCircle,
  Phone,
  Share2,
  User,
  X,
} from "lucide-react";
import { useBusinessStore } from "../features/business/store";
import type { Business } from "../features/business/store";
import { useBookingStore } from "../features/bookings/store";

type VisitedBusiness = {
  slug: string;
  name: string;
  location?: string;
  visitedAt: number;
};

const VISITED_BUSINESSES_KEY = "booka_visited_businesses";
const BUSINESS_STATUSES_KEY = "booka_business_statuses";
const STATUS_DURATION = 24 * 60 * 60 * 1000;

function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

function formatTimeLabel(time: string) {
  return new Date(`2026-01-01T${time}`).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatPrice(price?: number) {
  if (!price) return "Price on request";

  return `KES ${price.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function getServiceName(service: any) {
  return typeof service === "string" ? service : service.name;
}

function getServicePrice(service: any) {
  return typeof service === "string" ? undefined : service.price;
}

function loadVisitedBusinesses(): VisitedBusiness[] {
  try {
    const data = localStorage.getItem(VISITED_BUSINESSES_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveVisitedBusiness(business: Business) {
  const visited = loadVisitedBusinesses();

  const next = [
    {
      slug: business.slug,
      name: business.name,
      location: business.location,
      visitedAt: Date.now(),
    },
    ...visited.filter((item) => item.slug !== business.slug),
  ].slice(0, 20);

  localStorage.setItem(VISITED_BUSINESSES_KEY, JSON.stringify(next));
  return next;
}

function getStatusMap(): Record<string, number> {
  try {
    const data = localStorage.getItem(BUSINESS_STATUSES_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

function getOrCreateStatusExpiry(slug: string) {
  const now = Date.now();
  const statuses = getStatusMap();
  const currentExpiry = statuses[slug];

  if (currentExpiry && currentExpiry > now) return currentExpiry;

  const nextExpiry = now + STATUS_DURATION;
  statuses[slug] = nextExpiry;
  localStorage.setItem(BUSINESS_STATUSES_KEY, JSON.stringify(statuses));

  return nextExpiry;
}

function BookingExperience({ business }: { business: Business }) {
  const addBooking = useBookingStore((s) => s.addBooking);
  const bookings = useBookingStore((s) => s.bookings);

  const [selectedService, setSelectedService] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [statusExpiry, setStatusExpiry] = useState<number | null>(null);
  const [statusOpen, setStatusOpen] = useState(false);

  const businessImages = useMemo(() => {
    return (business.images || []).filter(Boolean).slice(0, 4);
  }, [business.images]);

  const mainImage = businessImages[0];
  const galleryImages = businessImages.slice(1, 4);

  useEffect(() => {
    setStatusExpiry(getOrCreateStatusExpiry(business.slug));
  }, [business.slug]);

  const showStatus = Boolean(statusExpiry && statusExpiry > Date.now());

  const selectedServiceDetails = useMemo(() => {
    return business.services?.find(
      (service: any) => getServiceName(service) === selectedService
    );
  }, [business.services, selectedService]);

  const socialLinks = useMemo(() => {
    return [
      {
        label: "Instagram",
        href: business.socialLinks?.instagram,
        icon: MessageCircle,
      },
      {
        label: "Facebook",
        href: business.socialLinks?.facebook,
        icon: Share2,
      },
      {
        label: "Website",
        href: business.socialLinks?.website,
        icon: Globe,
      },
    ].filter((link) => Boolean(link.href));
  }, [business.socialLinks]);

  const timeSlots = useMemo(() => {
    const open = business.workingHours?.open;
    const close = business.workingHours?.close;

    if (!open || !close) return [];

    const slots: string[] = [];
    const start = timeToMinutes(open);
    const end = timeToMinutes(close);

    for (let current = start; current < end; current += 60) {
      slots.push(minutesToTime(current));
    }

    return slots;
  }, [business.workingHours]);

  const bookedTimes = useMemo(() => {
    if (!date) return [];

    return bookings
      .filter((booking) => {
        if (booking.businessSlug !== business.slug) return false;

        const bookingDate = new Date(booking.datetime)
          .toISOString()
          .split("T")[0];

        return bookingDate === date;
      })
      .map((booking) => new Date(booking.datetime).toTimeString().slice(0, 5));
  }, [bookings, business.slug, date]);

  const availableSlots = timeSlots.filter((slot) => !bookedTimes.includes(slot));

  const inputClass =
    "w-full min-w-0 rounded-xl border border-gray-200 bg-white px-4 py-3 text-base outline-none transition placeholder:text-gray-400 focus:border-[#0F3D2E] focus:ring-4 focus:ring-[#0F3D2E]/10 sm:text-sm";

  function handleSubmit() {
    setError("");
    setConfirmed(false);

    if (!selectedService || !date || !time || !name || !phone) {
      setError("Please complete all fields before confirming your booking.");
      return;
    }

    addBooking({
      businessSlug: business.slug,
      service: selectedService,
      name,
      phone,
      datetime: new Date(`${date}T${time}`).toISOString(),
    });

    setConfirmed(true);
    setSelectedService("");
    setDate("");
    setTime("");
    setName("");
    setPhone("");
  }

  return (
    <div className="mx-auto min-w-0 max-w-6xl space-y-6 overflow-x-hidden text-gray-900">
      <section className="overflow-hidden rounded-2xl border border-[#D8D0BE] bg-white shadow-sm">
        <div className="grid min-w-0 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <div className="relative h-72 min-w-0 bg-[#0F3D2E] sm:h-96">
            {mainImage ? (
              <img
                src={mainImage}
                alt={business.name}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center px-6 text-center">
                <h1 className="break-words text-4xl font-semibold text-[#FAF7EF]">
                  {business.name}
                </h1>
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

            {showStatus && (
              <button
                type="button"
                onClick={() => setStatusOpen(true)}
                className="absolute left-4 top-4 z-10 inline-flex items-center gap-2 rounded-full bg-white/95 px-3 py-2 text-xs font-semibold text-[#0F3D2E] shadow-sm ring-2 ring-[#0F3D2E]"
              >
                <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
                Status
              </button>
            )}

            <div className="absolute bottom-0 left-0 right-0 min-w-0 p-5 text-white sm:p-7">
              <h1 className="break-words text-3xl font-semibold tracking-tight sm:text-4xl">
                {business.name}
              </h1>

              <div className="mt-3 flex min-w-0 flex-wrap gap-3 text-sm text-white/80">
                {business.location && (
                  <span className="inline-flex min-w-0 items-center gap-1">
                    <MapPin className="h-4 w-4 shrink-0" />
                    <span className="truncate">{business.location}</span>
                  </span>
                )}

                {business.department && (
                  <span className="rounded-full bg-white/15 px-3 py-1 capitalize">
                    {business.department}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex min-w-0 flex-col justify-between gap-5 p-5 sm:p-7">
            <div className="min-w-0">
              <p className="break-words text-sm leading-6 text-gray-600">
                {business.description ||
                  "Choose a service, pick an available time, and confirm your booking in a few quick steps."}
              </p>

              <div className="mt-5 min-w-0 rounded-xl bg-[#FAF7EF] p-4">
                <p className="text-sm font-semibold text-gray-950">
                  Opening Hours
                </p>
                <p className="mt-1 break-words text-sm text-gray-600">
                  {business.workingHours?.days?.join(", ") || "Days not set"}
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  {business.workingHours?.open || "--"} -{" "}
                  {business.workingHours?.close || "--"}
                </p>
              </div>
            </div>

            <div className="min-w-0">
              <div className="grid min-w-0 grid-cols-3 gap-2">
                {[0, 1, 2].map((index) => {
                  const image = galleryImages[index];

                  return (
                    <div
                      key={index}
                      className="aspect-square min-w-0 overflow-hidden rounded-xl border border-[#D8D0BE] bg-[#FAF7EF]"
                    >
                      {image ? (
                        <img
                          src={image}
                          alt={`${business.name} gallery ${index + 1}`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center px-2 text-center text-xs font-medium text-gray-400">
                          Photo {index + 2}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {socialLinks.length > 0 && (
                <div className="mt-4 flex min-w-0 flex-wrap gap-2">
                  {socialLinks.map((link) => {
                    const Icon = link.icon;

                    return (
                      <a
                        key={link.label}
                        href={link.href}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex min-w-0 items-center gap-2 rounded-full border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 transition hover:bg-gray-50"
                      >
                        <Icon className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{link.label}</span>
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-6">
          <section className="min-w-0 rounded-2xl border border-[#D8D0BE] bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-semibold text-gray-950">
              Choose a Service
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Select the service you would like to book.
            </p>

            <div className="mt-4 grid min-w-0 gap-3 sm:grid-cols-2">
              {business.services?.map((service: any) => {
                const serviceName = getServiceName(service);
                const servicePrice = getServicePrice(service);
                const isSelected = selectedService === serviceName;

                return (
                  <button
                    key={serviceName}
                    type="button"
                    onClick={() => setSelectedService(serviceName)}
                    className={`min-w-0 rounded-xl border p-4 text-left transition ${
                      isSelected
                        ? "border-[#0F3D2E] bg-[#FAF7EF] ring-2 ring-[#0F3D2E]/15"
                        : "border-gray-200 bg-white hover:border-[#0F3D2E]"
                    }`}
                  >
                    <div className="flex min-w-0 items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-gray-950">
                          {serviceName}
                        </p>
                        <p className="mt-1 truncate text-sm font-medium text-[#0F3D2E]">
                          {formatPrice(servicePrice)}
                        </p>
                      </div>

                      {isSelected && (
                        <CheckCircle2 className="h-5 w-5 shrink-0 text-[#0F3D2E]" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="min-w-0 rounded-2xl border border-[#D8D0BE] bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-semibold text-gray-950">
              Select Date & Time
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Booked slots are disabled automatically.
            </p>

            <div className="mt-4 min-w-0 space-y-4">
              <div className="min-w-0">
                <label className="mb-2 block text-sm font-semibold">
                  Preferred Date
                </label>
                <input
                  type="date"
                  className={inputClass}
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value);
                    setTime("");
                  }}
                />
              </div>

              <div className="min-w-0">
                <div className="mb-2 flex min-w-0 items-center justify-between gap-3">
                  <label className="block text-sm font-semibold">
                    Available Times
                  </label>

                  {date && (
                    <span className="shrink-0 text-xs text-gray-500">
                      {availableSlots.length} available
                    </span>
                  )}
                </div>

                {!date ? (
                  <div className="rounded-xl border border-dashed border-[#D8D0BE] bg-[#FAF7EF] p-4 text-sm text-gray-500">
                    Select a date first to see available times.
                  </div>
                ) : timeSlots.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[#D8D0BE] bg-[#FAF7EF] p-4 text-sm text-gray-500">
                    No opening hours available.
                  </div>
                ) : (
                  <div className="grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-3">
                    {timeSlots.map((slot) => {
                      const isBooked = bookedTimes.includes(slot);
                      const isSelected = time === slot;

                      return (
                        <button
                          key={slot}
                          type="button"
                          disabled={isBooked}
                          onClick={() => setTime(slot)}
                          className={`min-w-0 rounded-xl border px-2 py-3 text-sm font-semibold transition sm:px-3 ${
                            isBooked
                              ? "cursor-not-allowed border-red-100 bg-red-50 text-red-400"
                              : isSelected
                              ? "border-[#0F3D2E] bg-[#0F3D2E] text-white"
                              : "border-gray-200 bg-white text-gray-700 hover:border-[#0F3D2E] hover:bg-[#FAF7EF]"
                          }`}
                        >
                          <span>{formatTimeLabel(slot)}</span>

                          {isBooked && (
                            <span className="block text-xs font-normal">
                              Booked
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="min-w-0 rounded-2xl border border-[#D8D0BE] bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-semibold text-gray-950">
              Your Details
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              We’ll use this information to confirm your booking.
            </p>

            <div className="mt-4 grid min-w-0 gap-3 sm:grid-cols-2">
              <div className="relative min-w-0">
                <User className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                <input
                  className={`${inputClass} pl-10`}
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="relative min-w-0">
                <Phone className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                <input
                  className={`${inputClass} pl-10`}
                  placeholder="Phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>
          </section>
        </div>

        <aside className="min-w-0 space-y-4 lg:sticky lg:top-6 lg:self-start">
          <div className="min-w-0 rounded-2xl border border-[#D8D0BE] bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-semibold text-gray-950">
              Booking Summary
            </h2>

            <div className="mt-4 space-y-4 text-sm">
              <div className="flex min-w-0 gap-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#0F3D2E]" />
                <div className="min-w-0">
                  <p className="font-medium text-gray-950">Service</p>
                  <p className="truncate text-gray-500">
                    {selectedService || "Not selected"}
                  </p>
                  {selectedServiceDetails && (
                    <p className="mt-1 truncate font-medium text-[#0F3D2E]">
                      {formatPrice(getServicePrice(selectedServiceDetails))}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex min-w-0 gap-3">
                <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-[#0F3D2E]" />
                <div className="min-w-0">
                  <p className="font-medium text-gray-950">Date</p>
                  <p className="truncate text-gray-500">
                    {date || "Not selected"}
                  </p>
                </div>
              </div>

              <div className="flex min-w-0 gap-3">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[#0F3D2E]" />
                <div className="min-w-0">
                  <p className="font-medium text-gray-950">Time</p>
                  <p className="truncate text-gray-500">
                    {time ? formatTimeLabel(time) : "Not selected"}
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {confirmed && (
              <div className="mt-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                Booking confirmed successfully.
              </div>
            )}

            <button
              type="button"
              onClick={handleSubmit}
              className="mt-5 w-full rounded-xl bg-[#0F3D2E] p-4 text-sm font-semibold text-white transition hover:bg-[#0c2f23]"
            >
              Confirm Booking
            </button>
          </div>
        </aside>
      </div>

      {statusOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-white">
            <button
              type="button"
              onClick={() => setStatusOpen(false)}
              className="absolute right-3 top-3 z-10 rounded-full bg-black/60 p-2 text-white"
              aria-label="Close status"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="relative h-[520px] bg-[#0F3D2E]">
              {mainImage ? (
                <img
                  src={mainImage}
                  alt={`${business.name} status`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center px-6 text-center text-white">
                  <h2 className="text-3xl font-semibold">{business.name}</h2>
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/35" />

              <div className="absolute left-4 right-4 top-4 h-1 overflow-hidden rounded-full bg-white/30">
                <div className="h-full w-full rounded-full bg-white" />
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                <p className="text-xs font-medium uppercase tracking-wide text-white/70">
                  Status
                </p>
                <h3 className="mt-1 text-2xl font-semibold">
                  {business.name}
                </h3>
                <p className="mt-2 text-sm text-white/75">
                  Available for 24 hours after you visit this business.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PublicBooking() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [businessDrawerOpen, setBusinessDrawerOpen] = useState(false);
  const [visitedBusinesses, setVisitedBusinesses] = useState<VisitedBusiness[]>(
    () => loadVisitedBusinesses()
  );

  const getBusinessBySlug = useBusinessStore((s) => s.getBusinessBySlug);
  const business = getBusinessBySlug(slug || "");

  useEffect(() => {
    if (!business) return;
    setVisitedBusinesses(saveVisitedBusiness(business));
  }, [business]);

  function openBusiness(businessSlug: string) {
    setBusinessDrawerOpen(false);
    navigate(`/b/${businessSlug}`);
  }

  if (!business) {
    return (
      <main className="min-h-screen overflow-x-hidden bg-[#FAF7EF] px-4 py-20">
        <div className="mx-auto max-w-md rounded-xl border border-[#D8D0BE] bg-white p-6 text-center shadow-sm sm:p-8">
          <h2 className="text-xl font-semibold text-gray-900">
            Business not found
          </h2>
          <p className="mt-2 text-sm leading-6 text-gray-500">
            This booking link is invalid or expired.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#FAF7EF] px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <button
        type="button"
        onClick={() => setBusinessDrawerOpen(true)}
        className="fixed right-4 top-4 z-40 inline-flex items-center gap-2 rounded-full bg-[#0F3D2E] px-4 py-3 text-sm font-semibold text-white shadow-lg lg:hidden"
      >
        <Menu className="h-4 w-4" />
        Businesses
      </button>

      {businessDrawerOpen && (
        <button
          type="button"
          aria-label="Close businesses drawer"
          onClick={() => setBusinessDrawerOpen(false)}
          className="fixed inset-0 z-40 bg-black/45 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 right-0 z-50 flex h-dvh w-80 max-w-[88vw] flex-col bg-white p-5 shadow-2xl transition-transform duration-300 lg:hidden ${
          businessDrawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-[#0F3D2E]">
              Saved
            </p>
            <h2 className="text-xl font-semibold text-gray-950">
              Businesses
            </h2>
          </div>

          <button
            type="button"
            onClick={() => setBusinessDrawerOpen(false)}
            className="rounded-xl bg-[#FAF7EF] p-2 text-[#0F3D2E]"
            aria-label="Close businesses"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {visitedBusinesses.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#D8D0BE] bg-[#FAF7EF] p-4 text-sm text-gray-500">
            Visited businesses will appear here.
          </div>
        ) : (
          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto">
            {visitedBusinesses.map((visitedBusiness) => {
              const isActive = visitedBusiness.slug === business.slug;

              return (
                <button
                  key={visitedBusiness.slug}
                  type="button"
                  onClick={() => openBusiness(visitedBusiness.slug)}
                  className={`w-full rounded-xl border p-4 text-left transition ${
                    isActive
                      ? "border-[#0F3D2E] bg-[#FAF7EF]"
                      : "border-gray-200 bg-white hover:bg-gray-50"
                  }`}
                >
                  <p className="truncate font-semibold text-gray-950">
                    {visitedBusiness.name}
                  </p>
                  {visitedBusiness.location && (
                    <p className="mt-1 truncate text-sm text-gray-500">
                      {visitedBusiness.location}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </aside>

      <BookingExperience business={business} />
    </main>
  );
}
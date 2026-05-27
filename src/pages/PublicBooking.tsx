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
import { supabase } from "../lib/supabase-client";

type Service = {
  name: string;
  price?: number;
};

type WorkingHours = {
  days: string[];
  open: string;
  close: string;
};

type SocialLinks = {
  instagram?: string;
  facebook?: string;
  website?: string;
};

type Business = {
  id: string;
  userId: string;
  name: string;
  owner: string;
  email: string;
  phone: string;
  location: string;
  description: string;
  slug: string;
  bookingLink: string;
  images: string[];
  department?: string;
  services: Service[];
  workingHours?: WorkingHours;
  socialLinks?: SocialLinks;
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

type VisitedBusiness = {
  slug: string;
  name: string;
  location?: string;
  visitedAt: number;
};

type BusinessRow = {
  id: string;
  user_id: string;
  name: string;
  owner: string;
  email: string;
  phone: string;
  location: string;
  description: string;
  slug: string;
  booking_link: string;
  images: string[] | null;
  department: string | null;
  services: Service[] | null;
  working_hours: WorkingHours | null;
  social_links: SocialLinks | null;
  is_setup_complete: boolean;
  status_text: string | null;
  status_created_at: string | null;
};

type BookingRow = {
  id: string;
  business_slug: string;
  service: string;
  name: string;
  phone: string;
  datetime: string;
};

const VISITED_BUSINESSES_KEY = "booka_visited_businesses";
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

// function getDateKey(date: Date) {
//   const year = date.getFullYear();
//   const month = String(date.getMonth() + 1).padStart(2, "0");
//   const day = String(date.getDate()).padStart(2, "0");

//   return `${year}-${month}-${day}`;
// }

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

function getServiceName(service: Service | string) {
  return typeof service === "string" ? service : service.name;
}

function getServicePrice(service: Service | string) {
  return typeof service === "string" ? undefined : service.price;
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
    description: row.description,
    slug: row.slug,
    bookingLink: row.booking_link,
    images: row.images || [],
    department: row.department || undefined,
    services: row.services || [],
    workingHours: row.working_hours || undefined,
    socialLinks: row.social_links || undefined,
    isSetupComplete: row.is_setup_complete,
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

// function isStatusActive(createdAt?: string) {
//   if (!createdAt) return false;

//   return Date.now() - new Date(createdAt).getTime() < STATUS_DURATION;
// }

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

function getSlugFromLink(value: string) {
  const trimmed = value.trim();

  if (!trimmed) return "";

  try {
    const url = new URL(trimmed);
    const parts = url.pathname.split("/").filter(Boolean);
    return parts[parts.length - 1] || "";
  } catch {
    const parts = trimmed.split("/").filter(Boolean);
    return parts[parts.length - 1] || trimmed;
  }
}

function BookingExperience({
  business,
  onBookingCreated,
}: {
  business: Business;
  bookings: Booking[];
  onBookingCreated: (booking: Booking) => void;
}) {
  const [selectedService, setSelectedService] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    const interval = window.setInterval(() => {
      setCurrentTime(Date.now());
    }, 60 * 1000);

    return () => window.clearInterval(interval);
  }, []);

  const businessImages = useMemo(() => {
    return (business.images || []).filter(Boolean).slice(0, 4);
  }, [business.images]);

  const mainImage = businessImages[0];
  const galleryImages = businessImages.slice(1, 4);

  const showStatus = Boolean(
    business.statusText &&
      business.statusCreatedAt &&
      currentTime - new Date(business.statusCreatedAt).getTime() <
        STATUS_DURATION
  );

  const selectedServiceDetails = useMemo(() => {
    return business.services?.find(
      (service) => getServiceName(service) === selectedService
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

  const [bookedTimes, setBookedTimes] = useState<string[]>([]);

useEffect(() => {
  async function loadBookedTimes() {
    if (!date) {
      setBookedTimes([]);
      return;
    }

    const { data, error } = await supabase.rpc("get_booked_times", {
      target_business_slug: business.slug,
      target_date: date,
    });

    if (error) {
      console.error(error);
      setBookedTimes([]);
      return;
    }

    setBookedTimes(
      (data || []).map((booking: { datetime: string }) => {
        const bookingDate = new Date(booking.datetime);

        return `${String(bookingDate.getHours()).padStart(2, "0")}:${String(
          bookingDate.getMinutes()
        ).padStart(2, "0")}`;
      })
    );
  }

  loadBookedTimes();
  setBookedTimes((prev) => [...prev, time]);
}, [business.slug, date]);

  const availableSlots = timeSlots.filter((slot) => !bookedTimes.includes(slot));

  const inputClass =
    "w-full min-w-0 rounded-xl border border-gray-200 bg-white px-4 py-3 text-base outline-none transition placeholder:text-gray-400 focus:border-[#0F3D2E] focus:ring-4 focus:ring-[#0F3D2E]/10 sm:text-sm";

  async function handleSubmit() {
    setError("");
    setConfirmed(false);

    if (!selectedService || !date || !time || !name || !phone) {
      setError("Please complete all fields before confirming your booking.");
      return;
    }

    if (bookedTimes.includes(time)) {
      setError("That time has just been booked. Please choose another slot.");
      return;
    }

    try {
      setIsSubmitting(true);

      const datetime = new Date(`${date}T${time}`).toISOString();

      const { data, error: bookingError } = await supabase
        .from("bookings")
        .insert({
          business_slug: business.slug,
          service: selectedService,
          name,
          phone,
          datetime,
        })
        .select("*")
        .single();

      if (bookingError || !data) {
        setError(bookingError?.message || "Could not confirm your booking.");
        return;
      }

      onBookingCreated(normalizeBooking(data as BookingRow));

      setConfirmed(true);
      setSelectedService("");
      setDate("");
      setTime("");
      setName("");
      setPhone("");
    } catch (submitError) {
      console.error(submitError);
      setError("Something went wrong while confirming your booking.");
    } finally {
      setIsSubmitting(false);
    }
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
                <h1 className="wrap-break-word text-4xl font-semibold text-[#FAF7EF]">
                  {business.name}
                </h1>
              </div>
            )}

            <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />

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
              <h1 className="wrap-break-word text-3xl font-semibold tracking-tight sm:text-4xl">
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
              <p className="wrap-break-word text-sm leading-6 text-gray-600">
                {business.description ||
                  "Choose a service, pick an available time, and confirm your booking in a few quick steps."}
              </p>

              <div className="mt-5 min-w-0 rounded-xl bg-[#FAF7EF] p-4">
                <p className="text-sm font-semibold text-gray-950">
                  Opening Hours
                </p>
                <p className="mt-1 wrap-break-word text-sm text-gray-600">
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
              {business.services?.map((service) => {
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
              We will use this information to confirm your booking.
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
              disabled={isSubmitting}
              className="mt-5 w-full rounded-xl bg-[#0F3D2E] p-4 text-sm font-semibold text-white transition hover:bg-[#0c2f23] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Confirming..." : "Confirm Booking"}
            </button>
          </div>
        </aside>
      </div>

      {statusOpen && showStatus && (
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

              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-black/35" />

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
                <p className="mt-3 break-words text-base leading-6 text-white">
                  {business.statusText}
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

  const [business, setBusiness] = useState<Business | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [businessDrawerOpen, setBusinessDrawerOpen] = useState(false);
  const [visitedBusinesses, setVisitedBusinesses] = useState<VisitedBusiness[]>(
    () => loadVisitedBusinesses()
  );
  const [searchLink, setSearchLink] = useState("");
  const [searchError, setSearchError] = useState("");

  useEffect(() => {
    async function loadPublicBusiness() {
      if (!slug) return;

      setIsLoading(true);

      const { data: businessData, error: businessError } = await supabase
        .from("businesses")
        .select("*")
        .eq("slug", slug)
        .eq("is_setup_complete", true)
        .single();

      if (businessError || !businessData) {
        setBusiness(null);
        setBookings([]);
        setIsLoading(false);
        return;
      }

      const normalizedBusiness = normalizeBusiness(businessData as BusinessRow);
      setBusiness(normalizedBusiness);
      setVisitedBusinesses(saveVisitedBusiness(normalizedBusiness));

      const { data: bookingData } = await supabase
        .from("bookings")
        .select("*")
        .eq("business_slug", slug)
        .order("datetime", { ascending: true });

      setBookings((bookingData || []).map((booking) => normalizeBooking(booking as BookingRow)));
      setIsLoading(false);
    }

    loadPublicBusiness();
  }, [slug]);

  function openBusiness(businessSlug: string) {
    setBusinessDrawerOpen(false);
    navigate(`/b/${businessSlug}`);
  }

  function handleSearch() {
    const businessSlug = getSlugFromLink(searchLink);

    if (!businessSlug) {
      setSearchError("Please paste a valid business link.");
      return;
    }

    setSearchError("");
    openBusiness(businessSlug);
  }

  function handleBookingCreated(booking: Booking) {
    setBookings((prev) => [...prev, booking]);
  }

  if (isLoading) {
    return (
      <main className="min-h-screen overflow-x-hidden bg-[#FAF7EF] px-4 py-20">
        <div className="mx-auto max-w-md rounded-xl border border-[#D8D0BE] bg-white p-6 text-center shadow-sm sm:p-8">
          <h2 className="text-xl font-semibold text-gray-900">
            Loading business
          </h2>
          <p className="mt-2 text-sm leading-6 text-gray-500">
            Preparing the booking page.
          </p>
        </div>
      </main>
    );
  }

  if (!business) {
    return (
      <main className="min-h-screen overflow-x-hidden bg-[#FAF7EF] px-4 py-20">
        <div className="mx-auto max-w-md rounded-xl border border-[#D8D0BE] bg-white p-6 text-center shadow-sm sm:p-8">
          <h2 className="text-xl font-semibold text-gray-900">
            Business not found
          </h2>
          <p className="mt-2 text-sm leading-6 text-gray-500">
            This booking link is invalid, expired, or the business has not
            completed setup.
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
        className={`fixed inset-y-0 right-0 z-50 flex h-dvh w-80 max-w-[88vw] flex-col bg-[#0F3D2E] p-5 shadow-2xl transition-transform duration-300 lg:hidden ${
          businessDrawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-white">
              Saved
            </p>
            <h2 className="text-xl font-semibold text-white">Businesses</h2>
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

        <div className="mb-4">
          <input
            type="text"
            value={searchLink}
            onChange={(e) => {
              setSearchLink(e.target.value);
              setSearchError("");
            }}
            placeholder="Paste business link"
            className="w-full min-w-0 rounded-xl border border-gray-200 bg-white px-4 py-3 text-base outline-none transition placeholder:text-gray-400 focus:border-[#0F3D2E] focus:ring-4 focus:ring-[#0F3D2E]/10 sm:text-sm"
          />

          <button
            type="button"
            onClick={handleSearch}
            className="mt-2 w-full rounded-xl bg-[#FAF7EF] p-2 text-sm font-semibold text-[#0F3D2E] transition hover:bg-white"
          >
            Open Business
          </button>

          {searchError && (
            <p className="mt-2 text-sm text-red-100">{searchError}</p>
          )}
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

      <BookingExperience
        business={business}
        bookings={bookings}
        onBookingCreated={handleBookingCreated}
      />
    </main>
  );
}
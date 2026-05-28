import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Bell,
  CalendarDays,
  Check,
  Clipboard,
  ExternalLink,
  ImagePlus,
  MapPin,
  Plus,
  Settings,
  Share2,
  Trash2,
  Wallet,
  X,
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

type Notification = {
  id: string;
  title: string;
  message: string;
  createdAt: number;
  read?: boolean;
};

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const TIMES = [
  "05:00",
  "06:00",
  "07:00",
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
  "21:00",
  "22:00",
  "23:00",
  "23:59",
];

const NOTIFICATIONS_STORAGE_PREFIX = "booka_dashboard_notifications";

function getNotificationsStorageKey(businessSlug?: string) {
  return `${NOTIFICATIONS_STORAGE_PREFIX}:${businessSlug || "unknown"}`;
}

function loadPersistedNotifications(businessSlug?: string): Notification[] {
  try {
    const data = localStorage.getItem(getNotificationsStorageKey(businessSlug));
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function savePersistedNotifications(
  businessSlug: string | undefined,
  notifications: Notification[]
) {
  localStorage.setItem(
    getNotificationsStorageKey(businessSlug),
    JSON.stringify(notifications.slice(0, 50))
  );
}

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

function getMonthKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");

  return `${year}-${month}`;
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

function getServiceRevenue(bookingService: string, services: Service[]) {
  return services.reduce((total, service) => {
    return bookingService.includes(service.name)
      ? total + (service.price || 0)
      : total;
  }, 0);
}

function compressImage(file: File, maxWidth = 1200, quality = 0.75) {
  return new Promise<File>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement("canvas");
        const scale = Math.min(1, maxWidth / img.width);

        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);

        const ctx = canvas.getContext("2d");

        if (!ctx) {
          reject(new Error("Could not prepare image."));
          return;
        }

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Could not compress image."));
              return;
            }

            resolve(
              new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), {
                type: "image/jpeg",
              })
            );
          },
          "image/jpeg",
          quality
        );
      };

      img.onerror = () => reject(new Error("Could not load image."));
      img.src = reader.result as string;
    };

    reader.onerror = () => reject(new Error("Could not read image."));
    reader.readAsDataURL(file);
  });
}

async function uploadBusinessImage(
  file: File,
  businessId: string,
  imageIndex: number
) {
  const path = `${businessId}/${Date.now()}-${imageIndex}-${crypto.randomUUID()}.jpg`;

  const { error } = await supabase.storage
    .from("business-images")
    .upload(path, file, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: true,
    });

  if (error) throw error;

  const { data } = supabase.storage.from("business-images").getPublicUrl(path);

  return data.publicUrl;
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
  const [isPostingStatus, setIsPostingStatus] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsError, setSettingsError] = useState("");
  const [settingsSuccess, setSettingsSuccess] = useState("");
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsImages, setSettingsImages] = useState<string[]>([
    "",
    "",
    "",
    "",
  ]);
  const [settingsImageFiles, setSettingsImageFiles] = useState<
    Array<File | null>
  >([null, null, null, null]);
  const [settingsServices, setSettingsServices] = useState<Service[]>([]);
  const [newServiceName, setNewServiceName] = useState("");
  const [newServicePrice, setNewServicePrice] = useState("");
  const [settingsDays, setSettingsDays] = useState<string[]>([]);
  const [settingsOpenTime, setSettingsOpenTime] = useState("09:00");
  const [settingsCloseTime, setSettingsCloseTime] = useState("17:00");

  const inputClass =
    "w-full min-w-0 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-gray-400 focus:border-[#0F3D2E] focus:ring-4 focus:ring-[#0F3D2E]/10";

  function addNotification(booking: Booking) {
  const nextNotification = {
    id: booking.id,
    title: "New booking",
    message: `${booking.name} booked ${booking.service}`,
    createdAt: Date.now(),
    read: false,
  };

  setNotifications((prev) => {
    const next = [
      nextNotification,
      ...prev.filter((notification) => notification.id !== booking.id),
    ].slice(0, 50);

    savePersistedNotifications(business?.slug || slug, next);
    return next;
  });
}

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

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
      setNotifications(loadPersistedNotifications(mappedBusiness.slug));
      setStatusText(mappedBusiness.statusText || "");

      setSettingsImages([
        mappedBusiness.images[0] || "",
        mappedBusiness.images[1] || "",
        mappedBusiness.images[2] || "",
        mappedBusiness.images[3] || "",
      ]);
      setSettingsServices(mappedBusiness.services || []);
      setSettingsDays(mappedBusiness.workingHours?.days || []);
      setSettingsOpenTime(mappedBusiness.workingHours?.open || "09:00");
      setSettingsCloseTime(mappedBusiness.workingHours?.close || "17:00");

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

      channel = supabase
        .channel(`bookings:${slug}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "bookings",
            filter: `business_slug=eq.${slug}`,
          },
          (payload) => {
            const booking = payload.new as BookingRow;

            setBookings((prev) => {
              const alreadyExists = prev.some((item) => item.id === booking.id);

              if (alreadyExists) return prev;

              const normalizedBooking = normalizeBooking(booking);
              addNotification(normalizedBooking);

              return [...prev, normalizedBooking];
            });
          }
        )
        .subscribe();

      setIsLoading(false);
    }

    loadDashboard();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [slug, navigate]);

  function openSettings() {
    if (!business) return;

    setSettingsError("");
    setSettingsSuccess("");
    setSettingsImages([
      business.images[0] || "",
      business.images[1] || "",
      business.images[2] || "",
      business.images[3] || "",
    ]);
    setSettingsImageFiles([null, null, null, null]);
    setSettingsServices(business.services || []);
    setSettingsDays(business.workingHours?.days || []);
    setSettingsOpenTime(business.workingHours?.open || "09:00");
    setSettingsCloseTime(business.workingHours?.close || "17:00");
    setSettingsOpen(true);
  }

  async function updateStatus() {
    if (!business) return;

    setStatusError("");

    const trimmed = statusText.trim();

    if (!trimmed) {
      setStatusError("Enter a short status update first.");
      return;
    }

    try {
      setIsPostingStatus(true);

      const createdAt = new Date().toISOString();

      const { data, error } = await supabase
        .from("businesses")
        .update({
          status_text: trimmed,
          status_created_at: createdAt,
        })
        .eq("id", business.id)
        .eq("user_id", business.userId)
        .select("status_text, status_created_at")
        .single();

      if (error) {
        setStatusError(error.message);
        return;
      }

      setBusiness({
        ...business,
        statusText: data?.status_text || trimmed,
        statusCreatedAt: data?.status_created_at || createdAt,
      });

      setStatusText(data?.status_text || trimmed);
    } catch (error) {
      console.error(error);
      setStatusError("Could not post status. Please try again.");
    } finally {
      setIsPostingStatus(false);
    }
  }

  function toggleSettingsDay(day: string) {
    setSettingsDays((prev) =>
      prev.includes(day) ? prev.filter((item) => item !== day) : [...prev, day]
    );
  }

  function updateService(index: number, field: keyof Service, value: string) {
    setSettingsServices((prev) => {
      const next = [...prev];
      const current = next[index];

      next[index] = {
        ...current,
        [field]: field === "price" ? Number(value) : value,
      };

      return next;
    });
  }

  function deleteService(index: number) {
    setSettingsServices((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  }

  function addService() {
    setSettingsError("");

    const name = newServiceName.trim();
    const price = Number(newServicePrice);

    if (!name) {
      setSettingsError("Enter a service name.");
      return;
    }

    if (Number.isNaN(price) || price <= 0) {
      setSettingsError("Enter a valid service price.");
      return;
    }

    const alreadyExists = settingsServices.some(
      (service) => service.name.toLowerCase() === name.toLowerCase()
    );

    if (alreadyExists) {
      setSettingsError("That service already exists.");
      return;
    }

    setSettingsServices((prev) => [...prev, { name, price }]);
    setNewServiceName("");
    setNewServicePrice("");
  }

  async function handleSettingsImageUpload(
    e: ChangeEvent<HTMLInputElement>,
    imageIndex: number
  ) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressedFile = await compressImage(file);
      const previewUrl = URL.createObjectURL(compressedFile);

      setSettingsImages((prev) => {
        const next = [...prev];
        next[imageIndex] = previewUrl;
        return next.slice(0, 4);
      });

      setSettingsImageFiles((prev) => {
        const next = [...prev];
        next[imageIndex] = compressedFile;
        return next.slice(0, 4);
      });
    } catch (error) {
      console.error(error);
      setSettingsError("Could not prepare image. Please try another photo.");
    }
  }

  function removeSettingsImage(imageIndex: number) {
    setSettingsImages((prev) => {
      const next = [...prev];
      next[imageIndex] = "";
      return next;
    });

    setSettingsImageFiles((prev) => {
      const next = [...prev];
      next[imageIndex] = null;
      return next;
    });
  }

  async function saveSettings() {
    if (!business) return;

    setSettingsError("");
    setSettingsSuccess("");

    const cleanedServices = settingsServices
      .map((service) => ({
        name: service.name.trim(),
        price: Number(service.price),
      }))
      .filter((service) => service.name);

    if (!settingsDays.length) {
      setSettingsError("Choose at least one working day.");
      return;
    }

    if (timeToMinutes(settingsCloseTime) <= timeToMinutes(settingsOpenTime)) {
      setSettingsError("Closing time must be later than opening time.");
      return;
    }

    if (!cleanedServices.length) {
      setSettingsError("Add at least one service.");
      return;
    }

    const invalidService = cleanedServices.some(
      (service) => Number.isNaN(service.price) || service.price <= 0
    );

    if (invalidService) {
      setSettingsError("Every service needs a valid price.");
      return;
    }

    try {
      setIsSavingSettings(true);

      const finalImages = await Promise.all(
        settingsImages.map(async (image, index) => {
          const file = settingsImageFiles[index];

          if (!image) return "";
          if (!file) return image;

          return uploadBusinessImage(file, business.id, index);
        })
      );

      const workingHours = {
        days: settingsDays,
        open: settingsOpenTime,
        close: settingsCloseTime,
      };

      const { data, error } = await supabase
        .from("businesses")
        .update({
          images: finalImages.filter(Boolean),
          services: cleanedServices,
          working_hours: workingHours,
        })
        .eq("id", business.id)
        .eq("user_id", business.userId)
        .select("*")
        .single();

      if (error || !data) {
        setSettingsError(error?.message || "Could not save settings.");
        return;
      }

      const updatedBusiness = normalizeBusiness(data as BusinessRow);

      setBusiness(updatedBusiness);
      setSettingsImages([
        updatedBusiness.images[0] || "",
        updatedBusiness.images[1] || "",
        updatedBusiness.images[2] || "",
        updatedBusiness.images[3] || "",
      ]);
      setSettingsImageFiles([null, null, null, null]);
      setSettingsServices(updatedBusiness.services || []);
      setSettingsDays(updatedBusiness.workingHours?.days || []);
      setSettingsOpenTime(updatedBusiness.workingHours?.open || "09:00");
      setSettingsCloseTime(updatedBusiness.workingHours?.close || "17:00");
      setSettingsSuccess("Settings saved.");
    } catch (error) {
      console.error(error);
      setSettingsError("Could not save settings. Please try again.");
    } finally {
      setIsSavingSettings(false);
    }
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

  const monthlyRevenue = useMemo(() => {
    if (!business?.services?.length) return 0;

    const currentMonth = getMonthKey(new Date());

    return businessBookings
      .filter(
        (booking) => getMonthKey(new Date(booking.datetime)) === currentMonth
      )
      .reduce((total, booking) => {
        return total + getServiceRevenue(booking.service, business.services);
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

  const unreadNotifications = notifications.filter(
    (notification) => !notification.read
  ).length;

  function toggleNotifications() {
    const nextOpen = !notificationsOpen;
    setNotificationsOpen(nextOpen);

    if (nextOpen) {
      setNotifications((prev) => {
        const next = prev.map((notification) => ({
          ...notification,
          read: true,
        }));

        savePersistedNotifications(business?.slug || slug, next);
        return next;
      });
    }
  }

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

          <div className="absolute right-4 top-4 z-20 flex items-center gap-2">
            <button
              type="button"
              onClick={toggleNotifications}
              aria-label="Notifications"
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#FAF7EF] text-[#0F3D2E] shadow-sm transition hover:bg-white"
            >
              <Bell className="h-4 w-4" />
              {unreadNotifications > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {unreadNotifications}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={openSettings}
              aria-label="Settings"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#FAF7EF] text-[#0F3D2E] shadow-sm transition hover:bg-white"
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>

          <div className="relative flex min-h-64 flex-col justify-between p-5 text-white sm:p-8">
            <div className="min-w-0 pr-24">
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
                <p className="break-words text-sm leading-6 text-white/75 sm:text-base">
                  {business.description}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white p-5 sm:p-6">
          <div className="min-w-0 rounded-xl bg-[#FAF7EF] p-4">
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
      </section>

      {notificationsOpen && (
        <>
          <button
            type="button"
            aria-label="Close notifications"
            onClick={() => setNotificationsOpen(false)}
            className="fixed inset-0 z-40 bg-black/35"
          />

          <aside className="fixed inset-y-0 right-0 z-50 flex h-dvh w-[70vw] min-w-[320px] max-w-[720px] flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#EFE7D6] p-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Live updates
                </p>
                <h2 className="mt-1 text-xl font-semibold text-gray-950">
                  Notifications
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setNotificationsOpen(false)}
                className="rounded-xl bg-[#FAF7EF] p-2 text-[#0F3D2E] transition hover:bg-[#EFE7D6]"
                aria-label="Close notifications"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              {notifications.length ? (
                <div className="space-y-3">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="rounded-2xl border border-[#D8D0BE] bg-[#FAF7EF] p-4"
                    >
                      <p className="text-sm font-semibold text-gray-950">
                        {notification.title}
                      </p>
                      <p className="mt-1 text-sm leading-5 text-gray-600">
                        {notification.message}
                      </p>
                      <p className="mt-3 text-xs text-gray-400">
                        {formatTime(
                          new Date(notification.createdAt).toISOString()
                        )}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-[#D8D0BE] bg-[#FAF7EF] p-5 text-sm leading-6 text-gray-500">
                  New bookings will appear here while this dashboard is open.
                </div>
              )}
            </div>
          </aside>
        </>
      )}

      {settingsOpen && (
        <>
          <button
            type="button"
            aria-label="Close settings"
            onClick={() => setSettingsOpen(false)}
            className="fixed inset-0 z-40 bg-black/35"
          />

          <aside className="fixed inset-y-0 right-0 z-50 flex h-dvh w-[70vw] min-w-[320px] max-w-[760px] flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#EFE7D6] p-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Business controls
                </p>
                <h2 className="mt-1 text-xl font-semibold text-gray-950">
                  Settings
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setSettingsOpen(false)}
                className="rounded-xl bg-[#FAF7EF] p-2 text-[#0F3D2E] transition hover:bg-[#EFE7D6]"
                aria-label="Close settings"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              <div className="space-y-6">
                {settingsError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {settingsError}
                  </div>
                )}

                <section>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-950">
                        Business photos
                      </h3>
                      <p className="mt-1 text-xs text-gray-500">
                        First photo is the profile cover.
                      </p>
                    </div>

                    <span className="rounded-full bg-[#FAF7EF] px-3 py-1 text-xs font-semibold text-[#0F3D2E]">
                      {settingsImages.filter(Boolean).length}/4
                    </span>
                  </div>

                  <div className="grid gap-3">
                    <div>
                      {settingsImages[0] ? (
                        <div className="relative h-44 overflow-hidden rounded-2xl border border-[#D8D0BE] bg-[#FAF7EF]">
                          <img
                            src={settingsImages[0]}
                            alt="Business profile"
                            className="h-full w-full object-cover"
                          />

                          <button
                            type="button"
                            onClick={() => removeSettingsImage(0)}
                            className="absolute right-3 top-3 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-red-600 shadow-sm"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <label className="flex h-44 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#D8D0BE] bg-[#FAF7EF] text-center transition hover:border-[#0F3D2E]">
                          <ImagePlus className="mb-2 h-6 w-6 text-[#0F3D2E]" />
                          <span className="text-sm font-semibold text-gray-800">
                            Upload profile picture
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleSettingsImageUpload(e, 0)}
                          />
                        </label>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {[1, 2, 3].map((imageIndex) => (
                        <div key={imageIndex}>
                          {settingsImages[imageIndex] ? (
                            <div className="relative aspect-square overflow-hidden rounded-xl border border-[#D8D0BE] bg-[#FAF7EF]">
                              <img
                                src={settingsImages[imageIndex]}
                                alt={`Business image ${imageIndex + 1}`}
                                className="h-full w-full object-cover"
                              />

                              <button
                                type="button"
                                onClick={() =>
                                  removeSettingsImage(imageIndex)
                                }
                                className="absolute right-2 top-2 rounded-lg bg-white px-2 py-1 text-[11px] font-semibold text-red-600 shadow-sm"
                              >
                                Remove
                              </button>
                            </div>
                          ) : (
                            <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#D8D0BE] bg-[#FAF7EF] text-center transition hover:border-[#0F3D2E]">
                              <ImagePlus className="mb-1 h-5 w-5 text-[#0F3D2E]" />
                              <span className="text-xs font-semibold text-gray-700">
                                Photo {imageIndex + 1}
                              </span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) =>
                                  handleSettingsImageUpload(e, imageIndex)
                                }
                              />
                            </label>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-sm font-semibold text-gray-950">
                    Opening days
                  </h3>

                  <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {DAYS.map((day) => {
                      const selected = settingsDays.includes(day);

                      return (
                        <button
                          type="button"
                          key={day}
                          onClick={() => toggleSettingsDay(day)}
                          className={`rounded-full border px-3 py-2 text-sm font-medium transition ${
                            selected
                              ? "border-[#0F3D2E] bg-[#0F3D2E] text-white"
                              : "border-gray-200 bg-white text-gray-700 hover:border-[#0F3D2E]"
                          }`}
                        >
                          {day.slice(0, 3)}
                        </button>
                      );
                    })}
                  </div>
                </section>

                <section className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold">
                      Opening time
                    </label>
                    <select
                      value={settingsOpenTime}
                      onChange={(e) => setSettingsOpenTime(e.target.value)}
                      className={inputClass}
                    >
                      {TIMES.map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold">
                      Closing time
                    </label>
                    <select
                      value={settingsCloseTime}
                      onChange={(e) => setSettingsCloseTime(e.target.value)}
                      className={inputClass}
                    >
                      {TIMES.map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                  </div>
                </section>

                <section>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-950">
                        Services offered
                      </h3>
                      <p className="mt-1 text-xs text-gray-500">
                        Edit, delete, or add services and prices.
                      </p>
                    </div>

                    <span className="rounded-full bg-[#FAF7EF] px-3 py-1 text-xs font-semibold text-[#0F3D2E]">
                      {settingsServices.length}
                    </span>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_140px_auto]">
                    <input
                      value={newServiceName}
                      onChange={(e) => setNewServiceName(e.target.value)}
                      placeholder="Service name"
                      className={inputClass}
                    />

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={newServicePrice}
                      onChange={(e) => setNewServicePrice(e.target.value)}
                      placeholder="Price"
                      className={inputClass}
                    />

                    <button
                      type="button"
                      onClick={addService}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0F3D2E] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0c2f23]"
                    >
                      <Plus className="h-4 w-4" />
                      Add
                    </button>
                  </div>

                  {settingsServices.length ? (
                    <div className="mt-3 max-h-80 overflow-y-auto rounded-2xl border border-[#D8D0BE] bg-[#FAF7EF] p-2">
                      <div className="space-y-2">
                        {settingsServices.map((service, index) => (
                            <div
                              key={`${service.name}-${index}`}
                              className="grid grid-cols-[minmax(0,1fr)_110px_44px] items-center gap-2 rounded-xl bg-white p-3"
                            >
                              <input
                                value={service.name}
                                onChange={(e) => updateService(index, "name", e.target.value)}
                                className={inputClass}
                              />

                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={service.price}
                                onChange={(e) => updateService(index, "price", e.target.value)}
                                className={inputClass}
                              />

                              <button
                                type="button"
                                onClick={() => deleteService(index)}
                                className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-red-100 text-red-600 transition hover:bg-red-50"
                                aria-label={`Delete ${service.name}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-gray-500">
                      No services added yet.
                    </p>
                  )}
                </section>

                <div className="border-t border-[#EFE7D6] p-5">
                    {settingsSuccess && (
                      <div className="mb-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                        {settingsSuccess}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={saveSettings}
                      disabled={isSavingSettings}
                      className="w-full rounded-xl bg-[#0F3D2E] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0c2f23] disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {isSavingSettings ? "Saving..." : "Save Settings"}
                    </button>
                  </div>
              </div>
            </div>

            {/* <div className="border-t border-[#EFE7D6] p-5">
              <button
                type="button"
                onClick={saveSettings}
                disabled={isSavingSettings}
                className="w-full rounded-xl bg-[#0F3D2E] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0c2f23] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSavingSettings ? "Saving..." : "Save Settings"}
              </button>
            </div> */}
          </aside>
        </>
      )}

      <section className="grid min-w-0 grid-cols-2 gap-4">
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

        <div className="col-span-2 min-w-0 rounded-2xl border border-[#D8D0BE] bg-white p-5 shadow-sm">
          <p className="flex items-center gap-2 text-sm text-gray-500">
            <Wallet className="h-4 w-4 shrink-0 text-[#0F3D2E]" />
            Monthly Estimated Revenue
          </p>
          <p className="mt-3 truncate text-2xl font-semibold text-gray-950">
            {formatPrice(monthlyRevenue)}
          </p>
        </div>
      </section>

      <section className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-6">
          <div className="min-w-0 rounded-2xl border border-[#D8D0BE] bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-4 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-950">
                  Services Offered
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Compact service catalog for quick review.
                </p>
              </div>

              <span className="w-fit shrink-0 rounded-full bg-[#FAF7EF] px-3 py-1 text-xs font-semibold text-[#0F3D2E]">
                {business.services?.length || 0} services
              </span>
            </div>

            {business.services?.length ? (
              <div className="max-h-72 overflow-y-auto rounded-2xl border border-[#D8D0BE] bg-[#FAF7EF] p-2">
                <div className="divide-y divide-[#E8DEC9] rounded-xl bg-white">
                  {business.services
                    .slice()
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((service: Service) => (
                      <div
                        key={service.name}
                        className="flex min-w-0 items-center justify-between gap-3 px-4 py-3"
                      >
                        <p className="truncate text-sm font-semibold text-gray-950">
                          {service.name}
                        </p>
                        <p className="shrink-0 text-sm font-medium text-[#0F3D2E]">
                          {formatPrice(service.price)}
                        </p>
                      </div>
                    ))}
                </div>
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
              Status Update
            </h2>

            <textarea
              value={statusText}
              onChange={(e) => {
                setStatusText(e.target.value);
                setStatusError("");
              }}
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
              disabled={isPostingStatus}
              className="mt-3 w-full rounded-xl bg-[#0F3D2E] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0c2f23] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isPostingStatus ? "Posting..." : "Post Status"}
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
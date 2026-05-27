import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Clock,
  Globe,
  ImagePlus,
  MapPin,
  MessageCircle,
  Plus,
  Share2,
  Trash2,
  User,
} from "lucide-react";
import { supabase } from "../lib/supabase-client";

type Service = {
  name: string;
  price: number;
};

type Business = {
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
  working_hours: {
    days: string[];
    open: string;
    close: string;
  } | null;
  social_links: {
    instagram?: string;
    facebook?: string;
    website?: string;
  } | null;
  is_setup_complete: boolean;
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

function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function formatPrice(price: number) {
  return `KES ${price.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function formatOptionalUrl(value: string) {
  const trimmed = value.trim();

  if (!trimmed) return "";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  return `https://${trimmed}`;
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

export default function BusinessSetup() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [business, setBusiness] = useState<Business | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [images, setImages] = useState<string[]>(["", "", "", ""]);
  const [imageFiles, setImageFiles] = useState<Array<File | null>>([
    null,
    null,
    null,
    null,
  ]);
  const [department, setDepartment] = useState("");
  const [serviceInput, setServiceInput] = useState("");
  const [servicePriceInput, setServicePriceInput] = useState("");
  const [services, setServices] = useState<Service[]>([]);
  const [workingDays, setWorkingDays] = useState<string[]>([]);
  const [openTime, setOpenTime] = useState("09:00");
  const [closeTime, setCloseTime] = useState("17:00");
  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");
  const [website, setWebsite] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadBusiness() {
      setIsLoading(true);
      setError("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate("/");
        return;
      }

      const { data, error: businessError } = await supabase
        .from("businesses")
        .select("*")
        .eq("slug", slug)
        .eq("user_id", user.id)
        .single();

      if (businessError || !data) {
        setBusiness(null);
        setIsLoading(false);
        return;
      }

      const loadedBusiness = data as Business;
      const loadedImages = loadedBusiness.images || [];
      const loadedServices = loadedBusiness.services || [];
      const loadedHours = loadedBusiness.working_hours;
      const loadedSocialLinks = loadedBusiness.social_links || {};

      setBusiness(loadedBusiness);
      setImages([
        loadedImages[0] || "",
        loadedImages[1] || "",
        loadedImages[2] || "",
        loadedImages[3] || "",
      ]);
      setDepartment(loadedBusiness.department || "");
      setServices(loadedServices);
      setWorkingDays(loadedHours?.days || []);
      setOpenTime(loadedHours?.open || "09:00");
      setCloseTime(loadedHours?.close || "17:00");
      setInstagram(loadedSocialLinks.instagram || "");
      setFacebook(loadedSocialLinks.facebook || "");
      setWebsite(loadedSocialLinks.website || "");
      setIsLoading(false);
    }

    loadBusiness();
  }, [slug, navigate]);

  const uploadedImageCount = images.filter(Boolean).length;

  const setupProgress = useMemo(() => {
    const completed = [
      uploadedImageCount > 0,
      Boolean(department),
      services.length > 0,
      workingDays.length > 0,
      Boolean(openTime && closeTime),
    ].filter(Boolean).length;

    return Math.round((completed / 5) * 100);
  }, [
    uploadedImageCount,
    department,
    services.length,
    workingDays.length,
    openTime,
    closeTime,
  ]);

  const averagePrice = useMemo(() => {
    if (!services.length) return 0;

    const total = services.reduce((sum, service) => sum + service.price, 0);
    return total / services.length;
  }, [services]);

  const socialCount = [instagram, facebook, website].filter((link) =>
    Boolean(link.trim())
  ).length;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!business || !slug) {
      setError("Business not found.");
      return;
    }

    if (!department) {
      setError("Please select a department.");
      return;
    }

    if (services.length === 0) {
      setError("Please add at least one service.");
      return;
    }

    if (workingDays.length === 0) {
      setError("Please choose your working days.");
      return;
    }

    if (timeToMinutes(closeTime) <= timeToMinutes(openTime)) {
      setError("Closing time must be later than opening time.");
      return;
    }

    try {
      setIsSaving(true);

      const finalImages = await Promise.all(
        images.map(async (image, index) => {
          const file = imageFiles[index];

          if (!image) return "";
          if (!file) return image;

          return uploadBusinessImage(file, business.id, index);
        })
      );

      const { error: updateError } = await supabase
        .from("businesses")
        .update({
          department,
          services,
          working_hours: {
            days: workingDays,
            open: openTime,
            close: closeTime,
          },
          social_links: {
            instagram: formatOptionalUrl(instagram),
            facebook: formatOptionalUrl(facebook),
            website: formatOptionalUrl(website),
          },
          images: finalImages.filter(Boolean),
          is_setup_complete: true,
        })
        .eq("id", business.id)
        .eq("user_id", business.user_id);

      if (updateError) {
        setError(updateError.message);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      navigate(`/dashboard/${slug}`);
    } catch (uploadError: any) {
      console.error(uploadError);
      setError(
        uploadError?.message || "Something went wrong while saving your setup."
      );
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleImageUpload(
    e: ChangeEvent<HTMLInputElement>,
    imageIndex: number
  ) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressedFile = await compressImage(file);
      const previewUrl = URL.createObjectURL(compressedFile);

      setImages((prev) => {
        const next = [...prev];
        next[imageIndex] = previewUrl;
        return next.slice(0, 4);
      });

      setImageFiles((prev) => {
        const next = [...prev];
        next[imageIndex] = compressedFile;
        return next.slice(0, 4);
      });
    } catch (imageError) {
      console.error(imageError);
      setError("Could not upload image. Please try another photo.");
    }
  }

  function removeImage(imageIndex: number) {
    setImages((prev) => {
      const next = [...prev];
      next[imageIndex] = "";
      return next;
    });

    setImageFiles((prev) => {
      const next = [...prev];
      next[imageIndex] = null;
      return next;
    });
  }

  function addService() {
    setError("");

    const name = serviceInput.trim();
    const price = Number(servicePriceInput);

    if (!name) {
      setError("Enter a service name.");
      return;
    }

    if (Number.isNaN(price) || price <= 0) {
      setError("Enter a valid service price.");
      return;
    }

    const alreadyExists = services.some(
      (service) => service.name.toLowerCase() === name.toLowerCase()
    );

    if (alreadyExists) {
      setError("That service has already been added.");
      return;
    }

    setServices((prev) => [...prev, { name, price }]);
    setServiceInput("");
    setServicePriceInput("");
  }

  function removeService(serviceName: string) {
    setServices((prev) =>
      prev.filter((service) => service.name !== serviceName)
    );
  }

  function toggleDay(day: string) {
    setWorkingDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  function selectWeekdays() {
    setWorkingDays(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]);
  }

  function selectEveryday() {
    setWorkingDays(DAYS);
  }

  const inputClass =
    "w-full min-w-0 rounded-xl border border-gray-200 bg-white px-4 py-3 text-base outline-none transition placeholder:text-gray-400 focus:border-[#0F3D2E] focus:ring-4 focus:ring-[#0F3D2E]/10 sm:text-sm";

  if (isLoading) {
    return (
      <main className="min-h-screen overflow-x-hidden bg-[#FAF7EF] px-4 py-16">
        <div className="mx-auto max-w-md rounded-2xl border border-[#D8D0BE] bg-white p-6 text-center shadow-sm sm:p-8">
          <h1 className="text-xl font-semibold text-gray-950">
            Loading setup
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Preparing your business profile.
          </p>
        </div>
      </main>
    );
  }

  if (!business) {
    return (
      <main className="min-h-screen overflow-x-hidden bg-[#FAF7EF] px-4 py-16">
        <div className="mx-auto max-w-md rounded-2xl border border-[#D8D0BE] bg-white p-6 text-center shadow-sm sm:p-8">
          <h1 className="text-xl font-semibold text-gray-950">
            Business not found
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            This setup link is invalid or expired.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#FAF7EF] px-0 py-0 text-gray-900 sm:px-6 sm:py-6 lg:px-8">
      <div className="mx-auto min-w-0 max-w-6xl">
        <section className="bg-white p-5 shadow-sm sm:rounded-2xl sm:border sm:border-[#D8D0BE] sm:p-6">
          <div className="flex min-w-0 flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-medium text-[#0F3D2E]">
                Business setup
              </p>

              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-gray-950 sm:text-3xl">
                Welcome, {business.name}
              </h1>

              <div className="mt-3 flex min-w-0 flex-wrap gap-2 text-sm text-gray-600">
                <span className="inline-flex max-w-full items-center gap-1 rounded-full bg-[#FAF7EF] px-3 py-1">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{business.location}</span>
                </span>

                <span className="inline-flex max-w-full items-center gap-1 rounded-full bg-[#FAF7EF] px-3 py-1">
                  <User className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{business.owner}</span>
                </span>
              </div>
            </div>

            <div className="w-full min-w-0 md:max-w-xs">
              <div className="mb-2 flex justify-between text-xs font-medium text-gray-500">
                <span>Setup progress</span>
                <span>{setupProgress}%</span>
              </div>

              <div className="h-2 rounded-full bg-[#EFE7D6]">
                <div
                  className="h-2 rounded-full bg-[#0F3D2E] transition-all"
                  style={{ width: `${setupProgress}%` }}
                />
              </div>
            </div>
          </div>
        </section>

        <div className="grid min-w-0 gap-6 py-6 sm:py-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <form
            onSubmit={handleSubmit}
            className="min-w-0 space-y-5 bg-white p-5 shadow-sm sm:rounded-2xl sm:border sm:border-[#D8D0BE] sm:p-6"
          >
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <section>
              <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <label className="block text-sm font-semibold">
                    Business images
                  </label>
                  <p className="mt-1 text-xs text-gray-500">
                    Add up to 4 photos. The first image is your main cover.
                  </p>
                </div>

                <span className="text-xs text-gray-500">
                  {uploadedImageCount}/4 added
                </span>
              </div>

              <div className="grid min-w-0 gap-3">
                <div className="min-w-0">
                  {images[0] ? (
                    <div className="group relative h-48 overflow-hidden rounded-2xl border sm:h-56 md:h-64">
                      <img
                        src={images[0]}
                        alt={`${business.name} main business image`}
                        className="h-full w-full object-cover"
                      />

                      <div className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={() => removeImage(0)}
                          className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-red-600"
                        >
                          Remove image
                        </button>
                      </div>

                      <div className="absolute left-3 top-3 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white">
                        Main image
                      </div>
                    </div>
                  ) : (
                    <label className="flex h-48 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#D8D0BE] bg-[#FAF7EF] px-4 text-center transition hover:border-[#0F3D2E] sm:h-56 md:h-64">
                      <ImagePlus className="mb-3 h-8 w-8 text-[#0F3D2E]" />
                      <span className="text-sm font-semibold text-gray-800">
                        Upload main image
                      </span>
                      <span className="mt-1 text-xs text-gray-500">
                        JPG, PNG, or WebP
                      </span>

                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageUpload(e, 0)}
                      />
                    </label>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3].map((imageIndex) => {
                    const image = images[imageIndex];

                    return (
                      <div key={imageIndex} className="min-w-0">
                        {image ? (
                          <div className="group relative aspect-square overflow-hidden rounded-xl border">
                            <img
                              src={image}
                              alt={`${business.name} supporting image ${imageIndex}`}
                              className="h-full w-full object-cover"
                            />

                            <div className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
                              <button
                                type="button"
                                onClick={() => removeImage(imageIndex)}
                                className="rounded-lg bg-white px-2 py-1 text-xs font-semibold text-red-600"
                              >
                                Remove
                              </button>
                            </div>

                            <div className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white">
                              Photo {imageIndex + 1}
                            </div>
                          </div>
                        ) : (
                          <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#D8D0BE] bg-[#FAF7EF] px-2 text-center transition hover:border-[#0F3D2E]">
                            <ImagePlus className="mb-1 h-5 w-5 text-[#0F3D2E]" />
                            <span className="text-xs font-semibold text-gray-700">
                              Photo {imageIndex + 1}
                            </span>

                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleImageUpload(e, imageIndex)}
                            />
                          </label>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            <section>
              <label className="mb-2 block text-sm font-semibold">
                Department
              </label>

              <select
                className={inputClass}
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              >
                <option value="">Select department</option>
                <option value="restaurant">Restaurant</option>
                <option value="salon">Salon</option>
                <option value="fitness">Fitness</option>
              </select>
            </section>

            <section>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label className="block text-sm font-semibold">Services</label>
                <span className="shrink-0 text-xs text-gray-500">
                  {services.length} added
                </span>
              </div>

              <div className="grid min-w-0 gap-2 md:grid-cols-[minmax(0,1fr)_150px_auto]">
                <input
                  type="text"
                  value={serviceInput}
                  onChange={(e) => setServiceInput(e.target.value)}
                  placeholder="e.g. Haircut"
                  className={inputClass}
                />

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={servicePriceInput}
                  onChange={(e) => setServicePriceInput(e.target.value)}
                  placeholder="Price"
                  className={inputClass}
                />

                <button
                  type="button"
                  onClick={addService}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0F3D2E] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0c2f23] md:w-auto"
                >
                  <Plus className="h-4 w-4 shrink-0" />
                  Add
                </button>
              </div>

              {services.length > 0 && (
                <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
                  {services.map((service) => (
                    <div
                      key={service.name}
                      className="flex min-w-0 items-center justify-between gap-3 rounded-xl border border-gray-200 bg-[#FAF7EF] px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-900">
                          {service.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatPrice(service.price)}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeService(service.name)}
                        className="shrink-0 rounded-lg p-2 text-red-500 transition hover:bg-red-50"
                        aria-label={`Remove ${service.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section>
              <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <label className="block text-sm font-semibold">
                  Social links
                </label>

                <span className="text-xs text-gray-500">
                  Optional, shown on your booking page
                </span>
              </div>

              <div className="grid min-w-0 gap-3">
                <div className="relative min-w-0">
                  <MessageCircle className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    placeholder="Instagram link"
                    className={`${inputClass} pl-10`}
                  />
                </div>

                <div className="relative min-w-0">
                  <Share2 className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={facebook}
                    onChange={(e) => setFacebook(e.target.value)}
                    placeholder="Facebook link"
                    className={`${inputClass} pl-10`}
                  />
                </div>

                <div className="relative min-w-0">
                  <Globe className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="Website link"
                    className={`${inputClass} pl-10`}
                  />
                </div>
              </div>
            </section>

            <section>
              <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <label className="block text-sm font-semibold">
                  Working days
                </label>

                <div className="grid grid-cols-2 gap-2 sm:flex">
                  <button
                    type="button"
                    onClick={selectWeekdays}
                    className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium transition hover:bg-gray-50"
                  >
                    Weekdays
                  </button>

                  <button
                    type="button"
                    onClick={selectEveryday}
                    className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium transition hover:bg-gray-50"
                  >
                    Everyday
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 min-[420px]:grid-cols-4 sm:flex sm:flex-wrap">
                {DAYS.map((day) => {
                  const selected = workingDays.includes(day);

                  return (
                    <button
                      type="button"
                      key={day}
                      onClick={() => toggleDay(day)}
                      className={`rounded-full border px-3 py-2 text-sm font-medium transition sm:px-4 ${
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

            <section className="grid min-w-0 gap-4 sm:grid-cols-2">
              <div className="min-w-0">
                <label className="mb-2 block text-sm font-semibold">
                  Opening time
                </label>

                <select
                  className={inputClass}
                  value={openTime}
                  onChange={(e) => setOpenTime(e.target.value)}
                >
                  {TIMES.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </div>

              <div className="min-w-0">
                <label className="mb-2 block text-sm font-semibold">
                  Closing time
                </label>

                <select
                  className={inputClass}
                  value={closeTime}
                  onChange={(e) => setCloseTime(e.target.value)}
                >
                  {TIMES.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </div>
            </section>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full rounded-xl bg-[#0F3D2E] p-4 text-sm font-semibold text-white transition hover:bg-[#0c2f23] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSaving ? "Saving Setup..." : "Finish Setup"}
            </button>
          </form>

          <aside className="min-w-0 space-y-4 px-0 lg:sticky lg:top-6 lg:self-start">
            <div className="bg-white p-5 shadow-sm sm:rounded-2xl sm:border sm:border-[#D8D0BE] sm:p-6">
              <h2 className="text-lg font-semibold text-gray-950">
                Setup summary
              </h2>

              <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-1">
                <div className="flex min-w-0 items-start gap-3">
                  <ImagePlus className="mt-0.5 h-4 w-4 shrink-0 text-[#0F3D2E]" />
                  <div className="min-w-0">
                    <p className="font-medium">Business photos</p>
                    <p className="text-gray-500">
                      {uploadedImageCount
                        ? `${uploadedImageCount} of 4 photos added`
                        : "No photos yet"}
                    </p>
                  </div>
                </div>

                <div className="flex min-w-0 items-start gap-3">
                  <BriefcaseBusiness className="mt-0.5 h-4 w-4 shrink-0 text-[#0F3D2E]" />
                  <div className="min-w-0">
                    <p className="font-medium">Department</p>
                    <p className="truncate text-gray-500">
                      {department || "Not selected"}
                    </p>
                  </div>
                </div>

                <div className="flex min-w-0 items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#0F3D2E]" />
                  <div className="min-w-0">
                    <p className="font-medium">Services</p>
                    <p className="text-gray-500">
                      {services.length
                        ? `${services.length} services, avg. ${formatPrice(
                            averagePrice
                          )}`
                        : "No services yet"}
                    </p>
                  </div>
                </div>

                <div className="flex min-w-0 items-start gap-3">
                  <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#0F3D2E]" />
                  <div className="min-w-0">
                    <p className="font-medium">Social links</p>
                    <p className="text-gray-500">
                      {socialCount
                        ? `${socialCount} links added`
                        : "No social links yet"}
                    </p>
                  </div>
                </div>

                <div className="flex min-w-0 items-start gap-3">
                  <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-[#0F3D2E]" />
                  <div className="min-w-0">
                    <p className="font-medium">Working days</p>
                    <p className="text-gray-500">
                      {workingDays.length
                        ? workingDays.map((day) => day.slice(0, 3)).join(", ")
                        : "No days selected"}
                    </p>
                  </div>
                </div>

                <div className="flex min-w-0 items-start gap-3">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[#0F3D2E]" />
                  <div className="min-w-0">
                    <p className="font-medium">Hours</p>
                    <p className="text-gray-500">
                      {openTime} - {closeTime}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
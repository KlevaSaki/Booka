import { useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Clock,
  ImagePlus,
  MapPin,
  Plus,
  Trash2,
  User,
} from "lucide-react";
import { useBusinessStore } from "../features/business/store";

type Service = {
  name: string;
  price: number;
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

export default function BusinessSetup() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [image, setImage] = useState("");
  const [department, setDepartment] = useState("");
  const [serviceInput, setServiceInput] = useState("");
  const [servicePriceInput, setServicePriceInput] = useState("");
  const [services, setServices] = useState<Service[]>([]);
  const [workingDays, setWorkingDays] = useState<string[]>([]);
  const [openTime, setOpenTime] = useState("09:00");
  const [closeTime, setCloseTime] = useState("17:00");
  const [error, setError] = useState("");

  const business = useBusinessStore((s) =>
    s.businesses.find((b) => b.slug === slug)
  );

  const updateBusiness = useBusinessStore((s) => s.updateBusiness);

  const setupProgress = useMemo(() => {
    const completed = [
      Boolean(image),
      Boolean(department),
      services.length > 0,
      workingDays.length > 0,
      Boolean(openTime && closeTime),
    ].filter(Boolean).length;

    return Math.round((completed / 5) * 100);
  }, [
    image,
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

  if (!business) {
    return (
      <main className="min-h-screen bg-[#FAF7EF] px-4 py-16">
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

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

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

    updateBusiness(slug!, {
      department,
      services,
      workingHours: {
        days: workingDays,
        open: openTime,
        close: closeTime,
      },
      images: image ? [image] : [],
      isSetupComplete: true,
    });

    navigate(`/dashboard/${slug}`);
  }

  function handleImageUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onloadend = () => {
      setImage(reader.result as string);
    };

    reader.readAsDataURL(file);
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
    "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-gray-400 focus:border-[#0F3D2E] focus:ring-4 focus:ring-[#0F3D2E]/10";

  return (
    <main className="min-h-screen bg-[#FAF7EF] px-0 py-0 text-gray-900 sm:px-6 sm:py-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <section className="bg-white p-5 shadow-sm sm:rounded-2xl sm:border sm:border-[#D8D0BE] sm:p-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-medium text-[#0F3D2E]">
                Business setup
              </p>

              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-gray-950 sm:text-3xl">
                Welcome, {business.name}
              </h1>

              <div className="mt-3 flex flex-wrap gap-2 text-sm text-gray-600">
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

            <div className="w-full md:max-w-xs">
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

        <div className="grid gap-6 py-6 sm:py-6 lg:grid-cols-[minmax(0,1fr)_360px]">
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
              <label className="mb-2 block text-sm font-semibold">
                Business image
              </label>

              {image ? (
                <div className="group relative h-48 overflow-hidden rounded-2xl border sm:h-56 md:h-64">
                  <img
                    src={image}
                    alt={business.name}
                    className="h-full w-full object-cover"
                  />

                  <div className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => setImage("")}
                      className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-red-600"
                    >
                      Remove image
                    </button>
                  </div>
                </div>
              ) : (
                <label className="flex h-48 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#D8D0BE] bg-[#FAF7EF] px-4 text-center transition hover:border-[#0F3D2E] sm:h-56 md:h-64">
                  <ImagePlus className="mb-3 h-8 w-8 text-[#0F3D2E]" />
                  <span className="text-sm font-semibold text-gray-800">
                    Upload business image
                  </span>
                  <span className="mt-1 text-xs text-gray-500">
                    JPG, PNG, or WebP
                  </span>

                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </label>
              )}
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

              <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_150px_auto]">
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
                  <Plus className="h-4 w-4" />
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

              <div className="grid grid-cols-3 gap-2 xs:grid-cols-4 sm:flex sm:flex-wrap">
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

            <section className="grid gap-4 sm:grid-cols-2">
              <div>
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

              <div>
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
              className="w-full rounded-xl bg-[#0F3D2E] p-4 text-sm font-semibold text-white transition hover:bg-[#0c2f23]"
            >
              Finish Setup
            </button>
          </form>

          <aside className="space-y-4 px-0 lg:sticky lg:top-6 lg:self-start">
            <div className="bg-white p-5 shadow-sm sm:rounded-2xl sm:border sm:border-[#D8D0BE] sm:p-6">
              <h2 className="text-lg font-semibold text-gray-950">
                Setup summary
              </h2>

              <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-1">
                <div className="flex items-start gap-3">
                  <BriefcaseBusiness className="mt-0.5 h-4 w-4 shrink-0 text-[#0F3D2E]" />
                  <div className="min-w-0">
                    <p className="font-medium">Department</p>
                    <p className="truncate text-gray-500">
                      {department || "Not selected"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
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

                <div className="flex items-start gap-3">
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

                <div className="flex items-start gap-3">
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
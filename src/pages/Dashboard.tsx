
import { useEffect, useMemo } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useBusinessStore } from "../features/business/store";
import { useBookingStore } from "../features/bookings/store";


export default function Dashboard() {
  const { slug } = useParams();

  const navigate = useNavigate();

  const business = useBusinessStore((s) =>
    s.businesses.find((b) => b.slug === slug)
  );

  const bookings = useBookingStore((s) => s.bookings);

  const todayBookings = useMemo(() => {
    return bookings.filter((b) => b.businessSlug === slug);
  }, [bookings, slug]);



  useEffect(() => {
    if (business && !business.isSetupComplete) {
      navigate(`/setup/${business.slug}`);
    }
  }, [business, navigate]);

  if (!business) {
    return (
      <div className="p-6">
        <h2 className="text-lg font-bold">Business not found</h2>
      </div>
    );
  }



  // derive latest business safely from store (NOT local state)
  const bookingLink = `${window.location.origin}/b/${business.slug}`;


  function getBusinessStatus() {
  if (!business?.workingHours) return "Unknown";

  const { days, open, close } = business.workingHours;

  const now = new Date();

  // Get current day name
  const currentDay = now.toLocaleDateString("en-US", {
    weekday: "long",
  });

  // 1. Check if today is a working day
  const isWorkingDay = days?.includes(currentDay);

  if (!isWorkingDay) return "Closed";

  // 2. Convert time strings to comparable values
  const currentTime = now.getHours() * 60 + now.getMinutes();

  const [openH, openM] = open.split(":").map(Number);
  const [closeH, closeM] = close.split(":").map(Number);

  const openTime = openH * 60 + openM;
  const closeTime = closeH * 60 + closeM;

  // 3. Check time range
  const isOpen = currentTime >= openTime && currentTime <= closeTime;

  return isOpen ? "Open" : "Closed";
}


const status = getBusinessStatus();

  return (
      <div className="p-6 space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{business.name}</h1>
          <p className="text-gray-500 mt-1">{business.location}</p>
          <p className="text-sm text-gray-400 mt-1">{business.department}</p>
        </div>

        <Link to={`/settings/${business.slug}`}>
            <button className="px-4 py-2 bg-[#0F3D2E] text-white rounded-lg">
              Settings
            </button>
        </Link>
      </div>

      {/* Image Banner */}
      {business.images?.[0] && (
        <div className="w-full h-52 rounded-xl overflow-hidden">
          <img
            src={business.images[0]}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Services Offered */}

      <div className="p-4 border rounded-xl bg-white">

        <h2 className="text-lg font-semibold mb-3">
          Services Offered
        </h2>

        {business.services?.length ? (
          <div className="flex flex-wrap gap-2">
            {business.services?.length ? (
              <div className="flex flex-wrap gap-2">
                {business.services.map((service) => (
                  <span
                    key={service.name}
                    className="bg-[#0F3D2E] text-white px-3 py-1 rounded-full text-sm"
                  >
                    {service.name} -{" "}
                    {service.price.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                No services added yet
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            No services added yet
          </p>
        )}

      </div>

      {/* Business Schedule */}

      <div className="p-4 border rounded-xl bg-white">

        <h2 className="text-lg font-semibold mb-3">
          Business Schedule
        </h2>

        {business.workingHours ? (
          <div className="space-y-2 text-sm text-gray-700">

            <div>
              <span className="font-medium">Days:</span>{" "}
              {business.workingHours.days?.join(", ")}
            </div>

            <div>
              <span className="font-medium">Hours:</span>{" "}
              {business.workingHours.open} - {business.workingHours.close}
            </div>

          </div>
        ) : (
          <p className="text-sm text-gray-500">
            Working hours not set
          </p>
        )}

      </div>


       {/* WHATSAPP SHARE (FIXED) */}
        <div className="p-4 border rounded-xl bg-gray-50 space-y-2">

          <p className="font-semibold">
            Share your business
          </p>

          <input
            readOnly
            value={bookingLink}
            className="w-full border p-2 rounded"
          />

          <a
            href={`https://wa.me/?text=${encodeURIComponent(
              `Book with ${business.name}: ${bookingLink}`
            )}`}
            target="_blank"
            className="block text-center bg-[#0F3D2E] text-white p-3 rounded-lg"
          >
            Share on WhatsApp
          </a>

        </div>

      {/* STATS */}
      <div className="grid grid-cols-3 gap-4">

        <div className="p-4 border rounded-xl">
          <p className="text-sm text-gray-500">Today</p>
          <p className="text-xl font-bold">{todayBookings.length}</p>
        </div>

        <div className="p-4 border rounded-xl">
          <p className="text-sm text-gray-500">Total Bookings</p>
          <p className="text-xl font-bold">{todayBookings.length}</p>
        </div>

        <div className="p-4 border rounded-xl">
          <p className="text-sm text-gray-500">Status</p>
          <p className={`text-xl font-bold ${status === "Open" ? "text-green-600" : "text-red-500"}`}>{status}</p>
        </div>

      </div>

    </div>
  );
}
import { useState, useMemo } from "react";
import { useBookingStore } from "../store";
import type { Business } from "../../business/store";


interface BookingFormProps {
  business: Business;
}

export default function BookingForm({
  business,
}: BookingFormProps) {

  const addBooking = useBookingStore((s) => s.addBooking);
  const bookings = useBookingStore((s) => s.bookings);

  const [selectedService, setSelectedService] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  if (!business) return <p>Business not found</p>;

  function handleSubmit() {

    if (!selectedService || !date || !time || !name || !phone) {
      alert("Please complete all fields");
      return;
    }

    const datetime = new Date(`${date}T${time}`).toISOString();

    addBooking({
      businessSlug: business.slug,
      service: selectedService,
      name,
      phone,
      datetime,
    });

    alert("✅ Booking Confirmed!");
  }

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


const timeSlots = useMemo(() => {
  const open = business.workingHours?.open;
  const close = business.workingHours?.close;

  if (!open || !close) return [];

  const start = timeToMinutes(open);
  const end = timeToMinutes(close);

  const slots: string[] = [];

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
    .map((booking) => {
      return new Date(booking.datetime).toTimeString().slice(0, 5);
    });
}, [bookings, business.slug, date]);

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-8">

      {/* ===================== */}
      {/* SERVICES              */}
      {/* ===================== */}

      <div>
        <h2 className="text-lg font-semibold mb-3">
          Services Offered
        </h2>

        <div className="space-y-3">
          {business.services?.map((service: any) => (
            <label
              key={service.name || service}
              className={`flex justify-between items-center border rounded-lg p-4 cursor-pointer ${
                selectedService === (service.name || service)
                  ? "border-[#0F3D2E] bg-green-50"
                  : ""
              }`}
            >
              <div>
                <p className="font-medium">
                  {service.name || service}
                </p>

                {service.price && (
                  <p className="text-sm text-gray-500">
                    KES {service.price}
                  </p>
                )}
              </div>

              <input
                type="radio"
                name="service"
                value={service.name || service}
                onChange={() =>
                  setSelectedService(service.name || service)
                }
              />
            </label>
          ))}
        </div>
      </div>

      {/* ===================== */}
      {/* BUSINESS HOURS        */}
      {/* ===================== */}

      <div className="p-4 border rounded-xl bg-gray-50">
        <h3 className="font-semibold mb-2">
          Opening Hours
        </h3>

        <p className="text-sm text-gray-600">
          {business.workingHours?.days?.join(", ")}
        </p>

        <p className="text-sm text-gray-600">
          {business.workingHours?.open} —{" "}
          {business.workingHours?.close}
        </p>
      </div>

      {/* ===================== */}
      {/* BOOKING DETAILS       */}
      {/* ===================== */}

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">
          Select Date & Time
        </h2>

        <input
          type="date"
          className="w-full border p-3 rounded-lg"
          value={date}
          onChange={(e) => {setDate(e.target.value); setTime("")}}
        />

        <div>
          <p className="mb-2 text-sm font-medium text-gray-700">
            Available Times
          </p>

          {!date ? (
            <div className="rounded-lg border border-dashed p-4 text-sm text-gray-500">
              Select a date first to see available times.
            </div>
          ) : timeSlots.length === 0 ? (
            <div className="rounded-lg border border-dashed p-4 text-sm text-gray-500">
              No opening hours available.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {timeSlots.map((slot) => {
                const isBooked = bookedTimes.includes(slot);
                const isSelected = time === slot;

                return (
                  <button
                    key={slot}
                    type="button"
                    disabled={isBooked}
                    onClick={() => setTime(slot)}
                    className={`rounded-lg border px-3 py-3 text-sm font-medium transition ${
                      isBooked
                        ? "cursor-not-allowed border-red-100 bg-red-50 text-red-400"
                        : isSelected
                        ? "border-[#0F3D2E] bg-[#0F3D2E] text-white"
                        : "border-gray-200 bg-white text-gray-700 hover:border-[#0F3D2E] hover:bg-green-50"
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

      {/* ===================== */}
      {/* CUSTOMER DETAILS      */}
      {/* ===================== */}

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">
          Your Details
        </h2>

        <input
          className="w-full border p-3 rounded-lg"
          placeholder="Your Name"
          onChange={(e) => setName(e.target.value)}
        />

        <input
          className="w-full border p-3 rounded-lg"
          placeholder="Phone Number"
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>

      {/* ===================== */}
      {/* CONFIRM BUTTON        */}
      {/* ===================== */}

      <button
        onClick={handleSubmit}
        className="w-full bg-[#0F3D2E] text-white p-4 rounded-xl font-semibold hover:bg-[#0c2f23]"
      >
        Confirm Booking
      </button>
    </div>
  );
}
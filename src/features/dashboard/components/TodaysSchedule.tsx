import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import Card from "../../../components/ui/Card";
import Badge from "../../../components/ui/Badge";
import { useBookingStore } from "../../bookings/store";
import { useBusinessStore } from "../../business/store";

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDateKeyLabel(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);

  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

function getDateKeyFromBooking(booking: any) {
  if (booking.datetime) return toDateKey(new Date(booking.datetime));
  if (booking.date) return booking.date;
  if (booking.bookingDate) return booking.bookingDate;

  return toDateKey(new Date());
}

function getServiceName(service: any) {
  if (typeof service === "string") return service;
  return service?.name || "Service";
}

function getSlotsPerDay(open?: string, close?: string) {
  if (!open || !close) return 8;

  const [openHour, openMinute] = open.split(":").map(Number);
  const [closeHour, closeMinute] = close.split(":").map(Number);

  const openTotal = openHour * 60 + openMinute;
  const closeTotal = closeHour * 60 + closeMinute;

  if (closeTotal <= openTotal) return 8;

  return Math.max(1, Math.floor((closeTotal - openTotal) / 60));
}

function formatBookingTime(datetime?: string) {
  if (!datetime) return "";

  return new Date(datetime).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function TodaySchedule() {
  const { slug } = useParams();

  const [selectedDate, setSelectedDate] = useState(() => toDateKey(new Date()));
  const [visibleMonth, setVisibleMonth] = useState(() => new Date());

  const bookings = useBookingStore((s) => s.bookings);

  const business = useBusinessStore((s) =>
    s.businesses.find((b) => b.slug === slug)
  );

  const businessBookings = useMemo(() => {
    return bookings.filter((booking) => booking.businessSlug === slug);
  }, [bookings, slug]);

  const bookingsByDate = useMemo(() => {
    return businessBookings.reduce<Record<string, typeof businessBookings>>(
      (acc, booking) => {
        const dateKey = getDateKeyFromBooking(booking);

        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(booking);

        return acc;
      },
      {}
    );
  }, [businessBookings]);

  const selectedBookings = bookingsByDate[selectedDate] || [];

  const slotsPerDay = getSlotsPerDay(
    business?.workingHours?.open,
    business?.workingHours?.close
  );

  const monthLabel = visibleMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const calendarDays = useMemo(() => {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const startOffset = firstDay.getDay();
    const startDate = new Date(year, month, 1 - startOffset);

    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + index);
      return date;
    });
  }, [visibleMonth]);

  function goToPreviousMonth() {
    setVisibleMonth(
      new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1)
    );
  }

  function goToNextMonth() {
    setVisibleMonth(
      new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1)
    );
  }

  function goToToday() {
    const today = new Date();
    setVisibleMonth(today);
    setSelectedDate(toDateKey(today));
  }

  return (
    <div className="mt-6 min-w-0 space-y-5 overflow-x-hidden">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-xl font-semibold text-[#0F3D2E]">
            Booking Calendar
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Track daily bookings and spot fully booked days.
          </p>
        </div>

        <button
          type="button"
          onClick={goToToday}
          className="w-full rounded-lg border border-[#0F3D2E]/20 bg-white px-3 py-2 text-sm font-medium text-[#0F3D2E] transition hover:bg-[#FAF7EF] sm:w-fit"
        >
          Today
        </button>
      </div>

      <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Card>
          <div className="mb-5 flex min-w-0 items-center justify-between gap-2">
            <button
              type="button"
              onClick={goToPreviousMonth}
              className="shrink-0 rounded-lg border px-3 py-2 text-sm transition hover:bg-gray-50"
            >
              <span className="sm:hidden">Prev</span>
              <span className="hidden sm:inline">Previous</span>
            </button>

            <h3 className="min-w-0 truncate text-center text-base font-semibold text-gray-900 sm:text-lg">
              {monthLabel}
            </h3>

            <button
              type="button"
              onClick={goToNextMonth}
              className="shrink-0 rounded-lg border px-3 py-2 text-sm transition hover:bg-gray-50"
            >
              Next
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase tracking-wide text-gray-400 sm:gap-2 sm:text-xs">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="truncate">
                {day}
              </div>
            ))}
          </div>

          <div className="mt-2 grid grid-cols-7 gap-1 sm:gap-2">
            {calendarDays.map((date) => {
              const dateKey = toDateKey(date);
              const dayBookings = bookingsByDate[dateKey] || [];
              const isCurrentMonth =
                date.getMonth() === visibleMonth.getMonth();
              const isSelected = selectedDate === dateKey;
              const isToday = dateKey === toDateKey(new Date());

              const currentDayName = date.toLocaleDateString("en-US", {
                weekday: "long",
              });

              const isWorkingDay =
                !business?.workingHours?.days?.length ||
                business.workingHours.days.includes(currentDayName);

              const isFullyBooked =
                isWorkingDay && dayBookings.length >= slotsPerDay;

              return (
                <button
                  key={dateKey}
                  type="button"
                  onClick={() => setSelectedDate(dateKey)}
                  className={[
                    "min-h-14 min-w-0 rounded-lg border p-1 text-left transition sm:min-h-20 sm:rounded-xl sm:p-2",
                    isSelected
                      ? "border-[#0F3D2E] ring-2 ring-[#0F3D2E]/20"
                      : "border-gray-200",
                    isFullyBooked
                      ? "bg-red-50 text-red-700"
                      : isCurrentMonth
                      ? "bg-white hover:bg-[#FAF7EF]"
                      : "bg-gray-50 text-gray-300",
                  ].join(" ")}
                >
                  <div className="flex min-w-0 items-start justify-between gap-1">
                    <span
                      className={[
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold sm:h-7 sm:w-7 sm:text-sm",
                        isToday ? "bg-[#0F3D2E] text-white" : "",
                      ].join(" ")}
                    >
                      {date.getDate()}
                    </span>

                    {dayBookings.length > 0 && (
                      <span
                        className={[
                          "rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none sm:px-2 sm:text-xs",
                          isFullyBooked
                            ? "bg-red-600 text-white"
                            : "bg-[#0F3D2E]/10 text-[#0F3D2E]",
                        ].join(" ")}
                      >
                        {dayBookings.length}
                      </span>
                    )}
                  </div>

                  {isFullyBooked && (
                    <p className="mt-2 hidden text-xs font-semibold sm:block">
                      Fully booked
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        </Card>

        <Card>
          <div className="mb-4 min-w-0">
            <p className="text-sm text-gray-500">Selected day</p>
            <h3 className="text-lg font-semibold text-gray-900">
              {formatDateKeyLabel(selectedDate)}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {selectedBookings.length} of {slotsPerDay} slots booked
            </p>
          </div>

          {selectedBookings.length === 0 ? (
            <div className="rounded-xl border border-dashed p-5 text-center">
              <p className="text-sm text-gray-500">No bookings for this day</p>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedBookings
                .slice()
                .sort((a, b) =>
                  String(a.datetime).localeCompare(String(b.datetime))
                )
                .map((booking) => (
                  <div
                    key={booking.id}
                    className="min-w-0 rounded-xl border border-gray-200 bg-white p-4"
                  >
                    <div className="flex min-w-0 items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-gray-900">
                          {booking.name}
                        </p>
                        <p className="truncate text-sm text-gray-500">
                          {getServiceName(booking.service)}
                        </p>
                      </div>

                      <div className="shrink-0 text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {formatBookingTime(booking.datetime)}
                        </p>
                        <Badge text="confirmed" type="success" />
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
import { useBookingStore } from "../../bookings/store";
import { useParams } from "react-router-dom";

const START_HOUR = 9;
const END_HOUR = 17;

function getWeekDays() {
  const today = new Date();
  const sunday = new Date(today);
  sunday.setDate(today.getDate() - today.getDay());

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    return d;
  });
}

function getTimeSlots() {
  const slots: string[] = [];

  for (let hour = START_HOUR; hour < END_HOUR; hour++) {
    ["00", "30"].forEach((m) => {
      slots.push(`${hour}:${m}`);
    });
  }

  return slots;
}

export default function BookingCalendar() {
  const { slug } = useParams();

  const bookings = useBookingStore((s) => s.bookings);

  const businessBookings = bookings.filter(
    (b) => b.businessSlug === slug
  );

  const days = getWeekDays();
  const slots = getTimeSlots();

  function isBooked(day: Date, slot: string) {
    return businessBookings.some((b) => {
      const bookingDate = new Date(b.datetime);

      const sameDay =
        bookingDate.toDateString() === day.toDateString();

      const bookingTime =
        bookingDate.getHours() +
        ":" +
        bookingDate.getMinutes().toString().padStart(2, "0");

      return sameDay && bookingTime === slot;
    });
  }

  return (
    <div className="border rounded-xl p-4 w-full max-w-5xl h-[600px] overflow-auto">
      <h3 className="font-semibold mb-4">
        Weekly Schedule
      </h3>

      <div className="grid grid-cols-[80px_repeat(7,1fr)] text-xs">
        <div />

        {days.map((d) => (
          <div key={d.toDateString()} className="text-center font-medium pb-2">
            {d.toLocaleDateString("en-US", { weekday: "short" })}
          </div>
        ))}

        {slots.map((slot) => (
          <div key={slot} className="contents">
            <div className="border-t text-right pr-2 py-2">
              {slot}
            </div>

            {days.map((day) => {
              const booked = isBooked(day, slot);

              return (
                <div
                  key={day.toDateString() + slot}
                  className={`
                    border-t border-l h-10
                    flex items-center justify-center
                    ${booked ? "bg-red-300" : "bg-green-50"}
                  `}
                >
                  {booked && "Booked"}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
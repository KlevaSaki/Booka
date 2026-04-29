import { useState, useEffect } from "react";
import Card from "../../../components/ui/Card";
import Badge from "../../../components/ui/Badge";
import { getBookings } from "../../bookings/store";

export default function TodaySchedule() {
  const [bookings, setBookings] = useState(getBookings());

  useEffect(() => {
    const interval = setInterval(() => {
      setBookings(getBookings());
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="mt-6">
      <h2 className="text-lg font-semibold text-primary mb-3">
        Today Schedule
      </h2>

      {bookings.length === 0 ? (
        <Card>
          <p className="text-gray-500">No bookings yet</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <Card key={b.id}>
              <div className="flex justify-between">
                <div>
                  <p className="font-semibold">{b.name}</p>
                  <p className="text-sm text-gray-500">
                    {b.service}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-sm">{b.time}</p>
                  <Badge text="confirmed" type="success" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
import { useState } from "react";
import { useParams } from "react-router-dom";

import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
// import { useBusinessStore } from "../../business/store";
import { useBookingStore } from "../store";

export default function BookingForm({ service, onBack }: any) {
  const { slug } = useParams();

  const addBooking = useBookingStore((s) => s.addBooking);

  // const business = useBusinessStore((s) =>
  //   s.businesses.find((b) => b.slug === slug)
  // );

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  function handleSubmit() {
    if (!slug) return;

    if (!date || !time) {
      alert("Select date and time");
      return;
    }

    const datetime = new Date(`${date}T${time}`).toISOString();

    addBooking({
      service: service.name,
      name,
      phone,
      businessSlug: slug,
      datetime,
    });

    alert("Booking created!");
  }

  return (
    <div className="mt-4 space-y-4">
      <h2 className="font-semibold">Customer Details</h2>

      <Card>
        <p className="text-sm text-gray-500">Service</p>
        <p className="font-medium">{service?.name}</p>
      </Card>

      {/* DATE PICKER */}
      <input
        type="date"
        className="w-full p-2 border rounded-lg"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />

      {/* TIME PICKER */}
      <input
        type="time"
        className="w-full p-2 border rounded-lg"
        value={time}
        onChange={(e) => setTime(e.target.value)}
      />

      <input
        className="w-full p-2 border rounded-lg"
        placeholder="Customer Name"
        onChange={(e) => setName(e.target.value)}
      />

      <input
        className="w-full p-2 border rounded-lg"
        placeholder="Phone Number"
        onChange={(e) => setPhone(e.target.value)}
      />

      <div className="flex gap-2">
        <button
          onClick={onBack}
          className="px-4 py-2 border rounded-lg"
        >
          Back
        </button>

        <Button onClick={handleSubmit}>
          Confirm Booking
        </Button>
      </div>
    </div>
  );
}
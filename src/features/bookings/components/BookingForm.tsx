import { useState } from "react";
import { useParams } from "react-router-dom";

import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";

import { useBookingStore } from "../store";

export default function BookingForm({
  service,
  time,
  onBack,
}: any) {

  const { slug } = useParams(); // ⭐ get business slug

  const addBooking = useBookingStore((s) => s.addBooking);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  function handleSubmit() {
    if (!slug) {
      alert("Business not found");
      return;
    }

    addBooking({
      service: service.name,
      time,
      name,
      phone,
      businessSlug: slug, // ⭐ LINK BOOKING TO BUSINESS
    });

    alert("Booking created!");
  }

  return (
    <div className="mt-4 space-y-4">
      <h2 className="font-semibold">Customer Details</h2>

      <Card>
        <p className="text-sm text-gray-500">Service</p>
        <p className="font-medium">{service?.name}</p>

        <p className="text-sm text-gray-500 mt-2">Time</p>
        <p className="font-medium">{time}</p>
      </Card>

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
          className="px-4 py-2 border cursor-pointer rounded-lg"
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
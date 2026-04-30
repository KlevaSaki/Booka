import { useParams } from "react-router-dom";
import { useBusinessStore } from "../features/business/store";
import { useState } from "react";

import ServiceSelector from "../features/bookings/components/ServiceSelector";
import TimeSlotPicker from "../features/bookings/components/TimeSlotPicker";
import BookingForm from "../features/bookings/components/BookingForm";

export default function PublicBooking() {
  const { slug } = useParams();

  const getBusinessBySlug = useBusinessStore(
    (s) => s.getBusinessBySlug
  );

  const business = getBusinessBySlug(slug || "");

  const [step, setStep] = useState(1);
  const [service, setService] = useState<any>(null);
  const [time, setTime] = useState<string | null>(null);

  if (!business) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-bold">Business not found</h2>
        <p className="text-gray-500">
          This booking link is invalid or expired.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto p-4 space-y-6">

      <div className="text-center">
        <h1 className="text-2xl font-bold">
          {business.name}
        </h1>
        <p className="text-gray-500">
          Book an appointment
        </p>
      </div>

      {step === 1 && (
        <ServiceSelector
          onSelect={(s) => {
            setService(s);
            setStep(2);
          }}
        />
      )}

      {step === 2 && (
        <TimeSlotPicker
          onSelect={(t) => {
            setTime(t);
            setStep(3);
          }}
        />
      )}

      {step === 3 && (
        <BookingForm
          service={service}
          time={time}
          onBack={() => setStep(2)}
        />
      )}

    </div>
  );
}
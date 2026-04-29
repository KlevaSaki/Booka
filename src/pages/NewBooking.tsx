import { useState } from "react";
import ServiceSelector from "../features/bookings/components/ServiceSelector";
import TimeSlotPicker from "../features/bookings/components/TimeSlotPicker";
import BookingForm from "../features/bookings/components/BookingForm";


function StepIndicator({ step }: { step: number }) {
  return (
    <div className="flex gap-2 mb-6">
      {[1, 2, 3].map((s) => (
        <div
          key={s}
          className={`h-2 flex-1 rounded-full ${
            step >= s ? "bg-primary" : "bg-gray-200"
          }`}
        />
      ))}
    </div>
  );
}

export default function NewBooking() {
  const [step, setStep] = useState(1);

  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  return (
    <div className="p-4 max-w-md mx-auto">

      <h1 className="text-xl font-bold text-[#0F3D2E] mb-4">
        New Booking
      </h1>

      {/* STEP INDICATOR */}
      <StepIndicator step={step} />

      {/* STEP CONTENT */}
      {step === 1 && (
        <ServiceSelector
          onSelect={(service) => {
            setSelectedService(service);
            setStep(2);
          }}
        />
      )}

      {step === 2 && (
        <TimeSlotPicker
          onSelect={(time) => {
            setSelectedTime(time);
            setStep(3);
          }}
        />
      )}

      {step === 3 && (
        <BookingForm
          service={selectedService}
          time={selectedTime}
          onBack={() => setStep(2)}
        />
      )}
    </div>
  );
}
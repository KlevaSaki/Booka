import Button from "../components/ui/Button";

export default function PublicBooking() {
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold text-primary">
        King Cuts Barbershop
      </h1>

      <div className="mt-4 space-y-2">
        <div className="bg-white p-3 rounded-lg">
          Haircut — 200 KES
        </div>
        <div className="bg-white p-3 rounded-lg">
          Beard Trim — 100 KES
        </div>
      </div>

      <div className="mt-6">
        <Button>Book Appointment</Button>
      </div>
    </div>
  );
}
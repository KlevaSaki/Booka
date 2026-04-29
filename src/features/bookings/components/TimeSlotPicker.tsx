import Card from "../../../components/ui/Card";

const slots = [
  "10:00 AM",
  "10:30 AM",
  "11:00 AM",
  "11:30 AM",
];

export default function TimeSlotPicker({
  onSelect,
}: {
  onSelect: (time: string) => void;
}) {
  return (
    <div className="mt-4 space-y-3">
      <h2 className="font-semibold">Select Time</h2>

      <div className="grid grid-cols-2 gap-3">
        {slots.map((slot) => (
          <Card key={slot}>
            <button
              className="w-full"
              onClick={() => onSelect(slot)}
            >
              {slot}
            </button>
          </Card>
        ))}
      </div>
    </div>
  );
}
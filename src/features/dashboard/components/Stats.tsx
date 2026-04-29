import Card from "../../../components/ui/Card";

export default function Stats() {
  return (
    <div className="grid grid-cols-2 gap-4">
      <Card>
        <p className="text-sm text-gray-500">Today Bookings</p>
        <p className="text-2xl font-bold text-primary">5</p>
      </Card>

      <Card>
        <p className="text-sm text-gray-500">Today Earnings</p>
        <p className="text-2xl font-bold text-primary">KES 1,200</p>
      </Card>
    </div>
  );
}
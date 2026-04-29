import Card from "../../../components/ui/Card";

export type Service = {
  id: number;
  name: string;
  price: number;
};

const services = [
  { id: 1, name: "Haircut", price: 200 },
  { id: 2, name: "Beard Trim", price: 100 },
  { id: 3, name: "Hair + Beard", price: 300 },
];

export default function ServiceSelector({
  onSelect,
}: {
  onSelect: (service: any) => void;
}) {
  return (
    <div className="mt-4 space-y-3">
      <h2 className="font-semibold">Select Service</h2>

      {services.map((s) => (
        <Card key={s.id}>
          <button
            className="w-full text-left"
            onClick={() => onSelect(s)}
          >
            <div className="flex justify-between">
              <p className="font-medium">{s.name}</p>
              <p className="text-primary font-semibold">
                KES {s.price}
              </p>
            </div>
          </button>
        </Card>
      ))}
    </div>
  );
}
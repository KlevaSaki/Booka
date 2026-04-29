type Props = {
  label: string;
  placeholder?: string;
};

export default function Input({ label, placeholder }: Props) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm text-gray-600">{label}</label>
      <input
        placeholder={placeholder}
        className="p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
      />
    </div>
  );
}
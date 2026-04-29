type Props = {
  text: string;
  type?: "success" | "danger" | "default";
};

export default function Badge({ text, type = "default" }: Props) {
  return (
    <span
      className={`text-xs px-2 py-1 rounded-full ${
        type === "success"
          ? "bg-green-100 text-green-700"
          : type === "danger"
          ? "bg-red-100 text-red-700"
          : "bg-gray-100 text-gray-700"
      }`}
    >
      {text}
    </span>
  );
}
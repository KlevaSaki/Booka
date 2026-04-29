import clsx from "clsx";

type Props = {
  children: React.ReactNode;
  variant?: "primary" | "danger" | "secondary";
  onClick?: () => void;
};

export default function Button({ children, variant = "primary", onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "px-4 py-2 rounded-lg font-medium cursor-pointer transition",
        {
          primary: "bg-[#0F3D2E] text-white",
          danger: "bg-danger text-white",
          secondary: "bg-white border border-primary text-primary",
        }[variant]
      )}
    >
      {children}
    </button>
  );
}
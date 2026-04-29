type Props = {
  children: React.ReactNode;
  open: boolean;
};

export default function Modal({ children, open }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
      <div className="bg-white p-4 rounded-xl w-[90%] max-w-md">
        {children}
      </div>
    </div>
  );
}
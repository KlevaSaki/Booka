type Props = {
  children: React.ReactNode;
};

export default function Card({ children }: Props) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      {children}
    </div>
  );
}
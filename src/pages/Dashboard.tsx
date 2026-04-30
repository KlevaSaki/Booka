import { useParams } from "react-router-dom";
import { useBusinessStore } from "../features/business/store";

export default function Dashboard() {
  const { slug } = useParams();

  // 🔥 SaaS-correct approach: derive business from slug
  const business = useBusinessStore((s) =>
    s.businesses.find((b) => b.slug === slug)
  );

  if (!business) {
     return (
      <div className="p-4">
        <h2 className="text-lg font-bold">Business not found</h2>
        <p className="text-gray-500">
          Please check the URL or complete onboarding.
        </p>
      </div>
    );
  }

  const bookingLink = `${window.location.origin}/b/${business.slug}`;

  const whatsappMessage = encodeURIComponent(
    `Book here: ${bookingLink}`
  );

  return (
    <div className="p-6 space-y-6">

      <h1 className="text-2xl font-bold">
        Welcome, {business.owner}
      </h1>

      {/* BUSINESS CARD */}
      <div className="border rounded p-4 space-y-2">
        <h2 className="font-semibold text-lg">
          {business.name}
        </h2>

        <p>📞 {business.phone}</p>
        <p>📍 {business.location}</p>

        {business.images.length === 0 && (
          <p className="text-sm text-gray-500">
            Add business images to attract customers
          </p>
        )}
      </div>

      {/* BOOKING LINK */}
      <div className="border rounded p-4 space-y-3">

        <h3 className="font-semibold">
          Your Booking Link
        </h3>

        <input
          value={bookingLink}
          readOnly
          className="w-full border p-2 rounded"
        />

        <a
          href={`https://wa.me/?text=${whatsappMessage}`}
          target="_blank"
          className="block text-center bg-[#0F3D2E] text-white p-3 rounded"
        >
          Share on WhatsApp
        </a>

      </div>

    </div>
  );
}
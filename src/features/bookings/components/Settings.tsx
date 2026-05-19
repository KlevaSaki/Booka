import { useState } from "react";
import { useParams } from "react-router-dom";
import { useBusinessStore } from "../../business/store";

export default function Settings() {
  const { slug } = useParams();

  const business = useBusinessStore((s) =>
    s.businesses.find((b) => b.slug === slug)
  );

  const [start, setStart] = useState("08:00");
  const [end, setEnd] = useState("18:00");

  const [days, setDays] = useState<string[]>([
    "Mon",
    "Tue",
    "Wed",
    "Thu",
    "Fri",
  ]);

  if (!business) return null;

  function toggleDay(day: string) {
    setDays((prev) =>
      prev.includes(day)
        ? prev.filter((d) => d !== day)
        : [...prev, day]
    );
  }

  return (
    <div className="space-y-6 border-red-700">

      <h2 className="text-2xl font-bold">Settings</h2>

      {/* WORKING HOURS */}
      <div className="border p-4 rounded-xl space-y-3">
        <h3 className="font-semibold">Working Hours</h3>

        <div className="flex gap-4">
          <input
            type="time"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="border p-2 rounded"
          />

          <input
            type="time"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="border p-2 rounded"
          />
        </div>
      </div>

      {/* WORKING DAYS */}
      <div className="border p-4 rounded-xl space-y-3">
        <h3 className="font-semibold">Working Days</h3>

        <div className="flex gap-2 flex-wrap">
          {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((day) => (
            <button
              key={day}
              onClick={() => toggleDay(day)}
              className={`px-3 py-1 border rounded-full ${
                days.includes(day)
                  ? "bg-[#0F3D2E] text-white"
                  : ""
              }`}
            >
              {day}
            </button>
          ))}
        </div>
      </div>

      <button className="bg-[#0F3D2E] text-white px-4 py-2 rounded-lg">
        Save Settings
      </button>

    </div>
  );
}
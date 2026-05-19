import { useParams, useNavigate } from "react-router-dom";
import { useBusinessStore } from "../features/business/store";
import { useState } from "react";

import { SERVICES_BY_DEPARTMENT } from "../features/constants/services";

export default function BusinessSetup() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [ image, setImage ] = useState<string>("");
  const [ department, setDepartment ] = useState<string>("");
  const [serviceInput, setServiceInput] = useState<string>("");
    const [services, setServices] = useState<string[]>([]);
  const [ workingDays, setWorkingDays ] = useState<string[]>([]);
  const [openTime, setOpenTime] = useState<string>("");
  const [ closeTime, setCloseTime ] = useState<string>("");


  const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];


const TIMES = [
  "06:00",
  "07:00",
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
];

  const business = useBusinessStore((s) =>
    s.businesses.find((b) => b.slug === slug)
  );

  const updateBusiness = useBusinessStore((s) => s.updateBusiness);

  if (!business) return <p>Business not found</p>;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    updateBusiness(slug!, {
      department,
      services,
      workingHours: {
        days: workingDays,
        open: openTime,
        close: closeTime,
      },
      images: image ? [image] : [],
      isSetupComplete: true,
      
    });

    navigate(`/dashboard/${slug}`);
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0 ) return;

        const file = files[0]; // ONLY FIRST IMAGE

        const reader = new FileReader();

        reader.onloadend = () => {
            setImage(reader.result as string);
        };

        reader.readAsDataURL(file)
        
    };

    function addService() {
        const value = serviceInput.trim();
        if (!value) return;

        if (services.includes(value)) return;

        setServices((prev) => [...prev, value]);
        setServiceInput("");
    }

    function removeService(service: string) {
        setServices((prev) => prev.filter((s) => s !== service));
    }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg p-8 space-y-6">
            {/* HEADER */}
            <div className="mb-8">

                {/* MAIN HEADING */}
                <h1 className="text-3xl font-bold text-gray-900 leading-snug">
                    Welcome{" "}
                    <span className="text-[#0F3D2E]">
                    {business?.name}
                    </span>
                </h1>

                {/* SUB HEADING */}
                <p className="text-gray-600 mt-2 text-base">
                    Let’s set up your business so customers can start booking you today.
                </p>

                {/* BUSINESS CONTEXT CARD */}
                <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-gray-50 border rounded-full text-sm text-gray-700">
                    <span>{business.location}</span>
                    <span className="text-gray-300">•</span>
                    <span>{business.owner}</span>
                </div>

            </div>

            {/* FORM */}
            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* IMAGE */}
                <label className="block font-medium">Business Images</label>
                <input
                    type="file"
                    accept="image/*"
                    className="w-full border p-3 rounded"
                    onChange={handleImageUpload}
                />

                {/* Image Preview */}
                <div className="mt-3">

                    {image ? (
                        <div className="relative w-full h-48 rounded-xl overflow-hidden border group">
                        
                        <img
                            src={image}
                            className="w-full h-full object-cover"
                        />

                        {/* Replace/Delete overlay */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                            <button
                            type="button"
                            onClick={() => setImage("")}
                            className="bg-red-500 text-white px-4 py-2 rounded"
                            >
                            Remove Image
                            </button>
                        </div>

                        </div>
                    ) : (
                        <div className="w-full h-48 border-2 border-dashed rounded-xl flex items-center justify-center text-gray-500">
                        Upload business image
                        </div>
                    )}

                </div>

                {/* DEPARTMENT */}
                <label className="block font-medium">Department</label>
                <select
                    className="w-full border p-3 rounded-lg"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    >
                    <option value="">Select Department</option>
                    <option value="restaurant">Restaurant</option>
                    <option value="salon">Salon</option>
                    <option value="fitness">Fitness</option>
                </select>

                {/* SERVICES */}
                <label className="block font-medium">Services</label>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={serviceInput}
                        onChange={(e) => setServiceInput(e.target.value)}
                        placeholder="e.g. Haircut, Beard trim"
                        className="flex-1 border p-3 rounded-lg"
                    />

                    <button
                    type="button"
                    onClick={addService}
                    className="bg-[#0F3D2E] text-white px-4 rounded-lg"
                    >
                        Add
                    </button>
                </div>

                {services.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                        {services.map((s, index) => (
                            <div key={s} className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full">
                                <span className="text-sm text-gray-700">{s}</span>

                                    <button
                                    type="button"
                                    onClick={() => removeService(s)}
                                    className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-red-100 text-red-500 text-sm"
                                    >
                                    ×
                                    </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* WORKING DAYS */}
                <label className="block font-medium">Working Days</label>

                <div className="flex flex-wrap gap-2">
                    {DAYS.map((day) => {
                        const selected = workingDays.includes(day);

                        return (
                            <button
                                type="button"
                                key={day}
                                onClick={() => {
                                setWorkingDays((prev) =>
                                    prev.includes(day)
                                    ? prev.filter((d) => d !== day)
                                    : [...prev, day]
                                );
                                }}
                                className={`px-3 py-1 rounded-full border text-sm ${
                                selected
                                    ? "bg-[#0F3D2E] text-white"
                                    : "bg-white text-gray-700"
                                }`}
                            >
                                {day}
                            </button>
                        );
                    })}
                </div>

                {/* WORKING HOURS */}
                <div className="grid grid-cols-2 gap-4">

                    <div>
                        <label className="block font-medium">Opening Time</label>
                        <select
                            className="w-full border p-3 rounded-lg"
                            value={openTime}
                            onChange={(e) => setOpenTime(e.target.value)}
                            >
                            {TIMES.map((t) => (
                                <option key={t} value={t}>
                                {t}
                                </option>
                            ))}
                        </select>
                    </div>

                <div>

                <label className="block font-medium">Closing Time</label>
                <select
                    className="w-full border p-3 rounded-lg"
                    value={closeTime}
                    onChange={(e) => setCloseTime(e.target.value)}
                    >
                    {TIMES.map((t) => (
                        <option key={t} value={t}>
                        {t}
                        </option>
                    ))}
                </select>
            </div>

        </div>

        <button className="w-full bg-[#0F3D2E] hover:bg-[#0c2f23] transition text-white p-3 rounded-lg font-medium cursor-pointer">
        Finish Setup
        </button>
                

        </form>
        </div>

        </div>
  );
}
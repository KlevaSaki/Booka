import { useState } from "react";
import { useBusinessStore } from "../features/business/store";
import { useNavigate } from "react-router-dom";

export default function Onboarding() {

  const navigate = useNavigate();
  const setBusiness = useBusinessStore((s) => s.setBusiness);


  // form state
  const [form, setForm] = useState({
    name: "",
    phone: "",
    owner: "",
    location: "",
  });

  // submit handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const slug = form.name.toLowerCase().trim().replace(/\s+/g, "-");
        navigate(`/dashboard/${slug}`);

    const newBusiness = setBusiness({
      ...form,
      images: [],
    });

    navigate(`/dashboard/${newBusiness.slug}`);
  };

  return (
    <div className="max-w-md mx-auto p-4">

      <h1 className="text-xl font-bold mb-4">
        Create Your Business
      </h1>

      <form onSubmit={handleSubmit}>

        {Object.keys(form).map((key) => (
          <input
            key={key}
            placeholder={key}
            className="w-full border p-3 mb-3 rounded"
            value={(form as any)[key]}
            onChange={(e) =>
              setForm({
                ...form,
                [key]: e.target.value,
              })
            }
          />
        ))}

        <button
          type="submit"
          className="w-full bg-[#0F3D2E] text-white p-3 rounded"
        >
          Create Business
        </button>

      </form>
    </div>
  );
}
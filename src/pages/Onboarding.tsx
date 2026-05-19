import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBusinessStore } from "../features/business/store";

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("register");

  const [ loginForm, setLoginForm ] = useState({
    email: "",
    password: ""
  })

  const navigate = useNavigate();

  const businesses = useBusinessStore((s) => s.businesses);
  const setBusiness = useBusinessStore((s) => s.setBusiness);
  const setActiveBusiness = useBusinessStore((s) => s.setActiveBusiness);

  const [form, setForm] = useState({
    businessName: "",
    owner: "",
    email: "",
    description: "",
    phone: "",
    location: "",
    password: "",
    confirmPassword: "",
  });

  // ========================
  // REGISTER BUSINESS
  // ========================
  function handleRegister(e: React.FormEvent) {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
    alert("Passwords do not match");
    return;
  }

    const business = setBusiness({
      name: form.businessName,
      owner: form.owner,
      phone: form.phone,
      location: form.location,
      description: form.description,
      email: form.email,
      password: form.password,
      services: [],
      images: [],
      isSetupComplete: false,
    });

    setActiveBusiness(business.slug);

    navigate(`/setup/${business.slug}`);
  }

  // ========================
  // LOGIN BUSINESS
  // ========================
  function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    const business = businesses.find(
    (b) =>
      b.email === loginForm.email &&
      b.password === loginForm.password
    );

      if (!business) {
        alert("Invalid email or password");
        return;
    }
    setActiveBusiness(business.slug);
    navigate(`/dashboard/${business.slug}`);
  }


  function handleChange(
  e: React.ChangeEvent<HTMLInputElement>
) {
  setForm({
    ...form,
    [e.target.name]: e.target.value,
  });
}


  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f6f7f9] px-4">

      <div className="w-full max-w-4xl bg-white shadow-xl rounded-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2">

        {/* LEFT PANEL */}
        <div className="bg-[#0F3D2E] text-white p-10 flex flex-col justify-center">
          <h1 className="text-3xl font-bold mb-4">Booka</h1>
          <p className="text-white/80">
            Manage bookings, customers, and your business — all in one place.
          </p>

          <div className="mt-8 text-sm text-white/60">
            Simple. Fast. Built for service businesses.
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="p-10">

          {/* TOGGLE */}
          <div className="flex gap-4 mb-8">
            <button
              onClick={() => setMode("register")}
              className={`px-4 py-2 rounded-full text-sm ${
                mode === "register"
                  ? "bg-[#0F3D2E] text-white"
                  : "bg-gray-100"
              }`}
            >
              Register
            </button>

            <button
              onClick={() => setMode("login")}
              className={`px-4 py-2 rounded-full text-sm ${
                mode === "login"
                  ? "bg-[#0F3D2E] text-white"
                  : "bg-gray-100"
              }`}
            >
              Login
            </button>
          </div>

          {/* REGISTER FORM */}
          {mode === "register" && (
            <form onSubmit={handleRegister} className="space-y-3">

              <h2 className="text-xl font-semibold mb-2">
                Create your business
              </h2>

              <input
                name="businessName"
                placeholder="Business Name"
                className="w-full border p-3 rounded-lg"
                value={form.businessName}
                onChange={handleChange}
              />

              <input
                name="description"
                placeholder="Business Description"
                className="w-full border p-3 rounded-lg"
                value={form.description}
                onChange={handleChange}
              />

              <input
                name="email"
                type="email"
                placeholder="Email"
                className="w-full border p-3 rounded-lg"
                value={form.email}
                onChange={handleChange}
              />

              <input
                name="phone"
                placeholder="Phone Number"
                className="w-full border p-3 rounded-lg"
                value={form.phone}
                onChange={handleChange}
              />

              <input
                name="owner"
                placeholder="Owner Name"
                className="w-full border p-3 rounded-lg"
                value={form.owner}
                onChange={handleChange}
              />

              <input
                name="location"
                placeholder="Location"
                className="w-full border p-3 rounded-lg"
                value={form.location}
                onChange={handleChange}
              />

              <input
                name="password"
                type="password"
                placeholder="Password"
                className="w-full border p-3 rounded-lg"
                value={form.password}
                onChange={handleChange}
              />

              <input
                name="confirmPassword"
                type="password"
                placeholder="Confirm Password"
                className="w-full border p-3 rounded-lg"
                value={form.confirmPassword}
                onChange={handleChange}
              />

              <button
                type="submit"
                className="w-full bg-[#0F3D2E] text-white p-3 rounded-lg mt-4"
              >
                Create Business
              </button>

            </form>
          )}

          {/* LOGIN */}
          {mode === "login" && (
            <form onSubmit={handleLogin} className="space-y-3">

              <h2 className="text-xl font-semibold mb-2">
                Login to your business
              </h2>

              <input
                type="email"
                placeholder="Email Address"
                className="w-full border p-3 rounded-lg"
                value={loginForm.email}
                onChange={(e) =>
                  setLoginForm({
                    ...loginForm,
                    email: e.target.value,
                  })
                }
              />

              <input
                type="password"
                placeholder="Password"
                className="w-full border p-3 rounded-lg"
                value={loginForm.password}
                onChange={(e) =>
                  setLoginForm({
                    ...loginForm,
                    password: e.target.value,
                  })
                }
              />

              <button
                type="submit"
                className="w-full bg-[#0F3D2E] text-white p-3 rounded-lg"
              >
                Login
              </button>

            </form>
          )}

        </div>
      </div>
    </div>
  );
}
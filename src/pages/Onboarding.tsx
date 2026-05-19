import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Building2,
  CalendarCheck,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  MapPin,
  Phone,
  User,
} from "lucide-react";
import { useBusinessStore } from "../features/business/store";

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("register");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");

  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });

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

  const navigate = useNavigate();

  const businesses = useBusinessStore((s) => s.businesses);
  const setBusiness = useBusinessStore((s) => s.setBusiness);
  const setActiveBusiness = useBusinessStore((s) => s.setActiveBusiness);

  const passwordStrength = useMemo(() => {
    let score = 0;

    if (form.password.length >= 8) score += 1;
    if (/[A-Z]/.test(form.password)) score += 1;
    if (/[0-9]/.test(form.password)) score += 1;

    if (!form.password) return { label: "Password strength", width: "0%" };
    if (score <= 1) return { label: "Weak password", width: "33%" };
    if (score === 2) return { label: "Good password", width: "66%" };

    return { label: "Strong password", width: "100%" };
  }, [form.password]);

  function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const emailExists = businesses.some(
      (business) => business.email.toLowerCase() === form.email.toLowerCase()
    );

    if (emailExists) {
      setError("A business with this email already exists.");
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

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const business = businesses.find(
      (b) =>
        b.email.toLowerCase() === loginForm.email.toLowerCase() &&
        b.password === loginForm.password
    );

    if (!business) {
      setError("Invalid email or password.");
      return;
    }

    setActiveBusiness(business.slug);
    navigate(`/dashboard/${business.slug}`);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  const inputClass =
    "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#0F3D2E] focus:ring-4 focus:ring-[#0F3D2E]/10";

  return (
    <main className="min-h-screen bg-[#FAF7EF] px-0 py-0 text-gray-900 sm:px-6 sm:py-6 lg:px-8">
      <div className="mx-auto grid min-h-screen max-w-6xl overflow-hidden bg-white shadow-xl sm:min-h-[calc(100vh-3rem)] sm:rounded-2xl sm:border sm:border-[#D8D0BE] lg:grid-cols-[0.9fr_1.1fr]">
        <section className="relative flex min-h-72 flex-col justify-between bg-[#0F3D2E] p-6 text-white sm:p-8 lg:p-10">
          <div>
            <div className="mb-10 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FAF7EF] text-[#0F3D2E]">
                <CalendarCheck className="h-5 w-5" />
              </div>

              <div>
                <h1 className="text-2xl font-semibold tracking-tight">Booka</h1>
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/55">
                  Business OS
                </p>
              </div>
            </div>

            <h2 className="max-w-md text-3xl font-semibold leading-tight sm:text-4xl">
              Manage bookings without the back-and-forth.
            </h2>

            <p className="mt-4 max-w-md text-sm leading-6 text-white/70 sm:text-base">
              Create your business profile, share your booking link, and keep
              appointments organized from one clean dashboard.
            </p>
          </div>

          <div className="mt-10 grid gap-3 text-sm text-white/80">
            {[
              "Online booking page",
              "Visual booking calendar",
              "Shareable customer link",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#FAF7EF]" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="p-5 sm:p-8 lg:p-10">
          <div className="mx-auto max-w-xl">
            <div className="mb-8 inline-flex w-full rounded-xl bg-[#F3EFE3] p-1 sm:w-auto">
              <button
                type="button"
                onClick={() => {
                  setMode("register");
                  setError("");
                }}
                className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition sm:flex-none ${
                  mode === "register"
                    ? "bg-[#0F3D2E] text-white shadow-sm"
                    : "text-[#0F3D2E] hover:bg-white/60"
                }`}
              >
                Register
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setError("");
                }}
                className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition sm:flex-none ${
                  mode === "login"
                    ? "bg-[#0F3D2E] text-white shadow-sm"
                    : "text-[#0F3D2E] hover:bg-white/60"
                }`}
              >
                Login
              </button>
            </div>

            {error && (
              <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {mode === "register" ? (
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-950">
                    Create your business
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Set up your account first. You’ll add services and hours
                    next.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="relative">
                    <Building2 className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                    <input
                      required
                      name="businessName"
                      placeholder="Business name"
                      className={`${inputClass} pl-10`}
                      value={form.businessName}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="relative">
                    <User className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                    <input
                      required
                      name="owner"
                      placeholder="Owner name"
                      className={`${inputClass} pl-10`}
                      value={form.owner}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <input
                  required
                  name="description"
                  placeholder="Business description"
                  className={inputClass}
                  value={form.description}
                  onChange={handleChange}
                />

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="relative">
                    <Mail className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                    <input
                      required
                      name="email"
                      type="email"
                      placeholder="Email address"
                      className={`${inputClass} pl-10`}
                      value={form.email}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="relative">
                    <Phone className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                    <input
                      required
                      name="phone"
                      placeholder="Phone number"
                      className={`${inputClass} pl-10`}
                      value={form.phone}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="relative">
                  <MapPin className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                  <input
                    required
                    name="location"
                    placeholder="Business location"
                    className={`${inputClass} pl-10`}
                    value={form.location}
                    onChange={handleChange}
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                      <input
                        required
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        className={`${inputClass} pl-10 pr-10`}
                        value={form.password}
                        onChange={handleChange}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((value) => !value)}
                        className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>

                    <div className="mt-2">
                      <div className="h-1.5 rounded-full bg-gray-100">
                        <div
                          className="h-1.5 rounded-full bg-[#0F3D2E] transition-all"
                          style={{ width: passwordStrength.width }}
                        />
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        {passwordStrength.label}
                      </p>
                    </div>
                  </div>

                  <div className="relative">
                    <Lock className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                    <input
                      required
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm password"
                      className={`${inputClass} pl-10 pr-10`}
                      value={form.confirmPassword}
                      onChange={handleChange}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword((value) => !value)
                      }
                      className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0F3D2E] p-3.5 text-sm font-semibold text-white transition hover:bg-[#0c2f23]"
                >
                  Create Business
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            ) : (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-950">
                    Welcome back
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Log in to manage bookings and business settings.
                  </p>
                </div>

                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                  <input
                    required
                    type="email"
                    placeholder="Email address"
                    className={`${inputClass} pl-10`}
                    value={loginForm.email}
                    onChange={(e) =>
                      setLoginForm({
                        ...loginForm,
                        email: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                  <input
                    required
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    className={`${inputClass} pl-10 pr-10`}
                    value={loginForm.password}
                    onChange={(e) =>
                      setLoginForm({
                        ...loginForm,
                        password: e.target.value,
                      })
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>

                <button
                  type="submit"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0F3D2E] p-3.5 text-sm font-semibold text-white transition hover:bg-[#0c2f23]"
                >
                  Login
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
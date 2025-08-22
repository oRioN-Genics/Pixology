import React, { useState } from "react";
import BlueButton from "./BlueButton";
import { assets } from "../assets";
import { useNavigate } from "react-router-dom";
import { api } from "../api";

const SignUpFormCard = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrorMsg("");
    setSuccessMsg("");
  };

  const validate = () => {
    if (!form.username.trim()) return "Username is required";
    if (!form.email.trim()) return "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      return "Email is invalid";
    if (!form.password || form.password.length < 6)
      return "Password must be at least 6 characters";
    return null;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const v = validate();
    if (v) {
      setErrorMsg(v);
      return;
    }

    setLoading(true);
    try {
      const res = await api("/api/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        const data = await res.json();
        setSuccessMsg("Account created! Redirecting to sign in…");
        // small delay so users see the success text
        setTimeout(() => navigate("/login"), 800);
      } else {
        const text = await res.text();
        if (res.status === 409) {
          // backend returns either "username already exists" or "email already exists"
          setErrorMsg(text || "Username or email already exists");
        } else if (res.status === 400) {
          setErrorMsg(text || "Invalid input");
        } else {
          setErrorMsg(text || "Something went wrong. Please try again.");
        }
      }
    } catch (err) {
      setErrorMsg("Network error. Is the backend running on :8080?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-[90%] max-w-[1200px] mx-auto">
      {/* Background Layer (Left Transparent Box) */}
      <div className="bg-white/60 rounded-[20px] p-4 md:p-8 w-full min-h-[480px] flex items-center justify-between">
        {/* Left Side: Sign Up Form */}
        <div className="w-full md:w-1/2 flex items-center justify-center">
          <div className="max-w-[320px] w-full px-4 py-6">
            <h2 className="text-4xl font-bold text-black mb-6 text-center">
              Welcome to Pixology!
            </h2>

            <form className="flex flex-col gap-4" onSubmit={onSubmit}>
              {/* Username */}
              <div>
                <label className="text-sm text-black">Username:</label>
                <input
                  name="username"
                  type="text"
                  placeholder="Enter your name"
                  value={form.username}
                  onChange={onChange}
                  className="w-full px-4 py-2 rounded-md mt-1 text-black bg-white"
                  autoComplete="username"
                />
              </div>

              {/* Email */}
              <div>
                <label className="text-sm text-black">Email:</label>
                <input
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={form.email}
                  onChange={onChange}
                  className="w-full px-4 py-2 rounded-md mt-1 text-black bg-white"
                  autoComplete="email"
                />
              </div>

              {/* Password */}
              <div>
                <label className="text-sm text-black">Password:</label>
                <div className="relative">
                  <input
                    name="password"
                    type={showPw ? "text" : "password"}
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={onChange}
                    className="w-full px-4 py-2 rounded-md mt-1 text-black pr-10 bg-white"
                    autoComplete="new-password"
                  />
                  {/* Eye Icon */}
                  <button
                    type="button"
                    onClick={() => setShowPw((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-black/70 hover:text-black"
                    aria-label={showPw ? "Hide password" : "Show password"}
                  >
                    <img
                      className="w-4 h-5"
                      src={showPw ? assets.Hide : assets.Show}
                      alt={showPw ? "Hide password" : "Show password"}
                    />
                  </button>
                </div>
              </div>

              {/* Error / Success */}
              {errorMsg && (
                <div className="text-sm text-red-600 -mt-1">{errorMsg}</div>
              )}
              {successMsg && (
                <div className="text-sm text-green-700 -mt-1">{successMsg}</div>
              )}

              {/* Sign up Button */}
              <BlueButton
                variant="primary"
                className="w-full mt-2 disabled:opacity-60"
                disabled={loading}
              >
                {loading ? "Signing up…" : "Sign up"}
              </BlueButton>
            </form>

            {/* Sign-in link */}
            <p className="mt-4 text-sm text-center text-black">
              Already have an account?{" "}
              <a
                href="/login"
                className="text-[#4D9FDC] font-semibold hover:underline"
              >
                Sign in
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Right Side */}
      <div className="absolute top-0 right-0 h-full w-full md:w-1/2 p-4 md:p-0">
        <div className="bg-white rounded-[20px] h-full flex flex-col md:flex-row items-center gap-10 p-10">
          <img
            src={assets.Warrior_2}
            alt="Pixel Character"
            className="w-[220px] h-auto md:w-[400px] lg:w-[600px] opacity-80 ml-[-105px]"
          />
        </div>
      </div>
    </div>
  );
};

export default SignUpFormCard;

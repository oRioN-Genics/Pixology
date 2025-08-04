import React from "react";
import BlueButton from "./BlueButton";
import { assets } from "../assets";

const LoginFormCard = () => {
  return (
    <div className="relative w-[90%] max-w-[1200px] mx-auto">
      {/* Background Layer (Left Transparent Box) */}
      <div className="bg-white/60 rounded-[20px] p-4 md:p-8 w-full min-h-[480px] flex items-center justify-between">
        {/* Left Side: Login Form */}
        <div className="w-full md:w-1/2 flex items-center justify-center">
          <div className="max-w-[320px] w-full px-4 py-6">
            <h2 className="text-4xl font-bold text-black mb-6 text-center">
              Welcome to Pixology!
            </h2>
            <form className="flex flex-col gap-4">
              {/* Username */}
              <div>
                <label className="text-sm text-black">Username:</label>
                <input
                  type="username"
                  placeholder="Enter your name"
                  className="w-full px-4 py-2 rounded-md mt-1 text-black bg-white"
                />
              </div>

              {/* Email */}
              <div>
                <label className="text-sm text-black">Email:</label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full px-4 py-2 rounded-md mt-1 text-black bg-white"
                />
              </div>

              {/* Password */}
              <div>
                <label className="text-sm text-black">Password:</label>
                <div className="relative">
                  <input
                    type="password"
                    placeholder="Enter your password"
                    className="w-full px-4 py-2 rounded-md mt-1 text-black pr-10 bg-white"
                  />
                  {/* Eye Icon */}
                  {/* <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-black cursor-pointer">
                    // 👁️
                  </span> */}
                </div>
              </div>

              {/* Log in Button */}
              <BlueButton variant="primary" className="w-full mt-2">
                Sign up
              </BlueButton>
            </form>

            {/* Sign-up link */}
            <p className="mt-4 text-sm text-center text-black">
              Already have an account?{" "}
              <a href="#" className="text-[#4D9FDC] font-semibold">
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
            src={assets.Warrior_1}
            alt="Pixel Character"
            className="w-[220px] h-auto md:w-[400px] lg:w-[600px] opacity-80 ml-[-95px]"
          />
        </div>
      </div>
    </div>
  );
};

export default LoginFormCard;

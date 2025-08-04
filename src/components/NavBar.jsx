import React from "react";
import { assets } from "../assets";
import BlueButton from "./BlueButton";

const NavBar = ({ showOnlySignUp, showOnlyLogin }) => {
  return (
    <div className="absolute top-0 left-0 w-full z-10">
      <div className="container mx-auto flex justify-between items-center py-0 px-0 md:px-20 lg:px-2 bg-white/62 rounded-b-[20px]">
        {/* Left section: logo + title */}
        <div className="flex items-center gap-4">
          <img src={assets.Icon} alt="" className="h-10 w-auto md:h-20" />
          <span className="text-[#4D9FDC] text-5xl">Pixology</span>
        </div>

        {/* Right section: buttons */}
        <div className="flex items-center gap-2">
          {!showOnlyLogin && (
            <button className="hidden md:block px-6 py-2 text-2xl">
              Sign up
            </button>
          )}

          {!showOnlySignUp && (
            <BlueButton variant="primary" className="px-15">
              Log in
            </BlueButton>
          )}
        </div>
      </div>
    </div>
  );
};

export default NavBar;

import React from "react";
import BlueButton from "./BlueButton";
import { assets } from "../assets";

const HeroSection = () => {
  return (
    <div className="relative w-[90%] max-w-[1200px] mx-auto">
      {/* Background Layer */}
      <div className="bg-white/60 rounded-[20px] p-4 md:p-8 w-full min-h-[480px] flex items-center justify-between">
        <div className="w-full md:w-1/2"></div>
        {/* Right Side Buttons */}
        <div className="flex-1 flex justify-center">
          <div className="flex flex-col items-center justify-center gap-10 mt-30">
            <BlueButton variant="primary" className="w-[250px]">
              New Project +
            </BlueButton>
            <BlueButton variant="primary" className="w-[250px]">
              Open Project
            </BlueButton>
          </div>
        </div>
      </div>

      {/* Foreground Left Overlay */}
      <div className="absolute top-0 left-0 h-full w-full md:w-1/2 p-4 md:p-0">
        <div className="bg-white rounded-[20px] h-full flex flex-col md:flex-row items-center gap-10 p-10">
          {/* Left: Text */}
          <div
            className="text-center md:text-left max-w-[300px]"
            style={{ fontFamily: "ChakraPetch" }}
          >
            <h1 className="text-3xl font-bold text-black mb-4 leading-tight text-center">
              Create Pixel <br />
              Perfect Game <br />
              Assets
            </h1>
            <p className="text-black text-md text-center">
              Professional pixel art editor for game developers and artists.
              Create, edit, and export your game assets with ease.
            </p>
          </div>

          {/* Right: Character Image */}
          <img
            src={assets.CuteGhost_1}
            alt="Pixel Character"
            className="w-[220px] h-auto md:w-[300px] lg:w-[300px] opacity-65 translate-x-10"
          />
        </div>
      </div>
    </div>
  );
};

export default HeroSection;

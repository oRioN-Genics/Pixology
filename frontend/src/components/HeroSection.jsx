import React, { useState } from "react";
import BlueButton from "./BlueButton";
import { assets } from "../assets";
import CanvasSizeModal from "./CanvasSizeModal";
import Toast from "./Toast";
import { useNavigate } from "react-router-dom";

const readUser = () => {
  try {
    const raw = localStorage.getItem("pixology:user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const HeroSection = () => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  const isAuthed = !!readUser();

  const requireAuth = (action) => {
    if (!isAuthed) {
      setToastMsg("Please log in to continue");
      // Navigate to login after short delay so toast is visible
      setTimeout(() => navigate("/login"), 1000);
      return false;
    }
    return true;
  };

  const handleNewProjectClick = () => {
    if (!requireAuth()) return;
    setShowModal(true);
  };

  const handleOpenProjectClick = () => {
    if (!requireAuth()) return;
    navigate("/library");
  };

  const handleModalSubmit = (dimensions, error) => {
    setShowModal(false);
    if (error) {
      setToastMsg(error);
      return;
    }
    console.log("Creating canvas of size:", dimensions);
    // navigate("/canvas", { state: { width: dimensions.width, height: dimensions.height } });
  };

  return (
    <div className="relative w-[90%] max-w-[1200px] mx-auto">
      <div className="bg-white/60 rounded-[20px] p-4 md:p-8 w-full min-h-[480px] flex items-center justify-between">
        <div className="w-full md:w-1/2"></div>
        <div className="flex-1 flex justify-center">
          <div className="flex flex-col items-center justify-center gap-10 mt-30">
            <BlueButton
              variant="primary"
              className="w-[250px]"
              onClick={handleNewProjectClick}
            >
              New Project +
            </BlueButton>
            <BlueButton
              variant="primary"
              className="w-[250px]"
              onClick={handleOpenProjectClick}
            >
              Open Project
            </BlueButton>
          </div>
        </div>
      </div>

      <div className="absolute top-0 left-0 h-full w-full md:w-1/2 p-4 md:p-0">
        <div className="bg-white rounded-[20px] h-full flex flex-col md:flex-row items-center gap-10 p-10">
          <div
            className="text-center md:text-left max-w-[300px]"
            style={{ fontFamily: "ChakraPetch" }}
          >
            <h1 className="text-3xl font-bold text-black mb-4 leading-tight text-center">
              Create Pixel <br /> Perfect Game <br /> Assets
            </h1>
            <p className="text-black text-md text-center">
              Professional pixel art editor for game developers and artists.
              Create, edit, and export your game assets with ease.
            </p>
          </div>

          <img
            src={assets.CuteGhost_1}
            alt="Pixel Character"
            className="w-[220px] h-auto md:w-[300px] lg:w-[300px] opacity-65 translate-x-10"
          />
        </div>
      </div>

      {showModal && (
        <CanvasSizeModal
          onClose={() => setShowModal(false)}
          onSubmit={handleModalSubmit}
        />
      )}

      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg("")} />}
    </div>
  );
};

export default HeroSection;

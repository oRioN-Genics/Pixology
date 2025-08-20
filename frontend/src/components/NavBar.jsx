import React, { useEffect, useState, useCallback } from "react";
import { assets } from "../assets";
import BlueButton from "./BlueButton";
import ExportFormatPopover from "./ExportFormatPopover";
import { useNavigate, useLocation } from "react-router-dom";

const readUser = () => {
  try {
    const raw = localStorage.getItem("pixology:user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const NavBar = ({
  showOnlySignUp,
  showOnlyLogin,
  showExportButton,
  ignoreAuthForExport,
  showOnlyFavourites,
  showSaveButton,
  onSaveClick,
  showLibraryButton,
  onBeforeExportClick, // () => true | string
  onExportBlocked, // (reason: string) => void
  onExportPick, // (fmt: 'png' | 'jpeg') => void
  underNotch,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const search = new URLSearchParams(location.search);
  const atLibrary = location.pathname === "/library";
  const atFavourites = atLibrary && search.get("tab") === "favourites";

  const [user, setUser] = useState(() => readUser());
  const [showExportPop, setShowExportPop] = useState(false);

  const isAuthed = !!user;
  const canShowExport = showExportButton && (isAuthed || !!ignoreAuthForExport);

  const sync = useCallback(() => setUser(readUser()), []);
  useEffect(() => {
    window.addEventListener("storage", sync);
    window.addEventListener("auth:change", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("auth:change", sync);
    };
  }, [sync]);

  const logout = () => {
    localStorage.removeItem("pixology:user");
    window.dispatchEvent(new Event("auth:change"));
    navigate("/");
  };

  const handleExportClick = () => {
    const ok = onBeforeExportClick?.();
    if (ok === true || ok === undefined) {
      setShowExportPop((v) => !v);
    } else if (typeof ok === "string") {
      onExportBlocked?.(ok);
      setShowExportPop(false);
    }
  };

  // Hard-navigation helpers (avoids SPA render stalls in animation mode)
  const goHomeHard = () => window.location.assign("/");
  const goLibraryHard = () => window.location.assign("/library");

  return (
    <div className="absolute top-0 left-0 w-full z-30 shadow-md">
      {/* Positioning context for attached notch */}
      <div className="relative">
        <div className="container mx-auto flex justify-between items-center py-0 px-0 md:px-20 lg:px-2 bg-white/62 rounded-b-[20px]">
          {/* Left: logo + title */}
          <div
            className="flex items-center gap-4 cursor-pointer"
            onClick={goHomeHard} // <-- hard navigation
          >
            <img src={assets.Icon} alt="" className="h-10 w-auto md:h-20" />
            <span className="text-[#4D9FDC] text-5xl">Pixology</span>
          </div>

          {/* Right: buttons */}
          <div className="flex items-center gap-4">
            {showOnlyFavourites ? (
              <BlueButton
                variant="primary"
                className="px-6 py-2"
                onClick={() =>
                  atFavourites
                    ? goLibraryHard()
                    : window.location.assign("/library?tab=favourites")
                }
              >
                {atFavourites ? "Library" : "Favourites"}
              </BlueButton>
            ) : (
              <>
                {showLibraryButton && (
                  <BlueButton
                    variant="primary"
                    className="flex items-center px-8 py-2 gap-2"
                    onClick={goLibraryHard} // <-- hard navigation
                  >
                    <img
                      src={assets.LibraryIcon}
                      alt="Library"
                      className="w-5 h-5"
                    />
                    Library
                  </BlueButton>
                )}

                {showSaveButton && (
                  <BlueButton
                    variant="primary"
                    className="flex items-center gap-2 px-10 py-2"
                    onClick={onSaveClick}
                  >
                    <img src={assets.SaveIcon} alt="Save" className="w-5 h-5" />
                    Save
                  </BlueButton>
                )}

                {canShowExport && (
                  <div className="relative">
                    <BlueButton
                      variant="primary"
                      className="flex items-center gap-2 px-10 py-2"
                      onClick={handleExportClick}
                    >
                      <img
                        src={assets.ExportIcon}
                        alt="Export"
                        className="w-5 h-5"
                      />
                      Export
                    </BlueButton>

                    {showExportPop && (
                      <ExportFormatPopover
                        onSelect={(fmt) => {
                          onExportPick?.(fmt);
                          setShowExportPop(false);
                        }}
                        onClose={() => setShowExportPop(false)}
                      />
                    )}
                  </div>
                )}

                {isAuthed ? (
                  <div className="flex items-center gap-3">
                    <span className="hidden sm:block text-black/80 text-lg">
                      Hi, {user.username}
                    </span>
                    <button
                      onClick={logout}
                      className="px-4 py-2 rounded-md bg-red-400 hover:bg-red-700 text-white"
                    >
                      Log out
                    </button>
                  </div>
                ) : (
                  <>
                    {!showOnlyLogin && (
                      <button
                        className="hidden md:block px-6 py-2 text-2xl text-black hover:text-[#4D9FDC] transition duration-200 ease-in-out"
                        onClick={() => window.location.assign("/signup")}
                      >
                        Sign up
                      </button>
                    )}
                    {!showOnlySignUp && (
                      <BlueButton
                        variant="primary"
                        className="px-15"
                        onClick={() => window.location.assign("/login")}
                      >
                        Log in
                      </BlueButton>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* Attached notch (only when provided) */}
        {underNotch && (
          <div className="absolute left-1/2 -translate-x-1/2 -bottom-4 md:-bottom-10 z-20">
            {underNotch}
          </div>
        )}
      </div>
    </div>
  );
};

export default NavBar;

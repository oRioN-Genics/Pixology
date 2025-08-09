import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import NavBar from "../components/NavBar";
import AssetTile from "../components/AssetTile";
import Toast from "../components/Toast";

const readUser = () => {
  try {
    const raw = localStorage.getItem("pixology:user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const Skeleton = () => (
  <div className="w-[140px]">
    <div className="animate-pulse aspect-square rounded-lg bg-gray-200" />
    <div className="h-3 mt-2 rounded bg-gray-200 w-24" />
  </div>
);

const LibraryPage = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams(); // ?tab=recents|shared|favourites (future)
  const [toastMsg, setToastMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  const user = useMemo(readUser, []);
  const tab = params.get("tab") || "recents";

  useEffect(() => {
    if (!user) {
      setToastMsg("Please log in to view your library.");
      navigate("/login", { replace: true });
      return;
    }

    let ignore = false;
    (async () => {
      try {
        setLoading(true);
        // GET /api/projects?userId=<id>
        const res = await fetch(`/api/projects?userId=${user.id}`);
        if (!res.ok) {
          const t = await res.text();
          throw new Error(t || "Failed to fetch projects.");
        }
        const list = await res.json();
        if (!ignore) setProjects(Array.isArray(list) ? list : []);
      } catch (e) {
        if (!ignore) setToastMsg(e.message || "Network error.");
      } finally {
        if (!ignore) setLoading(false);
      }
    })();

    return () => {
      ignore = true;
    };
  }, [user, navigate, tab]);

  const openProject = (p) => {
    navigate("/canvas", {
      state: {
        width: p.width,
        height: p.height,
        projectName: p.name,
        projectId: p.id, // ensures CanvasBoard will PUT on next save
      },
    });
  };

  return (
    <div className="relative min-h-screen">
      {/* Navbar: only the single Favourites button on the right */}
      <NavBar showOnlyFavourites />

      <div className="pt-28 container mx-auto px-4">
        {/* Simple header row (matches your mock) */}
        <div className="flex items-center justify-between">
          <h1
            className="text-2xl md:text-3xl font-bold mb-4"
            style={{ fontFamily: "ChakraPetch" }}
          >
            Assets library
          </h1>

          {/* mini view toggle placeholder (optional) */}
          <div className="hidden md:block text-sm text-black/60 mb-4 mr-1">
            {/* grid/list toggle could go here later */}
          </div>
        </div>

        {/* Grid / Loading / Empty */}
        {loading ? (
          <div className="grid grid-cols-[repeat(auto-fill,210px)] gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="mt-10 rounded-xl border border-dashed border-gray-300 bg-white/70 p-10 text-center">
            <p className="text-gray-600">
              Your library is empty. Create something on the canvas or import
              assets.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,210px)] gap-4">
            {projects.map((p) => (
              <AssetTile
                key={p.id}
                id={p.id}
                name={p.name || "Untitled"}
                previewSrc={p.previewPng || ""} // ✅ uses saved preview
                sizeLabel={`${p.width}×${p.height}`}
                isFavorite={!!p.favorite}
                selected={selectedId === p.id}
                onClick={setSelectedId}
                onDoubleClick={() => openProject(p)}
                onContextMenu={(id, e) => {
                  // placeholder for a right-click menu (rename, delete, favorite…)
                  console.log("Context menu:", id);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg("")} />}
    </div>
  );
};

export default LibraryPage;

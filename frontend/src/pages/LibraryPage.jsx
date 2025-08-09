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
  <div className="w-[200px]">
    <div className="animate-pulse aspect-square rounded-2xl bg-gray-200" />
    <div className="h-3 mt-3 rounded bg-gray-200 w-28" />
  </div>
);

const LibraryPage = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [toastMsg, setToastMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  const user = useMemo(readUser, []);
  const tab = (params.get("tab") || "recents").toLowerCase();
  const isFavTab = tab === "favourites" || tab === "favorites";

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
        const q = new URLSearchParams({ userId: user.id });
        if (isFavTab) q.set("favorite", "true");
        const res = await fetch(`/api/projects?${q.toString()}`);
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
  }, [user, navigate, isFavTab]);

  const openProject = (p) => {
    navigate("/canvas", {
      state: {
        width: p.width,
        height: p.height,
        projectName: p.name,
        projectId: p.id,
      },
    });
  };

  // Toggle favorite (optimistic). If on favourites tab and user unfavourites,
  // hide immediately; revert if server fails.
  const toggleFavorite = async (id, next) => {
    if (!user) {
      setToastMsg("Please log in to change favorites.");
      return;
    }

    if (isFavTab && !next) {
      const snapshot = projects;
      setProjects((prev) => prev.filter((p) => p.id !== id));
      try {
        const res = await fetch(
          `/api/projects/${id}/favorite?userId=${user.id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ favorite: false }),
          }
        );
        if (!res.ok) {
          const t = await res.text();
          throw new Error(t || "Failed to update favorite.");
        }
      } catch (e) {
        setProjects(snapshot); // revert
        setToastMsg(e.message || "Could not update favorite.");
      }
      return;
    }

    // Generic optimistic toggle elsewhere
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, favorite: next } : p))
    );
    try {
      const res = await fetch(
        `/api/projects/${id}/favorite?userId=${user.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ favorite: next }),
        }
      );
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || "Failed to update favorite.");
      }
    } catch (e) {
      // revert
      setProjects((prev) =>
        prev.map((p) => (p.id === id ? { ...p, favorite: !next } : p))
      );
      setToastMsg(e.message || "Could not update favorite.");
    }
  };

  return (
    <div className="relative min-h-screen">
      <NavBar showOnlyFavourites />

      <div className="pt-28 container mx-auto px-4">
        <div className="flex items-center justify-between">
          <h1
            className="text-2xl md:text-3xl font-bold mb-4"
            style={{ fontFamily: "ChakraPetch" }}
          >
            {isFavTab ? "Favourite assets" : "Assets library"}
          </h1>
          <div className="hidden md:block text-sm text-black/60 mb-4 mr-1" />
        </div>

        {loading ? (
          <div className="grid grid-cols-[repeat(auto-fill,200px)] gap-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="mt-10 rounded-xl border border-dashed border-gray-300 bg-white/70 p-10 text-center">
            <p className="text-gray-600">
              {isFavTab
                ? "No favourites yet. Click the star on a project to add it here."
                : "Your library is empty. Create something on the canvas or import assets."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,200px)] gap-6">
            {projects.map((p) => (
              <AssetTile
                key={p.id}
                id={p.id}
                name={p.name || "Untitled"}
                previewSrc={p.previewPng || ""}
                sizeLabel={`${p.width}×${p.height}`}
                isFavorite={!!p.favorite}
                selected={selectedId === p.id}
                onClick={setSelectedId}
                onDoubleClick={() => openProject(p)}
                onContextMenu={(id, e) => console.log("Context menu:", id)}
                onToggleFavorite={toggleFavorite}
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

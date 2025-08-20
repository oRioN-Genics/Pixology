// TimelinePanel.jsx
import React, { useRef, useState, useEffect } from "react";
import { assets } from "../assets";
import PreviewWindow from "../components/PreviewWindow";

const makeId = (p = "anim") =>
  `${p}-${Math.random().toString(36).slice(2, 8)}-${Date.now()
    .toString(36)
    .slice(-4)}`;

// loop mode helpers
const LOOP_MODES = ["forward", "backward", "pingpong"];
const nextLoopMode = (m) => {
  const i = LOOP_MODES.indexOf(m);
  return LOOP_MODES[(i + 1) % LOOP_MODES.length];
};

const TimelinePanel = ({
  className = "",
  framesCount = 0,
  onToast = () => {},
  initialAnimations = [],
  onExposeTimelineAPI,

  // preview props
  previewFrames = [],
  previewWidth = 128,
  previewHeight = 128,
  onRegisterPreviewAPI, // optional passthrough if parent wants the preview API too
}) => {
  const [anims, setAnims] = useState([]); // [{id, name, frames:number[], loopMode?}]
  const animsRef = useRef(anims);
  useEffect(() => {
    animsRef.current = anims;
  }, [anims]);

  const [untitledIdx, setUntitledIdx] = useState(1);
  const [selectedAnimId, setSelectedAnimId] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // Editing state (animation title)
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const inputRef = useRef(null);

  // Drag state
  const dragInfo = useRef(null); // { animId, frameNum }

  // Single-frame selection: {animId, frameNum, _idx}
  const [selection, setSelection] = useState(null);

  // Track if a blocking prompt is open
  const isPromptOpenRef = useRef(false);

  // preview ref
  const previewRef = useRef(null);

  // ---------- seed from parent when provided (guarded) ----------
  const didSeedRef = useRef(false);
  useEffect(() => {
    if (didSeedRef.current) return;
    if (!Array.isArray(initialAnimations)) return;

    const seeded = (initialAnimations || []).map((a) => ({
      id: a.id || makeId(),
      name: a.name || "untitled animation",
      frames: Array.isArray(a.frames) ? a.frames.slice() : [],
      loopMode: a.loopMode || "forward", // NEW
    }));
    setAnims(seeded);

    // compute next untitled index
    const untitledNums = seeded
      .map((a) => a.name?.match(/^untitled animation\s+(\d+)$/i)?.[1])
      .filter(Boolean)
      .map((s) => parseInt(s, 10))
      .filter((n) => Number.isFinite(n));
    const next = untitledNums.length ? Math.max(...untitledNums) + 1 : 1;
    setUntitledIdx(next);

    didSeedRef.current = true;
  }, [initialAnimations]);

  // ---------- expose API to parent (collect & load) ----------
  useEffect(() => {
    if (!onExposeTimelineAPI) return;
    const api = {
      collectTimelineSnapshot: () =>
        (animsRef.current || []).map((a) => ({
          id: a.id,
          name: a.name,
          frames: a.frames.slice(),
          loopMode: a.loopMode || "forward", // NEW
        })),
      loadFromTimelineSnapshot: (arr) => {
        const next = (Array.isArray(arr) ? arr : []).map((a) => ({
          id: a.id || makeId(),
          name: a.name || "untitled animation",
          frames: Array.isArray(a.frames) ? a.frames.slice() : [],
          loopMode: a.loopMode || "forward", // NEW
        }));
        setAnims(next);

        const untitledNums = next
          .map((a) => a.name?.match(/^untitled animation\s+(\d+)$/i)?.[1])
          .filter(Boolean)
          .map((s) => parseInt(s, 10))
          .filter((n) => Number.isFinite(n));
        setUntitledIdx(untitledNums.length ? Math.max(...untitledNums) + 1 : 1);
      },
      // (Optional) let parent reach the preview directly
      getPreviewAPI: () => previewRef.current || null,
    };
    onExposeTimelineAPI(api);
  }, [onExposeTimelineAPI]);

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  useEffect(() => {
    if (!selectedAnimId && isPlaying) setIsPlaying(false);
  }, [selectedAnimId, isPlaying]);

  // reset untitled counter when all blocks are removed
  useEffect(() => {
    if (anims.length === 0) {
      setUntitledIdx(1);
      setSelectedAnimId(null);
      setSelection(null);
    }
  }, [anims.length]);

  // --- helper: compute occurrence index among equal numbers up to idx ---
  const occurrenceIndex = (frames, n, idx) => {
    let count = 0;
    for (let i = 0; i <= idx; i++) {
      if (frames[i] === n) count++;
    }
    return count - 1; // zero-based
  };

  // Global Delete to remove selected frame
  useEffect(() => {
    const onKey = (e) => {
      if (isPromptOpenRef.current) return;

      if (editingId) return;
      if (!selection) return;

      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        const { animId, frameNum, _idx } = selection;
        setAnims((prev) =>
          prev.map((a) => {
            if (a.id !== animId) return a;
            const cur = a.frames.slice();
            let seen = -1;
            for (let i = 0; i < cur.length; i++) {
              if (cur[i] === frameNum) {
                seen++;
                if (seen === _idx) {
                  cur.splice(i, 1);
                  break;
                }
              }
            }
            return { ...a, frames: cur };
          })
        );
        setSelection(null);
      } else if (e.key === "Escape") {
        setSelection(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selection, editingId]);

  const handleBackgroundMouseDown = (e) => {
    const onChip = e.target.closest('[data-frame-chip="1"]');
    const onTitle = e.target.closest('[data-anim-title="1"]');
    const onAddFrame = e.target.closest('[data-add-frame="1"]');
    const onDeleteAnim = e.target.closest('[data-del-anim="1"]');
    const onAnimCard = e.target.closest('[data-anim-card="1"]');
    if (!onChip && !onTitle && !onAddFrame && !onDeleteAnim && !onAnimCard) {
      setSelection(null);
    }
  };

  const addAnimation = () => {
    const id = makeId();
    const name = `untitled animation ${untitledIdx}`;
    setUntitledIdx((i) => i + 1);
    setAnims((prev) => [
      ...prev,
      { id, name, frames: [], loopMode: "forward" }, // NEW
    ]);
  };

  const removeAnimation = (animId) => {
    setAnims((prev) => prev.filter((a) => a.id !== animId));
    if (editingId === animId) {
      setEditingId(null);
      setEditingText("");
    }
    if (selection?.animId === animId) {
      setSelection(null);
    }
    if (selectedAnimId === animId) {
      setSelectedAnimId(null);
    }
  };

  const startEditName = (anim) => {
    setEditingId(anim.id);
    setEditingText(anim.name);
  };

  const commitEditName = () => {
    const text = (editingText || "").trim();
    if (!editingId) return;
    setAnims((prev) =>
      prev.map((a) => (a.id === editingId ? { ...a, name: text || a.name } : a))
    );
    setEditingId(null);
    setEditingText("");
  };

  /**
   * Prompt for a frame number and add it to the block if valid.
   * Returns true if a frame was added, false otherwise.
   */
  const promptAddFrame = (animId) => {
    try {
      isPromptOpenRef.current = true;

      const raw = window.prompt("Enter frame number to add:");
      if (raw === null) return false; // cancelled

      const num = parseInt(String(raw).trim(), 10);
      if (!Number.isFinite(num) || num < 1) {
        onToast("Please enter a valid frame number (>= 1).");
        return false;
      }

      const maxFrames = Number(framesCount) || 0;
      if (num > maxFrames) {
        onToast(
          `There are only ${maxFrames} frame${
            maxFrames === 1 ? "" : "s"
          } in the rail.`
        );
        return false;
      }

      // valid -> update only the target block
      setAnims((prev) =>
        prev.map((a) => {
          if (a.id !== animId) return a;
          return { ...a, frames: [...a.frames, num] };
        })
      );
      return true;
    } finally {
      // release the prompt lock
      isPromptOpenRef.current = false;
    }
  };

  // Drag logic (reorder within the same animation)
  const onFrameDragStart = (e, anim, frameNum, idxInArray) => {
    dragInfo.current = { animId: anim.id, frameNum };
    e.dataTransfer.setData("text/plain", `${anim.id}:${frameNum}`);
    e.dataTransfer.effectAllowed = "move";

    const occIdx = occurrenceIndex(anim.frames, frameNum, idxInArray);
    setSelection({ animId: anim.id, frameNum, _idx: occIdx });
    setSelectedAnimId(anim.id);
  };

  const onFrameDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const onFrameDropOnChip = (e, targetAnimId, targetFrameNum) => {
    e.preventDefault();
    const info = dragInfo.current;
    dragInfo.current = null;
    if (!info) return;
    if (info.animId !== targetAnimId) return;

    setAnims((prev) =>
      prev.map((a) => {
        if (a.id !== targetAnimId) return a;

        const cur = a.frames.slice();
        const fromIdx = cur.indexOf(info.frameNum);
        const toIdx = cur.indexOf(targetFrameNum);
        if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return a;

        const [moved] = cur.splice(fromIdx, 1);
        cur.splice(toIdx, 0, moved);
        return { ...a, frames: cur };
      })
    );
  };

  const onFrameDropAtEnd = (e, targetAnimId) => {
    e.preventDefault();
    const info = dragInfo.current;
    dragInfo.current = null;
    if (!info) return;
    if (info.animId !== targetAnimId) return;

    setAnims((prev) =>
      prev.map((a) => {
        if (a.id !== targetAnimId) return a;
        const cur = a.frames.slice();
        const fromIdx = cur.indexOf(info.frameNum);
        if (fromIdx === -1) return a;
        const [moved] = cur.splice(fromIdx, 1);
        cur.push(moved);
        return { ...a, frames: cur };
      })
    );
  };

  const transportDisabled = !selectedAnimId;

  // NEW: loop mode toggle
  const toggleLoopMode = (animId) => {
    setAnims((prev) =>
      prev.map((a) => {
        if (a.id !== animId) return a;
        const cur = a.loopMode || "forward";
        return { ...a, loopMode: nextLoopMode(cur) };
      })
    );
  };

  // --- (Optional) keep preview fed with sources; parent can update this prop anytime
  useEffect(() => {
    previewRef.current?.setFrames?.(previewFrames || []);
    previewRef.current?.redraw?.();
  }, [previewFrames]);

  // --- (Optional) expose preview API upward if requested
  useEffect(() => {
    if (onRegisterPreviewAPI) onRegisterPreviewAPI(previewRef.current || null);
  }, [onRegisterPreviewAPI]);

  return (
    <div
      className={[
        "fixed bottom-0 left-0 w-full z-10",
        "backdrop-blur bg-white/75 border-t border-[#d7e5f3] shadow-[0_-8px_20px_rgba(0,0,0,0.05)]",
        className,
      ].join(" ")}
      onMouseDownCapture={handleBackgroundMouseDown}
    >
      <div className="container mx-auto px-2 md:px-6 py-2 relative">
        {/* Min/Max */}
        <button
          aria-label={collapsed ? "Maximize timeline" : "Minimize timeline"}
          title={collapsed ? "Maximize" : "Minimize"}
          className="absolute right-2 top-2 w-7 h-7 rounded-md border border-[#cfe0f1] bg-white flex items-center justify-center hover:bg-[#eef6ff]"
          onClick={() => setCollapsed((v) => !v)}
        >
          <span className="text-sm leading-none select-none">
            {collapsed ? "▴" : "▾"}
          </span>
        </button>

        {collapsed ? (
          <div className="h-6 flex items-center justify-center text-xs text-[#3c638c]">
            Timeline (collapsed)
          </div>
        ) : (
          // === Two-column grid: left 3/4 timeline, right 1/4 preview ===
          <div className="grid grid-cols-4 gap-4 items-start">
            {/* LEFT: 3/4 — existing timeline UI (unchanged logic, just wrapped) */}
            <div className="col-span-3 min-w-0">
              {/* Transport */}
              <div className="w-full flex items-center justify-center">
                <div className="flex items-center gap-2">
                  {[
                    {
                      key: "first",
                      icon: assets.firstFrameIcon,
                      title: "Go to first frame",
                      onClick: () => {},
                    },
                    {
                      key: "prev",
                      icon: assets.prevFrameIcon,
                      title: "Go to previous frame",
                      onClick: () => {},
                    },
                    {
                      key: "play",
                      icon: isPlaying ? assets.stopIcon : assets.playIcon,
                      title: isPlaying ? "Stop" : "Play",
                      onClick: () => setIsPlaying((p) => !p),
                    },
                    {
                      key: "next",
                      icon: assets.nextFrameIcon,
                      title: "Go to next frame",
                      onClick: () => {},
                    },
                    {
                      key: "last",
                      icon: assets.lastFrameIcon,
                      title: "Go to last frame",
                      onClick: () => {},
                    },
                  ].map((btn) => (
                    <button
                      key={btn.key}
                      className={[
                        "w-8 h-8 rounded border border-[#cfe0f1] bg-white flex items-center justify-center",
                        transportDisabled
                          ? "opacity-45 cursor-not-allowed"
                          : "hover:bg-[#eef6ff]",
                      ].join(" ")}
                      title={btn.title}
                      disabled={transportDisabled}
                      onClick={() => {
                        if (transportDisabled) return;
                        btn.onClick();
                      }}
                    >
                      <img
                        src={btn.icon}
                        alt=""
                        className="w-4 h-4 pointer-events-none"
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Controls + animations rail (your original content) */}
              <div className="mt-3 grid grid-cols-[auto,1fr] gap-4 items-start">
                <div className="shrink-0">
                  <button
                    onClick={addAnimation}
                    className="px-3 py-1.5 rounded-md bg-[#4D9FDC] text-white text-sm hover:bg-[#3e8dcb] transition"
                  >
                    Add animation
                  </button>
                </div>

                <div className="overflow-x-auto pb-3">
                  <div className="flex gap-4">
                    {anims.map((anim) => {
                      const isSelected = selectedAnimId === anim.id;
                      return (
                        <div
                          key={anim.id}
                          data-anim-card="1"
                          className={[
                            "min-w=[320px] max-w-[90vw] bg-white/80 rounded-2xl border border-[#d7e5f3] shadow-sm px-3 py-2 cursor-pointer",
                            isSelected ? "ring-2 ring-[#4D9FDC]" : "",
                          ].join(" ")}
                          onClick={(e) => {
                            const clickedBtn =
                              e.target.closest("button, input");
                            if (!clickedBtn) setSelectedAnimId(anim.id);
                          }}
                        >
                          {/* Header */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex-1">
                              {editingId === anim.id ? (
                                <input
                                  ref={inputRef}
                                  className="w-full bg-white border border-[#cfe0f1] rounded-md px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-[#4D9FDC]"
                                  value={editingText}
                                  onChange={(e) =>
                                    setEditingText(e.target.value)
                                  }
                                  onBlur={commitEditName}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") commitEditName();
                                    if (e.key === "Escape") setEditingId(null);
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                />
                              ) : (
                                <button
                                  data-anim-title="1"
                                  className="text-sm font-medium text-[#3c638c] hover:underline text-left"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    startEditName(anim);
                                  }}
                                  title="Click to rename"
                                >
                                  {anim.name}
                                </button>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                data-add-frame="1"
                                className="px-1.5 py-0.5 text[11px] leading-none rounded-md border border-[#cfe0f1] hover:bg-[#eef6ff] whitespace-nowrap"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const added = promptAddFrame(anim.id);
                                  if (added) setSelectedAnimId(anim.id);
                                  setSelection(null);
                                }}
                                title="Add frame by number"
                              >
                                Add frame
                              </button>

                              {/* Loop mode toggle (between Add & Delete) */}
                              <button
                                aria-label="Toggle loop mode"
                                className="w-6 h-6 rounded-md border border-[#cfe0f1] bg-white flex items-center justify-center hover:bg-[#eef6ff]"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleLoopMode(anim.id);
                                }}
                                title={
                                  anim.loopMode === "backward"
                                    ? "Loop: Backward"
                                    : anim.loopMode === "pingpong"
                                    ? "Loop: Ping-Pong"
                                    : "Loop: Forward"
                                }
                              >
                                <img
                                  src={
                                    anim.loopMode === "backward"
                                      ? assets.backwardLoopIcon
                                      : anim.loopMode === "pingpong"
                                      ? assets.pingPongLoopIcon
                                      : assets.forwardLoopIcon
                                  }
                                  alt=""
                                  className="w-3.5 h-3.5 pointer-events-none"
                                />
                              </button>

                              <button
                                data-del-anim="1"
                                aria-label="Delete animation"
                                className="w-6 h-6 rounded-md border flex items-center justify-center hover:bg-[#ffe8e8] hover:border-[#ffbdbd]"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeAnimation(anim.id);
                                }}
                                title="Delete animation"
                              >
                                <img
                                  src={assets.Delete}
                                  alt=""
                                  className="w-3.5 h-3.5 pointer-events-none"
                                />
                              </button>
                            </div>
                          </div>

                          {/* Frames row */}
                          <div
                            className="mt-2 flex items-center gap-2 overflow-x-auto"
                            onDragOver={onFrameDragOver}
                            onDrop={(e) => onFrameDropAtEnd(e, anim.id)}
                            onClick={() => setSelectedAnimId(anim.id)}
                          >
                            {anim.frames.map((n, idx) => {
                              const isChipSelected =
                                selection &&
                                selection.animId === anim.id &&
                                selection.frameNum === n &&
                                selection._idx ===
                                  occurrenceIndex(anim.frames, n, idx);

                              return (
                                <div
                                  key={`${n}-${idx}`}
                                  data-frame-chip="1"
                                  className={[
                                    "relative select-none cursor-grab active:cursor-grabbing outline-none",
                                    isChipSelected
                                      ? "ring-2 ring-[#4D9FDC] rounded-lg"
                                      : "",
                                  ].join(" ")}
                                  draggable
                                  onDragStart={(e) =>
                                    onFrameDragStart(e, anim, n, idx)
                                  }
                                  onDragOver={onFrameDragOver}
                                  onDrop={(e) =>
                                    onFrameDropOnChip(e, anim.id, n)
                                  }
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedAnimId(anim.id);
                                    const occIdx = occurrenceIndex(
                                      anim.frames,
                                      n,
                                      idx
                                    );
                                    setSelection({
                                      animId: anim.id,
                                      frameNum: n,
                                      _idx: occIdx,
                                    });
                                  }}
                                  title={`Frame ${n} (click to select, Delete to remove)`}
                                  tabIndex={0}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                      e.preventDefault();
                                      setSelectedAnimId(anim.id);
                                      const occIdx = occurrenceIndex(
                                        anim.frames,
                                        n,
                                        idx
                                      );
                                      setSelection({
                                        animId: anim.id,
                                        frameNum: n,
                                        _idx: occIdx,
                                      });
                                    }
                                  }}
                                >
                                  <div className="w-10 h-10 rounded-lg border border-[#cfe0f1] bg-white flex items-center justify-center text-sm text-[#3c638c] shadow-xs">
                                    {n}
                                  </div>
                                </div>
                              );
                            })}
                            <div className="w-6 h-10" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT: 1/4 — Preview window (display-only, onion skin capable) */}
            <div className="col-span-1 min-w-0">
              <PreviewWindow
                ref={previewRef}
                frames={previewFrames}
                width={previewWidth}
                height={previewHeight}
                title="Preview"
                onion={{
                  enabled: true,
                  prev: 2,
                  next: 2,
                  fade: 0.5,
                  mode: "tint",
                }}
                className="w-full"
                onRegisterPreviewAPI={onRegisterPreviewAPI}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimelinePanel;

package com.pixology.backend.project;

import java.util.List;

/** A named animation block on the timeline referencing frames by number (1-based). */
public class AnimationBlock {
    private String id;
    private String name;
    private List<Integer> frames;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public List<Integer> getFrames() { return frames; }
    public void setFrames(List<Integer> frames) { this.frames = frames; }
}

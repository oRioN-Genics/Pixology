package com.pixology.backend.project;

import org.springframework.data.mongodb.core.mapping.Field;

import java.util.List;


public class ProjectLayer {
    private String id;
    private String name;
    private boolean visible;
    private boolean locked;

    // Use Lists so Mongo maps cleanly (List<List<String>>)
    @Field("pixels")
    private List<List<String>> pixels;

    // getters/setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public boolean isVisible() { return visible; }
    public void setVisible(boolean visible) { this.visible = visible; }

    public boolean isLocked() { return locked; }
    public void setLocked(boolean locked) { this.locked = locked; }

    public List<List<String>> getPixels() { return pixels; }
    public void setPixels(List<List<String>> pixels) { this.pixels = pixels; }
}

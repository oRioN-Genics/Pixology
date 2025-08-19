package com.pixology.backend.project;

import java.util.List;

/** Embedded frame for animation projects. Topmost layer first (same as static). */
public class AnimationFrame {
    private String id;
    private String name;
    private String selectedLayerId;
    private List<ProjectLayer> layers;

    // getters/setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getSelectedLayerId() { return selectedLayerId; }
    public void setSelectedLayerId(String selectedLayerId) { this.selectedLayerId = selectedLayerId; }

    public List<ProjectLayer> getLayers() { return layers; }
    public void setLayers(List<ProjectLayer> layers) { this.layers = layers; }
}

package com.pixology.backend.project.dto;

import jakarta.validation.constraints.*;

import java.util.List;

public class SaveProjectRequest {

    @NotBlank
    private String name;

    @Min(1) @Max(512)
    private int width;

    @Min(1) @Max(512)
    private int height;

    private String selectedLayerId;

    @NotNull @Size(min = 1)
    private List<LayerDto> layers;

    // data URL "data:image/png;base64,...." (optional but recommended)
    private String previewPng;

    private Boolean favorite = Boolean.FALSE;

    public static class LayerDto {
        @NotBlank
        private String id;
        @NotBlank
        private String name;
        private boolean visible;
        private boolean locked;

        @NotNull
        private List<List<String>> pixels;

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

    // getters/setters
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public int getWidth() { return width; }
    public void setWidth(int width) { this.width = width; }

    public int getHeight() { return height; }
    public void setHeight(int height) { this.height = height; }

    public String getSelectedLayerId() { return selectedLayerId; }
    public void setSelectedLayerId(String selectedLayerId) { this.selectedLayerId = selectedLayerId; }

    public List<LayerDto> getLayers() { return layers; }
    public void setLayers(List<LayerDto> layers) { this.layers = layers; }

    public String getPreviewPng() { return previewPng; }
    public void setPreviewPng(String previewPng) { this.previewPng = previewPng; }

    public Boolean getFavorite() { return favorite; }
    public void setFavorite(Boolean favorite) { this.favorite = favorite; }
}

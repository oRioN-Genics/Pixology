package com.pixology.backend.project.dto;

import jakarta.validation.constraints.*;
import java.util.List;

public class SaveAnimationRequest {

    @NotBlank
    private String name;

    @Min(1) @Max(512)
    private int width;

    @Min(1) @Max(512)
    private int height;

    @NotNull @Size(min = 1)
    private List<FrameDto> frames;

    // NEW: optional timeline blocks
    // blocks may be empty or null; if provided, names required, frames may be empty
    private List<AnimationBlockDto> animations;

    // small preview (first frame or generated)
    private String previewPng;

    private Boolean favorite = Boolean.FALSE;

    public static class FrameDto {
        @NotBlank
        private String id;
        @NotBlank
        private String name;

        private String selectedLayerId;

        @NotNull @Size(min = 1)
        private List<LayerDto> layers;

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

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getSelectedLayerId() { return selectedLayerId; }
        public void setSelectedLayerId(String selectedLayerId) { this.selectedLayerId = selectedLayerId; }
        public List<LayerDto> getLayers() { return layers; }
        public void setLayers(List<LayerDto> layers) { this.layers = layers; }
    }

    // NEW: timeline block DTO
    public static class AnimationBlockDto {
        @NotBlank
        private String id;
        @NotBlank
        private String name;
        @NotNull
        private List<Integer> frames; // can be empty

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public List<Integer> getFrames() { return frames; }
        public void setFrames(List<Integer> frames) { this.frames = frames; }
    }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public int getWidth() { return width; }
    public void setWidth(int width) { this.width = width; }

    public int getHeight() { return height; }
    public void setHeight(int height) { this.height = height; }

    public List<FrameDto> getFrames() { return frames; }
    public void setFrames(List<FrameDto> frames) { this.frames = frames; }

    public List<AnimationBlockDto> getAnimations() { return animations; }
    public void setAnimations(List<AnimationBlockDto> animations) { this.animations = animations; }

    public String getPreviewPng() { return previewPng; }
    public void setPreviewPng(String previewPng) { this.previewPng = previewPng; }

    public Boolean getFavorite() { return favorite; }
    public void setFavorite(Boolean favorite) { this.favorite = favorite; }
}

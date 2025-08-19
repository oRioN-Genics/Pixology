package com.pixology.backend.project;

import com.pixology.backend.project.dto.*;
import com.pixology.backend.user.UserRepository;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Service
public class ProjectService {

    private final ProjectRepository repo;
    private final UserRepository userRepo;

    public ProjectService(ProjectRepository repo, UserRepository userRepo) {
        this.repo = repo;
        this.userRepo = userRepo;
    }

    // ---------- STATIC ----------
    public ProjectDetailResponse create(String userId, SaveProjectRequest req) {
        validateUser(userId);
        validateProjectPayload(req);

        if (repo.existsByUserIdAndNameIgnoreCase(userId, req.getName().trim())) {
            throw new DuplicateKeyException("project name already exists");
        }

        Project p = new Project();
        p.setKind(ProjectKind.STATIC);
        p.setUserId(userId);
        p.setName(req.getName().trim());
        p.setWidth(req.getWidth());
        p.setHeight(req.getHeight());
        p.setSelectedLayerId(req.getSelectedLayerId());
        p.setLayers(req.getLayers().stream().map(dto -> {
            ProjectLayer l = new ProjectLayer();
            l.setId(dto.getId());
            l.setName(dto.getName());
            l.setVisible(dto.isVisible());
            l.setLocked(dto.isLocked());
            l.setPixels(dto.getPixels());
            return l;
        }).toList());
        p.setFrames(null);
        p.setPreviewPng(normalizeDataUrl(req.getPreviewPng()));
        p.setFavorite(Boolean.TRUE.equals(req.getFavorite()));
        p.setCreatedAt(Instant.now());
        p.setUpdatedAt(Instant.now());

        Project saved = repo.save(p);
        return toDetail(saved);
    }

    public ProjectDetailResponse update(String projectId, String userId, SaveProjectRequest req) {
        validateUser(userId);
        validateProjectPayload(req);

        Project p = repo.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("project not found"));
        if (!p.getUserId().equals(userId)) throw new IllegalStateException("forbidden");
        if (p.getKind() != null && p.getKind() != ProjectKind.STATIC)
            throw new IllegalArgumentException("not a static project");

        if (!p.getName().equalsIgnoreCase(req.getName().trim())
                && repo.existsByUserIdAndNameIgnoreCase(userId, req.getName().trim())) {
            throw new DuplicateKeyException("project name already exists");
        }

        p.setKind(ProjectKind.STATIC);
        p.setName(req.getName().trim());
        p.setWidth(req.getWidth());
        p.setHeight(req.getHeight());
        p.setSelectedLayerId(req.getSelectedLayerId());
        p.setLayers(req.getLayers().stream().map(dto -> {
            ProjectLayer l = new ProjectLayer();
            l.setId(dto.getId());
            l.setName(dto.getName());
            l.setVisible(dto.isVisible());
            l.setLocked(dto.isLocked());
            l.setPixels(dto.getPixels());
            return l;
        }).toList());
        p.setFrames(null);
        p.setPreviewPng(normalizeDataUrl(req.getPreviewPng()));
        p.setFavorite(Boolean.TRUE.equals(req.getFavorite()));
        p.setUpdatedAt(Instant.now());

        return toDetail(repo.save(p));
    }

    // ---------- ANIMATION ----------
    public AnimationDetailResponse createAnimation(String userId, SaveAnimationRequest req) {
        validateUser(userId);
        validateAnimationPayload(req);

        if (repo.existsByUserIdAndNameIgnoreCase(userId, req.getName().trim())) {
            throw new DuplicateKeyException("project name already exists");
        }

        Project p = new Project();
        p.setKind(ProjectKind.ANIMATION);
        p.setUserId(userId);
        p.setName(req.getName().trim());
        p.setWidth(req.getWidth());
        p.setHeight(req.getHeight());
        p.setSelectedLayerId(null);
        p.setLayers(null);
        p.setFrames(req.getFrames().stream().map(fdto -> {
            AnimationFrame f = new AnimationFrame();
            f.setId(fdto.getId());
            f.setName(fdto.getName());
            f.setSelectedLayerId(fdto.getSelectedLayerId());
            f.setLayers(fdto.getLayers().stream().map(ldto -> {
                ProjectLayer l = new ProjectLayer();
                l.setId(ldto.getId());
                l.setName(ldto.getName());
                l.setVisible(ldto.isVisible());
                l.setLocked(ldto.isLocked());
                l.setPixels(ldto.getPixels());
                return l;
            }).toList());
            return f;
        }).toList());
        p.setPreviewPng(normalizeDataUrl(req.getPreviewPng()));
        p.setFavorite(Boolean.TRUE.equals(req.getFavorite()));
        p.setCreatedAt(Instant.now());
        p.setUpdatedAt(Instant.now());

        Project saved = repo.save(p);
        return toAnimationDetail(saved);
    }

    public AnimationDetailResponse updateAnimation(String projectId, String userId, SaveAnimationRequest req) {
        validateUser(userId);
        validateAnimationPayload(req);

        Project p = repo.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("project not found"));
        if (!p.getUserId().equals(userId)) throw new IllegalStateException("forbidden");
        if (p.getKind() != null && p.getKind() != ProjectKind.ANIMATION)
            throw new IllegalArgumentException("not an animation project");

        if (!p.getName().equalsIgnoreCase(req.getName().trim())
                && repo.existsByUserIdAndNameIgnoreCase(userId, req.getName().trim())) {
            throw new DuplicateKeyException("project name already exists");
        }

        p.setKind(ProjectKind.ANIMATION);
        p.setName(req.getName().trim());
        p.setWidth(req.getWidth());
        p.setHeight(req.getHeight());
        p.setSelectedLayerId(null);
        p.setLayers(null);
        p.setFrames(req.getFrames().stream().map(fdto -> {
            AnimationFrame f = new AnimationFrame();
            f.setId(fdto.getId());
            f.setName(fdto.getName());
            f.setSelectedLayerId(fdto.getSelectedLayerId());
            f.setLayers(fdto.getLayers().stream().map(ldto -> {
                ProjectLayer l = new ProjectLayer();
                l.setId(ldto.getId());
                l.setName(ldto.getName());
                l.setVisible(ldto.isVisible());
                l.setLocked(ldto.isLocked());
                l.setPixels(ldto.getPixels());
                return l;
            }).toList());
            return f;
        }).toList());
        p.setPreviewPng(normalizeDataUrl(req.getPreviewPng()));
        p.setFavorite(Boolean.TRUE.equals(req.getFavorite()));
        p.setUpdatedAt(Instant.now());

        return toAnimationDetail(repo.save(p));
    }

    public Optional<AnimationDetailResponse> getAnimationByIdForUser(String id, String userId) {
        return repo.findByIdAndUserId(id, userId)
                .filter(p -> (p.getKind() == ProjectKind.ANIMATION))
                .map(this::toAnimationDetail);
    }

    // ---------- SHARED list/get/delete/favorite ----------
    // legacy signature
    public List<ProjectSummaryResponse> listForUser(String userId, Boolean favorite) {
        return listForUser(userId, favorite, null);
    }

    // new: with kind filter ("static" | "animation", case-insensitive)
    public List<ProjectSummaryResponse> listForUser(String userId, Boolean favorite, String kindStr) {
        validateUser(userId);

        ProjectKind kindFilter = parseKind(kindStr); // may be null
        List<Project> rows = (favorite == null)
                ? repo.findAllByUserIdOrderByUpdatedAtDesc(userId)
                : repo.findAllByUserIdAndFavoriteOrderByUpdatedAtDesc(userId, favorite);

        if (kindFilter != null) {
            rows = rows.stream()
                    .filter(p -> (p.getKind() == null ? ProjectKind.STATIC : p.getKind()) == kindFilter)
                    .toList();
        }
        return rows.stream().map(this::toSummary).toList();
    }

    public Optional<ProjectDetailResponse> getByIdForUser(String id, String userId) {
        return repo.findByIdAndUserId(id, userId)
                .filter(p -> (p.getKind() == null || p.getKind() == ProjectKind.STATIC))
                .map(this::toDetail);
    }

    public void deleteForUser(String id, String userId) {
        Project p = repo.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new IllegalArgumentException("project not found"));
        repo.delete(p);
    }

    public ProjectSummaryResponse setFavorite(String id, String userId, boolean favorite) {
        Project p = repo.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new IllegalArgumentException("project not found"));
        p.setFavorite(favorite);
        p.setUpdatedAt(Instant.now());
        return toSummary(repo.save(p));
    }

    // ---------- validators & helpers ----------
    private void validateUser(String userId) {
        if (!StringUtils.hasText(userId)) throw new IllegalArgumentException("userId is required");
        if (!userRepo.existsById(userId)) throw new IllegalArgumentException("user not found");
    }

    private void validateProjectPayload(SaveProjectRequest req) {
        if (!StringUtils.hasText(req.getName())) throw new IllegalArgumentException("name is required");
        if (req.getWidth() <= 0 || req.getHeight() <= 0) throw new IllegalArgumentException("invalid canvas size");
        if (req.getLayers() == null || req.getLayers().isEmpty())
            throw new IllegalArgumentException("at least one layer is required");
    }

    private void validateAnimationPayload(SaveAnimationRequest req) {
        if (!StringUtils.hasText(req.getName())) throw new IllegalArgumentException("name is required");
        if (req.getWidth() <= 0 || req.getHeight() <= 0) throw new IllegalArgumentException("invalid canvas size");
        if (req.getFrames() == null || req.getFrames().isEmpty())
            throw new IllegalArgumentException("at least one frame is required");
        for (SaveAnimationRequest.FrameDto f : req.getFrames()) {
            if (f.getLayers() == null || f.getLayers().isEmpty())
                throw new IllegalArgumentException("each frame must have at least one layer");
        }
    }

    private String normalizeDataUrl(String s) {
        if (s == null) return null;
        return s.trim();
    }

    private ProjectKind parseKind(String s) {
        if (!StringUtils.hasText(s)) return null;
        String v = s.trim().toUpperCase();
        return switch (v) {
            case "STATIC" -> ProjectKind.STATIC;
            case "ANIMATION" -> ProjectKind.ANIMATION;
            default -> throw new IllegalArgumentException("invalid kind");
        };
    }

    // ---------- mappers ----------
    private ProjectSummaryResponse toSummary(Project p) {
        return new ProjectSummaryResponse(
                p.getId(),
                p.getName(),
                p.getWidth(),
                p.getHeight(),
                p.isFavorite(),
                p.getPreviewPng(),
                p.getUpdatedAt()
        );
    }

    private ProjectDetailResponse toDetail(Project p) {
        ProjectDetailResponse r = new ProjectDetailResponse();
        r.setId(p.getId());
        r.setName(p.getName());
        r.setWidth(p.getWidth());
        r.setHeight(p.getHeight());
        r.setSelectedLayerId(p.getSelectedLayerId());
        r.setLayers(p.getLayers());
        r.setFavorite(p.isFavorite());
        r.setPreviewPng(p.getPreviewPng());
        r.setCreatedAt(p.getCreatedAt());
        r.setUpdatedAt(p.getUpdatedAt());
        return r;
    }

    private AnimationDetailResponse toAnimationDetail(Project p) {
        AnimationDetailResponse r = new AnimationDetailResponse();
        r.setId(p.getId());
        r.setName(p.getName());
        r.setWidth(p.getWidth());
        r.setHeight(p.getHeight());
        r.setFrames(p.getFrames());
        r.setFavorite(p.isFavorite());
        r.setPreviewPng(p.getPreviewPng());
        r.setCreatedAt(p.getCreatedAt());
        r.setUpdatedAt(p.getUpdatedAt());
        return r;
    }
}

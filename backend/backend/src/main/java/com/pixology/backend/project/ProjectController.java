package com.pixology.backend.project;

import com.pixology.backend.project.dto.*;
import jakarta.validation.Valid;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects")
public class ProjectController {

    private final ProjectService service;

    public ProjectController(ProjectService service) {
        this.service = service;
    }

    // ---------- STATIC ----------
    // POST /api/projects?userId=...
    @PostMapping
    public ResponseEntity<?> create(@RequestParam String userId,
                                    @Valid @RequestBody SaveProjectRequest req) {
        try {
            ProjectDetailResponse res = service.create(userId, req);
            return ResponseEntity.status(HttpStatus.CREATED).body(res);
        } catch (DuplicateKeyException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("failed to save project");
        }
    }

    // PUT /api/projects/{id}?userId=...
    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable String id,
                                    @RequestParam String userId,
                                    @Valid @RequestBody SaveProjectRequest req) {
        try {
            ProjectDetailResponse res = service.update(id, userId, req);
            return ResponseEntity.ok(res);
        } catch (DuplicateKeyException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("failed to update project");
        }
    }

    // GET /api/projects?userId=...&favorite=true&kind=static|animation
    @GetMapping
    public ResponseEntity<?> list(@RequestParam String userId,
                                  @RequestParam(required = false) Boolean favorite,
                                  @RequestParam(required = false) String kind) {
        try {
            List<ProjectSummaryResponse> list = service.listForUser(userId, favorite, kind);
            return ResponseEntity.ok(list);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // GET /api/projects/{id}?userId=...
    @GetMapping("/{id}")
    public ResponseEntity<?> getOne(@PathVariable String id, @RequestParam String userId) {
        return service.getByIdForUser(id, userId)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body("project not found"));
    }

    // DELETE /api/projects/{id}?userId=...
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable String id, @RequestParam String userId) {
        try {
            service.deleteForUser(id, userId);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

    // PATCH /api/projects/{id}/favorite?userId=...
    public static class FavoriteBody { public boolean favorite; }
    @PatchMapping("/{id}/favorite")
    public ResponseEntity<?> toggleFavorite(@PathVariable String id,
                                            @RequestParam String userId,
                                            @RequestBody FavoriteBody body) {
        try {
            ProjectSummaryResponse res = service.setFavorite(id, userId, body.favorite);
            return ResponseEntity.ok(res);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

    // ---------- ANIMATION ----------
    // POST /api/projects/animations?userId=...
    @PostMapping("/animations")
    public ResponseEntity<?> createAnimation(@RequestParam String userId,
                                             @Valid @RequestBody SaveAnimationRequest req) {
        try {
            AnimationDetailResponse res = service.createAnimation(userId, req);
            return ResponseEntity.status(HttpStatus.CREATED).body(res);
        } catch (DuplicateKeyException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("failed to save animation");
        }
    }

    // PUT /api/projects/animations/{id}?userId=...
    @PutMapping("/animations/{id}")
    public ResponseEntity<?> updateAnimation(@PathVariable String id,
                                             @RequestParam String userId,
                                             @Valid @RequestBody SaveAnimationRequest req) {
        try {
            AnimationDetailResponse res = service.updateAnimation(id, userId, req);
            return ResponseEntity.ok(res);
        } catch (DuplicateKeyException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("failed to update animation");
        }
    }

    // GET /api/projects/animations/{id}?userId=...
    @GetMapping("/animations/{id}")
    public ResponseEntity<?> getOneAnimation(@PathVariable String id, @RequestParam String userId) {
        return service.getAnimationByIdForUser(id, userId)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body("project not found"));
    }

    // GET /api/projects/animations?userId=...&favorite=true
    @GetMapping("/animations")
    public ResponseEntity<?> listAnimations(@RequestParam String userId,
                                            @RequestParam(required = false) Boolean favorite) {
        try {
            List<ProjectSummaryResponse> list = service.listForUser(userId, favorite, "animation");
            return ResponseEntity.ok(list);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}

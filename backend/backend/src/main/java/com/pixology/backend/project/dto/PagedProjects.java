package com.pixology.backend.project.dto;

import java.util.List;

public class PagedProjects {
    private List<ProjectSummaryResponse> items;
    private long total;
    private int page;
    private int size;
    private boolean hasNext;

    public PagedProjects() {}

    public PagedProjects(List<ProjectSummaryResponse> items, long total, int page, int size, boolean hasNext) {
        this.items = items;
        this.total = total;
        this.page = page;
        this.size = size;
        this.hasNext = hasNext;
    }

    public List<ProjectSummaryResponse> getItems() { return items; }
    public long getTotal() { return total; }
    public int getPage() { return page; }
    public int getSize() { return size; }
    public boolean isHasNext() { return hasNext; }

    public void setItems(List<ProjectSummaryResponse> items) { this.items = items; }
    public void setTotal(long total) { this.total = total; }
    public void setPage(int page) { this.page = page; }
    public void setSize(int size) { this.size = size; }
    public void setHasNext(boolean hasNext) { this.hasNext = hasNext; }
}

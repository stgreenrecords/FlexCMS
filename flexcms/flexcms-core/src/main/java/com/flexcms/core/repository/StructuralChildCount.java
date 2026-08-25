package com.flexcms.core.repository;

/**
 * How many structural children (pages, containers, fragments) sit under one path.
 *
 * <p>Backs the content tree's expandable indicator. Without it the tree cannot show which
 * rows can be opened: the children listing reports every row's own {@code children} as
 * empty and carries no count, so an author had no way to tell a page with six child pages
 * from a leaf without clicking it.</p>
 *
 * @param parentPath the parent path these children belong to
 * @param childCount number of structural children directly under it
 */
public record StructuralChildCount(String parentPath, long childCount) {
}

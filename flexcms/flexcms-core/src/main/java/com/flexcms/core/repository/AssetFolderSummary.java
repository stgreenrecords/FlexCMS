package com.flexcms.core.repository;

/**
 * One DAM folder and how many assets sit directly inside it.
 *
 * <p>There is no folder table: a DAM folder exists only as the prefix of the asset
 * paths stored beneath it, so the folder list is derived by grouping
 * {@code assets.folder_path}. A consequence worth knowing is that a folder holding
 * no assets has nothing to derive it from and therefore does not appear — intermediate
 * folders are reconstructed by the caller from the segments of the paths that do.</p>
 *
 * @param path       full folder path, e.g. {@code /content/dam/tut-usa/heroes}
 * @param assetCount assets directly in that folder, excluding its subfolders
 */
public record AssetFolderSummary(String path, Long assetCount) {}

package com.flexcms.dam.service;

/**
 * What the public delivery endpoint needs to serve one asset binary: where it lives, what it
 * is, and a validator for conditional requests. Resolved by {@link AssetDeliveryService}.
 *
 * @param bucket     object-store bucket holding the binary
 * @param storageKey object key inside {@code bucket}; comes from the database, never from the request
 * @param mimeType   content type to serve
 * @param fileSize   size in bytes, or {@code null} when unknown
 * @param etag       quoted strong entity tag, changes whenever the served bytes change
 */
public record DeliverableAsset(String bucket, String storageKey, String mimeType, Long fileSize, String etag) {
}

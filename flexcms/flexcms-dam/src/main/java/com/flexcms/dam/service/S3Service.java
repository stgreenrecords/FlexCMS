package com.flexcms.dam.service;

import io.minio.*;
import io.minio.errors.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.io.ByteArrayInputStream;
import java.io.InputStream;

/**
 * Service for S3-compatible object storage operations (MinIO / AWS S3).
 */
@Service
public class S3Service {

    private static final Logger log = LoggerFactory.getLogger(S3Service.class);

    @Autowired
    private MinioClient minioClient;

    @Value("${flexcms.dam.s3.bucket:flexcms-assets}")
    private String defaultBucket;

    @PostConstruct
    public void init() {
        try {
            boolean exists = minioClient.bucketExists(BucketExistsArgs.builder().bucket(defaultBucket).build());
            if (!exists) {
                minioClient.makeBucket(MakeBucketArgs.builder().bucket(defaultBucket).build());
                log.info("Created S3 bucket: {}", defaultBucket);
            }
        } catch (Exception e) {
            log.warn("Could not initialize S3 bucket '{}': {}", defaultBucket, e.getMessage());
        }
    }

    /**
     * Upload a file to S3.
     */
    public void upload(String key, byte[] data, String contentType) {
        upload(defaultBucket, key, data, contentType);
    }

    public void upload(String bucket, String key, byte[] data, String contentType) {
        try {
            minioClient.putObject(PutObjectArgs.builder()
                    .bucket(bucket)
                    .object(key)
                    .stream(new ByteArrayInputStream(data), data.length, -1)
                    .contentType(contentType)
                    .build());
            log.debug("Uploaded object: {}/{} ({} bytes)", bucket, key, data.length);
        } catch (Exception e) {
            throw new RuntimeException("Failed to upload to S3: " + key, e);
        }
    }

    /**
     * Upload a stream to S3.
     */
    public void upload(String key, InputStream stream, long size, String contentType) {
        try {
            minioClient.putObject(PutObjectArgs.builder()
                    .bucket(defaultBucket)
                    .object(key)
                    .stream(stream, size, -1)
                    .contentType(contentType)
                    .build());
        } catch (Exception e) {
            throw new RuntimeException("Failed to upload stream to S3: " + key, e);
        }
    }

    /**
     * Download a file from S3.
     */
    public byte[] download(String key) {
        return download(defaultBucket, key);
    }

    public byte[] download(String bucket, String key) {
        try (InputStream stream = minioClient.getObject(GetObjectArgs.builder()
                .bucket(bucket)
                .object(key)
                .build())) {
            return stream.readAllBytes();
        } catch (Exception e) {
            throw new RuntimeException("Failed to download from S3: " + key, e);
        }
    }

    /**
     * Download as string.
     */
    public String downloadAsString(String key) {
        return new String(download(key));
    }

    /**
     * Delete an object from S3.
     */
    public void delete(String key) {
        try {
            minioClient.removeObject(RemoveObjectArgs.builder()
                    .bucket(defaultBucket)
                    .object(key)
                    .build());
            log.debug("Deleted object: {}", key);
        } catch (Exception e) {
            throw new RuntimeException("Failed to delete from S3: " + key, e);
        }
    }

    /**
     * Check if an object exists.
     */
    public boolean exists(String key) {
        try {
            minioClient.statObject(StatObjectArgs.builder()
                    .bucket(defaultBucket)
                    .object(key)
                    .build());
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Get a presigned URL for temporary access.
     */
    public String getPresignedUrl(String key, int expirySeconds) {
        try {
            return minioClient.getPresignedObjectUrl(
                    io.minio.GetPresignedObjectUrlArgs.builder()
                            .method(io.minio.http.Method.GET)
                            .bucket(defaultBucket)
                            .object(key)
                            .expiry(expirySeconds)
                            .build());
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate presigned URL: " + key, e);
        }
    }

    public String getDefaultBucket() {
        return defaultBucket;
    }
}


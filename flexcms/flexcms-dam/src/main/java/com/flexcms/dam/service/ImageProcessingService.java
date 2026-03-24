package com.flexcms.dam.service;

import org.imgscalr.Scalr;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.*;

/**
 * Image processing service for generating renditions (resize, crop, format conversion).
 */
@Service
public class ImageProcessingService {

    private static final Logger log = LoggerFactory.getLogger(ImageProcessingService.class);

    /**
     * Resize an image to fit within the given dimensions while maintaining aspect ratio.
     */
    public byte[] resize(byte[] imageData, int targetWidth, int targetHeight, String outputFormat, int quality) {
        try {
            BufferedImage original = ImageIO.read(new ByteArrayInputStream(imageData));
            if (original == null) {
                throw new IllegalArgumentException("Unable to decode image data");
            }

            BufferedImage resized;
            if (targetHeight > 0) {
                resized = Scalr.resize(original, Scalr.Method.QUALITY, Scalr.Mode.FIT_EXACT,
                        targetWidth, targetHeight);
            } else {
                resized = Scalr.resize(original, Scalr.Method.QUALITY, Scalr.Mode.FIT_TO_WIDTH,
                        targetWidth);
            }

            return writeImage(resized, mapFormat(outputFormat));
        } catch (IOException e) {
            throw new RuntimeException("Failed to resize image", e);
        }
    }

    /**
     * Crop an image to cover the given dimensions (center crop).
     */
    public byte[] cropToFill(byte[] imageData, int targetWidth, int targetHeight, String outputFormat) {
        try {
            BufferedImage original = ImageIO.read(new ByteArrayInputStream(imageData));
            if (original == null) {
                throw new IllegalArgumentException("Unable to decode image data");
            }

            // Scale to fill, then center crop
            double scaleX = (double) targetWidth / original.getWidth();
            double scaleY = (double) targetHeight / original.getHeight();
            double scale = Math.max(scaleX, scaleY);

            int scaledWidth = (int) (original.getWidth() * scale);
            int scaledHeight = (int) (original.getHeight() * scale);

            BufferedImage scaled = Scalr.resize(original, Scalr.Method.QUALITY,
                    Scalr.Mode.FIT_EXACT, scaledWidth, scaledHeight);

            int cropX = (scaledWidth - targetWidth) / 2;
            int cropY = (scaledHeight - targetHeight) / 2;

            BufferedImage cropped = Scalr.crop(scaled, cropX, cropY, targetWidth, targetHeight);

            return writeImage(cropped, mapFormat(outputFormat));
        } catch (IOException e) {
            throw new RuntimeException("Failed to crop image", e);
        }
    }

    /**
     * Get image dimensions.
     */
    public ImageDimensions getDimensions(byte[] imageData) {
        try {
            BufferedImage image = ImageIO.read(new ByteArrayInputStream(imageData));
            if (image == null) return null;
            return new ImageDimensions(image.getWidth(), image.getHeight());
        } catch (IOException e) {
            return null;
        }
    }

    private byte[] writeImage(BufferedImage image, String format) throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(image, format, baos);
        return baos.toByteArray();
    }

    private String mapFormat(String format) {
        if (format == null) return "jpeg";
        return switch (format.toLowerCase()) {
            case "webp" -> "webp";
            case "png" -> "png";
            case "gif" -> "gif";
            default -> "jpeg";
        };
    }

    public record ImageDimensions(int width, int height) {
        public double aspectRatio() {
            return height > 0 ? (double) width / height : 0;
        }
    }
}


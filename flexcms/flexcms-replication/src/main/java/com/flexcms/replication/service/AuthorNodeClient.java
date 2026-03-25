package com.flexcms.replication.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.Map;
import java.util.Optional;

/**
 * HTTP client for fetching content node data from the author instance.
 *
 * <p>Used by {@link ReplicationReceiver} during tree activation events,
 * where the RabbitMQ event carries only the affected path list — not the
 * full node payload. Each node must be pulled from the author's REST API.</p>
 *
 * <p>Configured via {@code flexcms.author.base-url} (defaults to localhost:8080).</p>
 */
@Component
public class AuthorNodeClient {

    private static final Logger log = LoggerFactory.getLogger(AuthorNodeClient.class);

    private static final String NODE_ENDPOINT = "/api/author/content/node";

    @Value("${flexcms.author.base-url:http://localhost:8080}")
    private String authorBaseUrl;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public AuthorNodeClient(ObjectMapper objectMapper) {
        this.restTemplate = new RestTemplate();
        this.objectMapper = objectMapper;
    }

    /**
     * Fetch a content node from the author instance by path.
     *
     * @param path content path (ltree format, e.g. {@code content.site.en.home})
     * @return deserialized node data map, or empty if the node could not be fetched
     */
    public Optional<Map<String, Object>> fetchNode(String path) {
        String url = authorBaseUrl + NODE_ENDPOINT + "?path=" + encodePathParam(path);
        try {
            String json = restTemplate.getForObject(url, String.class);
            if (json == null) {
                log.warn("Empty response fetching node from author: {}", path);
                return Optional.empty();
            }
            Map<String, Object> node = objectMapper.readValue(json, new TypeReference<>() {});
            return Optional.of(node);
        } catch (RestClientException e) {
            log.error("HTTP error fetching node '{}' from author at {}: {}", path, url, e.getMessage());
            return Optional.empty();
        } catch (Exception e) {
            log.error("Failed to parse node '{}' from author response: {}", path, e.getMessage());
            return Optional.empty();
        }
    }

    private String encodePathParam(String path) {
        // Minimal encoding — dots are safe in query params, but spaces and special chars need encoding
        return path.replace(" ", "%20");
    }
}

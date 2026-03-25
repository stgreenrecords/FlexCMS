package com.flexcms.cdn.provider;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.lang.reflect.Field;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests for CloudflareCdnProvider — mocks WebClient to avoid real HTTP calls.
 */
@ExtendWith(MockitoExtension.class)
@SuppressWarnings("unchecked")
class CloudflareCdnProviderTest {

    // WebClient fluent chain mocks
    @Mock private WebClient webClient;
    @Mock private WebClient.RequestBodyUriSpec requestBodyUriSpec;
    @Mock private WebClient.RequestBodySpec requestBodySpec;
    @Mock private WebClient.RequestHeadersSpec requestHeadersSpec;
    @Mock private WebClient.ResponseSpec responseSpec;

    private CloudflareCdnProvider provider;
    private CloudflareCdnProvider.CloudflareProperties props;

    @BeforeEach
    void setUp() throws Exception {
        props = new CloudflareCdnProvider.CloudflareProperties();
        props.setZoneId("zone123");
        props.setApiToken("test-token");
        props.setBaseUrl("https://example.com");
        props.setBatchSize(30);

        provider = new CloudflareCdnProvider(props);

        // Inject mock WebClient directly (bypass @PostConstruct which calls WebClient.builder())
        Field f = CloudflareCdnProvider.class.getDeclaredField("webClient");
        f.setAccessible(true);
        f.set(provider, webClient);

        // Set up WebClient fluent chain stubs
        org.mockito.Mockito.lenient().when(webClient.post()).thenReturn(requestBodyUriSpec);
        org.mockito.Mockito.lenient()
                .when(requestBodyUriSpec.uri(any(String.class), any(String.class)))
                .thenReturn(requestBodySpec);
        org.mockito.Mockito.lenient().when(requestBodySpec.bodyValue(any()))
                .thenReturn(requestHeadersSpec);
        org.mockito.Mockito.lenient().when(requestHeadersSpec.retrieve()).thenReturn(responseSpec);
        // bodyToMono returns a real Mono; doOnError/block chain runs on it without further stubbing
        org.mockito.Mockito.lenient().when(responseSpec.bodyToMono(String.class))
                .thenReturn(Mono.just("{\"success\":true}"));
    }

    @Test
    void providerName_isCloudflare() {
        assertThat(provider.getProviderName()).isEqualTo("cloudflare");
    }

    // -------------------------------------------------------------------------
    // purgeUrls
    // -------------------------------------------------------------------------

    @Test
    void purgeUrls_sendsSingleBatchForSmallList() {
        provider.purgeUrls(List.of("https://example.com/p1", "https://example.com/p2"));

        ArgumentCaptor<Map<String, Object>> bodyCaptor = ArgumentCaptor.forClass(Map.class);
        verify(requestBodySpec).bodyValue(bodyCaptor.capture());
        Map<String, Object> body = bodyCaptor.getValue();
        assertThat(body).containsKey("files");
        List<String> files = (List<String>) body.get("files");
        assertThat(files).containsExactlyInAnyOrder(
                "https://example.com/p1", "https://example.com/p2");
    }

    @Test
    void purgeUrls_batchesLargeList() {
        // 35 URLs with batchSize=30 → 2 requests
        List<String> urls = new java.util.ArrayList<>();
        for (int i = 0; i < 35; i++) urls.add("https://example.com/p" + i);

        provider.purgeUrls(urls);

        verify(requestBodySpec, times(2)).bodyValue(any());
    }

    @Test
    void purgeUrls_skipsEmptyList() {
        provider.purgeUrls(List.of());
        verify(webClient, org.mockito.Mockito.never()).post();
    }

    // -------------------------------------------------------------------------
    // purgePaths
    // -------------------------------------------------------------------------

    @Test
    void purgePaths_prependsBaseUrlToRelativePaths() {
        provider.purgePaths(List.of("/blog/post-1", "/products/x"));

        ArgumentCaptor<Map<String, Object>> bodyCaptor = ArgumentCaptor.forClass(Map.class);
        verify(requestBodySpec).bodyValue(bodyCaptor.capture());
        List<String> files = (List<String>) bodyCaptor.getValue().get("files");
        assertThat(files).containsExactlyInAnyOrder(
                "https://example.com/blog/post-1",
                "https://example.com/products/x");
    }

    @Test
    void purgePaths_doesNotPrependBaseUrlToAbsoluteUrls() {
        provider.purgePaths(List.of("https://cdn.example.com/video.mp4"));

        ArgumentCaptor<Map<String, Object>> bodyCaptor = ArgumentCaptor.forClass(Map.class);
        verify(requestBodySpec).bodyValue(bodyCaptor.capture());
        List<String> files = (List<String>) bodyCaptor.getValue().get("files");
        assertThat(files).containsExactly("https://cdn.example.com/video.mp4");
    }

    // -------------------------------------------------------------------------
    // purgeAll
    // -------------------------------------------------------------------------

    @Test
    void purgeAll_sendsPurgeEverythingTrue() {
        provider.purgeAll("corporate");

        ArgumentCaptor<Map<String, Object>> bodyCaptor = ArgumentCaptor.forClass(Map.class);
        verify(requestBodySpec).bodyValue(bodyCaptor.capture());
        assertThat(bodyCaptor.getValue()).containsEntry("purge_everything", true);
    }

    // -------------------------------------------------------------------------
    // purgeSurrogateKeys
    // -------------------------------------------------------------------------

    @Test
    void purgeSurrogateKeys_sendsTags() {
        provider.purgeSurrogateKeys(List.of("tag:blog", "tag:homepage"));

        ArgumentCaptor<Map<String, Object>> bodyCaptor = ArgumentCaptor.forClass(Map.class);
        verify(requestBodySpec).bodyValue(bodyCaptor.capture());
        List<String> tags = (List<String>) bodyCaptor.getValue().get("tags");
        assertThat(tags).containsExactlyInAnyOrder("tag:blog", "tag:homepage");
    }

    @Test
    void purgeSurrogateKeys_batchesLargeTagList() {
        props.setBatchSize(2);
        List<String> tags = List.of("t1", "t2", "t3", "t4", "t5");

        provider.purgeSurrogateKeys(tags);

        // 5 tags with batchSize=2 → 3 requests (2+2+1)
        verify(requestBodySpec, times(3)).bodyValue(any());
    }

    @Test
    void purgeSurrogateKeys_skipsEmptyList() {
        provider.purgeSurrogateKeys(List.of());
        verify(webClient, org.mockito.Mockito.never()).post();
    }
}

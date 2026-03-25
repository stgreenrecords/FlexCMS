package com.flexcms.cdn.provider;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import software.amazon.awssdk.services.cloudfront.CloudFrontClient;
import software.amazon.awssdk.services.cloudfront.model.CreateInvalidationRequest;
import software.amazon.awssdk.services.cloudfront.model.CreateInvalidationResponse;

import java.lang.reflect.Field;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests for CloudFrontCdnProvider — mocks the AWS SDK client.
 */
@ExtendWith(MockitoExtension.class)
class CloudFrontCdnProviderTest {

    @Mock
    private CloudFrontClient cloudFrontClient;

    private CloudFrontCdnProvider provider;

    @BeforeEach
    void setUp() throws Exception {
        CloudFrontCdnProvider.CloudFrontProperties props = new CloudFrontCdnProvider.CloudFrontProperties();
        props.setDistributionId("E1TESTDISTRIBUTION");
        props.setRegion("us-east-1");

        provider = new CloudFrontCdnProvider(props);

        // Inject mock CloudFrontClient directly (bypass @PostConstruct which connects to AWS)
        Field clientField = CloudFrontCdnProvider.class.getDeclaredField("client");
        clientField.setAccessible(true);
        clientField.set(provider, cloudFrontClient);

        org.mockito.Mockito.lenient()
                .when(cloudFrontClient.createInvalidation(any(CreateInvalidationRequest.class)))
                .thenReturn(CreateInvalidationResponse.builder().build());
    }

    @Test
    void providerName_isCloudFront() {
        assertThat(provider.getProviderName()).isEqualTo("cloudfront");
    }

    // -------------------------------------------------------------------------
    // purgeUrls
    // -------------------------------------------------------------------------

    @Test
    void purgeUrls_createsInvalidationWithExtractedPaths() {
        provider.purgeUrls(List.of(
                "https://d123.cloudfront.net/blog/post-1",
                "https://d123.cloudfront.net/blog/post-2"));

        ArgumentCaptor<CreateInvalidationRequest> captor =
                ArgumentCaptor.forClass(CreateInvalidationRequest.class);
        verify(cloudFrontClient).createInvalidation(captor.capture());

        CreateInvalidationRequest req = captor.getValue();
        assertThat(req.distributionId()).isEqualTo("E1TESTDISTRIBUTION");
        assertThat(req.invalidationBatch().paths().items())
                .containsExactlyInAnyOrder("/blog/post-1", "/blog/post-2");
    }

    @Test
    void purgeUrls_skipsEmptyList() {
        provider.purgeUrls(List.of());
        verify(cloudFrontClient, org.mockito.Mockito.never())
                .createInvalidation(any(CreateInvalidationRequest.class));
    }

    @Test
    void purgeUrls_ensuresLeadingSlash() {
        provider.purgeUrls(List.of("blog/post-1"));

        ArgumentCaptor<CreateInvalidationRequest> captor =
                ArgumentCaptor.forClass(CreateInvalidationRequest.class);
        verify(cloudFrontClient).createInvalidation(captor.capture());
        assertThat(captor.getValue().invalidationBatch().paths().items())
                .containsExactly("/blog/post-1");
    }

    // -------------------------------------------------------------------------
    // purgePaths
    // -------------------------------------------------------------------------

    @Test
    void purgePaths_sendsWildcardPatterns() {
        provider.purgePaths(List.of("/blog/*", "/products/*"));

        ArgumentCaptor<CreateInvalidationRequest> captor =
                ArgumentCaptor.forClass(CreateInvalidationRequest.class);
        verify(cloudFrontClient).createInvalidation(captor.capture());
        assertThat(captor.getValue().invalidationBatch().paths().items())
                .containsExactlyInAnyOrder("/blog/*", "/products/*");
    }

    // -------------------------------------------------------------------------
    // purgeAll
    // -------------------------------------------------------------------------

    @Test
    void purgeAll_createsWildcardInvalidation() {
        provider.purgeAll("corporate");

        ArgumentCaptor<CreateInvalidationRequest> captor =
                ArgumentCaptor.forClass(CreateInvalidationRequest.class);
        verify(cloudFrontClient).createInvalidation(captor.capture());
        assertThat(captor.getValue().invalidationBatch().paths().items())
                .containsExactly("/*");
    }

    // -------------------------------------------------------------------------
    // purgeSurrogateKeys
    // -------------------------------------------------------------------------

    @Test
    void purgeSurrogateKeys_withFallbackEnabled_createsWildcardInvalidation() throws Exception {
        CloudFrontCdnProvider.CloudFrontProperties props = new CloudFrontCdnProvider.CloudFrontProperties();
        props.setDistributionId("E1TEST");
        props.setFallbackFullPurgeOnSurrogateKey(true);
        CloudFrontCdnProvider prov = new CloudFrontCdnProvider(props);
        Field f = CloudFrontCdnProvider.class.getDeclaredField("client");
        f.setAccessible(true);
        f.set(prov, cloudFrontClient);

        prov.purgeSurrogateKeys(List.of("tag:blog", "tag:homepage"));

        ArgumentCaptor<CreateInvalidationRequest> captor =
                ArgumentCaptor.forClass(CreateInvalidationRequest.class);
        verify(cloudFrontClient).createInvalidation(captor.capture());
        assertThat(captor.getValue().invalidationBatch().paths().items()).containsExactly("/*");
    }

    @Test
    void purgeSurrogateKeys_withFallbackDisabled_doesNotCallApi() {
        provider.purgeSurrogateKeys(List.of("tag:blog"));
        verify(cloudFrontClient, org.mockito.Mockito.never())
                .createInvalidation(any(CreateInvalidationRequest.class));
    }

    @Test
    void purgeSurrogateKeys_withEmptyList_doesNothing() {
        provider.purgeSurrogateKeys(List.of());
        verify(cloudFrontClient, org.mockito.Mockito.never())
                .createInvalidation(any(CreateInvalidationRequest.class));
    }

    // -------------------------------------------------------------------------
    // De-duplication
    // -------------------------------------------------------------------------

    @Test
    void purgePaths_deduplicatesPaths() {
        provider.purgePaths(List.of("/blog/post-1", "/blog/post-1", "/products/x"));

        ArgumentCaptor<CreateInvalidationRequest> captor =
                ArgumentCaptor.forClass(CreateInvalidationRequest.class);
        verify(cloudFrontClient).createInvalidation(captor.capture());
        assertThat(captor.getValue().invalidationBatch().paths().items()).hasSize(2);
    }
}

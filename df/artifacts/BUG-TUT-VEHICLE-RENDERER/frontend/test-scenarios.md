# Test scenarios

1. Product-card authored fields render as user-facing UI rather than a contract/debug block.
2. Product-card image uses the authored asset URL and accessible product-name alt text.
3. Numeric price is formatted for display.
4. Product-card CTA uses the authored label and URL.
5. Product-card output contains no raw `<pre>` contract metadata.
6. Pricing-table renders title, billing state, plans, prices, features, and highlighted plan.
7. Plan-card renders badge, price, features, and CTA link.
8. Offer-card renders title, offer code, expiry, description, and CTA link.
9. Every unmapped CTA-group contract resolves to the semantic campaign renderer rather than the generic metadata renderer.
10. Course catalog renders title, search state, filters, and authored courses.
11. Resource list renders authored download links.
12. FAQ renders authored questions without contract metadata.
13. Unmapped Education contracts resolve to the semantic learning renderer.

Automated coverage: `src/components/__tests__/tutVehiclesRenderers.test.tsx`, `src/components/__tests__/tutCampaignRenderers.test.tsx`, `src/components/__tests__/tutLearningRenderers.test.tsx`, and `src/components/__tests__/tutGroupedRenderers.test.tsx`.


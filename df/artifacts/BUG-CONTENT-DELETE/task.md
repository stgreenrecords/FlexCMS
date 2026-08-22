# BUG-CONTENT-DELETE — Content node deletion fails for every node

## Summary

- Priority: P0
- Type: Bug
- Owner role/lane: `backend-dev`
- Source: `REB-19` blocker B-7 (`df/artifacts/REB-19/devops/blockers.md`)

## Goal

Make `DELETE /api/author/content/node` actually delete a node and its descendants,
so content can be removed and test suites can clean up their fixtures.

## Defect

`ContentNodeRepository.deleteSubtree(String pathPrefix)` is a native `DELETE`
`@Query` with **no `@Modifying`** annotation. Spring Data therefore executes it as
a query instead of an update, and PostgreSQL reports
`No results were returned by the query.`

`ContentNodeService.delete(path, userId)` routes every deletion through
`deleteSubtree`, so leaf deletes, subtree deletes, `bulkDelete`, and every UI
delete path all return HTTP 500.

Observed:

```
DELETE /api/author/content/node?path=content.tut-usa.reb19-probe&userId=admin
-> 500 INTERNAL_SERVER_ERROR
JpaSystemException: JDBC exception executing SQL [No results were returned by the query.]
  [DELETE FROM content_nodes WHERE path::text LIKE ? || '%']
```

## Impact

- No content can be deleted through the API at all.
- Selenium fixtures accumulate permanently: `content.tut-usa.reb18-e2e-*` pages had
  already built up before REB-19, and REB-26 will create fixture pages for 406
  components with no way to clean them up.

## Read first

- `flexcms/flexcms-core/src/main/java/com/flexcms/core/repository/ContentNodeRepository.java`
- `flexcms/flexcms-core/src/main/java/com/flexcms/core/service/ContentNodeService.java`
- `df/artifacts/REB-19/devops/blockers.md` (B-7)

## Deliverables

- `@Modifying` on the subtree delete query so it executes as an update.
- Prefix matching that cannot delete sibling paths that merely share a name prefix.
- Unit/integration coverage for delete-with-descendants and the sibling-prefix case.

## Acceptance criteria

- AC1: `DELETE /api/author/content/node` returns 2xx and removes the node.
- AC2: Deleting a page removes all of its descendant component nodes.
- AC3: Deleting `content.site.page` does **not** delete `content.site.page-two`.
- AC4: Deleting a non-existent path does not fail the caller with a 500.
- AC5: New tests cover each of the above and the full backend suite stays green.

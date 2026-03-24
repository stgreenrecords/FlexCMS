package com.flexcms.search.repository;

import com.flexcms.search.document.ContentNodeDocument;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.elasticsearch.annotations.Query;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ContentSearchRepository extends ElasticsearchRepository<ContentNodeDocument, String> {

    Page<ContentNodeDocument> findBySiteIdAndLocale(String siteId, String locale, Pageable pageable);

    Page<ContentNodeDocument> findBySiteIdAndLocaleAndResourceType(
            String siteId, String locale, String resourceType, Pageable pageable);

    List<ContentNodeDocument> findByPathStartingWith(String pathPrefix);

    void deleteByPath(String path);

    void deleteBySiteId(String siteId);
}


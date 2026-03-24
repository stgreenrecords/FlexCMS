package com.flexcms.i18n.repository;

import com.flexcms.i18n.model.I18nDictionary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface I18nDictionaryRepository extends JpaRepository<I18nDictionary, UUID> {

    @Query("SELECT d FROM I18nDictionary d WHERE d.key = :key AND d.locale = :locale " +
           "AND (d.siteId = :siteId OR d.siteId IS NULL) ORDER BY d.siteId DESC NULLS LAST")
    List<I18nDictionary> findTranslations(@Param("key") String key,
                                           @Param("locale") String locale,
                                           @Param("siteId") String siteId);

    @Query("SELECT d FROM I18nDictionary d WHERE d.key = :key AND d.locale = :locale " +
           "AND d.siteId IS NULL")
    Optional<I18nDictionary> findGlobalTranslation(@Param("key") String key,
                                                    @Param("locale") String locale);

    List<I18nDictionary> findBySiteIdAndLocale(String siteId, String locale);

    List<I18nDictionary> findByLocale(String locale);

    List<I18nDictionary> findBySiteIdAndLocaleAndContext(String siteId, String locale, String context);

    Optional<I18nDictionary> findBySiteIdAndLocaleAndKey(String siteId, String locale, String key);

    void deleteBySiteIdAndLocale(String siteId, String locale);
}


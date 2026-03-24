package com.flexcms.i18n.repository;

import com.flexcms.i18n.model.LanguageCopy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface LanguageCopyRepository extends JpaRepository<LanguageCopy, UUID> {

    List<LanguageCopy> findBySourcePath(String sourcePath);

    List<LanguageCopy> findByTargetPath(String targetPath);

    Optional<LanguageCopy> findBySourcePathAndTargetLocale(String sourcePath, String targetLocale);

    List<LanguageCopy> findBySourceLocaleAndTargetLocale(String sourceLocale, String targetLocale);

    List<LanguageCopy> findBySyncStatus(LanguageCopy.SyncStatus syncStatus);
}


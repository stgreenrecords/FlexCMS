package com.flexcms.i18n.service;

import com.flexcms.i18n.model.I18nDictionary;
import com.flexcms.i18n.repository.I18nDictionaryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Provides i18n translation lookups with fallback chain:
 * site+exact_locale -> site+language -> global+locale -> global+language -> key itself.
 */
@Service
public class I18nService {

    @Autowired
    private I18nDictionaryRepository dictionaryRepo;

    /**
     * Translate a key for a given locale.
     */
    public String translate(String key, Locale locale) {
        return translate(key, locale, null, null);
    }

    public String translate(String key, Locale locale, String siteId) {
        return translate(key, locale, siteId, null);
    }

    public String translate(String key, Locale locale, String siteId, Map<String, Object> params) {
        String value = resolveTranslation(key, locale, siteId);
        if (value == null) {
            return key;
        }
        if (params != null) {
            for (Map.Entry<String, Object> param : params.entrySet()) {
                value = value.replace("{" + param.getKey() + "}", String.valueOf(param.getValue()));
            }
        }
        return value;
    }

    private String resolveTranslation(String key, Locale locale, String siteId) {
        // 1. Site-specific, exact locale (e.g., fr_CA)
        if (siteId != null) {
            List<I18nDictionary> entries = dictionaryRepo.findTranslations(key, locale.toString(), siteId);
            if (!entries.isEmpty()) return entries.get(0).getValue();

            // 2. Site-specific, language only (e.g., fr)
            if (locale.toString().contains("_")) {
                entries = dictionaryRepo.findTranslations(key, locale.getLanguage(), siteId);
                if (!entries.isEmpty()) return entries.get(0).getValue();
            }
        }

        // 3. Global, exact locale
        var global = dictionaryRepo.findGlobalTranslation(key, locale.toString());
        if (global.isPresent()) return global.get().getValue();

        // 4. Global, language only
        if (locale.toString().contains("_")) {
            global = dictionaryRepo.findGlobalTranslation(key, locale.getLanguage());
            if (global.isPresent()) return global.get().getValue();
        }

        // 5. English fallback
        if (!locale.getLanguage().equals("en")) {
            global = dictionaryRepo.findGlobalTranslation(key, "en");
            if (global.isPresent()) return global.get().getValue();
        }

        return null;
    }

    /**
     * Get all dictionary entries for a site and locale.
     */
    @Cacheable(value = "i18n", key = "#siteId + ':' + #locale")
    public Map<String, String> getDictionary(String siteId, String locale) {
        List<I18nDictionary> entries = dictionaryRepo.findBySiteIdAndLocale(siteId, locale);
        var map = new java.util.LinkedHashMap<String, String>();
        entries.forEach(e -> map.put(e.getKey(), e.getValue()));
        return map;
    }

    /**
     * Set a translation entry.
     */
    @Transactional
    @CacheEvict(value = "i18n", key = "#siteId + ':' + #locale")
    public I18nDictionary setTranslation(String siteId, String locale, String key, String value, String context) {
        var existing = dictionaryRepo.findBySiteIdAndLocaleAndKey(siteId, locale, key);
        if (existing.isPresent()) {
            I18nDictionary entry = existing.get();
            entry.setValue(value);
            if (context != null) entry.setContext(context);
            return dictionaryRepo.save(entry);
        }

        I18nDictionary entry = new I18nDictionary(siteId, locale, key, value);
        entry.setContext(context);
        return dictionaryRepo.save(entry);
    }

    /**
     * Bulk import translations for a locale.
     */
    @Transactional
    @CacheEvict(value = "i18n", key = "#siteId + ':' + #locale")
    public int importTranslations(String siteId, String locale, Map<String, String> translations) {
        int count = 0;
        for (Map.Entry<String, String> entry : translations.entrySet()) {
            setTranslation(siteId, locale, entry.getKey(), entry.getValue(), null);
            count++;
        }
        return count;
    }
}


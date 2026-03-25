package com.flexcms.pim.importer;

import java.util.ArrayList;
import java.util.List;

/**
 * Summary result of a product import job.
 */
public class ImportResult {

    private int created;
    private int updated;
    private int skipped;
    private int failed;
    private final List<String> errors = new ArrayList<>();

    public void incrementCreated() { created++; }
    public void incrementUpdated() { updated++; }
    public void incrementSkipped() { skipped++; }
    public void incrementFailed() { failed++; }
    public void addError(String error) { errors.add(error); }

    public int getCreated() { return created; }
    public int getUpdated() { return updated; }
    public int getSkipped() { return skipped; }
    public int getFailed() { return failed; }
    public int getTotal() { return created + updated + skipped + failed; }
    public List<String> getErrors() { return errors; }
    public boolean hasErrors() { return !errors.isEmpty(); }
}

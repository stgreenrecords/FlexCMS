package com.flexcms.core.model;

import java.util.ArrayList;
import java.util.List;

/**
 * Summary result of a bulk content operation (publish, delete, move).
 */
public class BulkOperationResult {

    private int succeeded;
    private int failed;
    private final List<String> errors = new ArrayList<>();

    public void incrementSucceeded() { succeeded++; }
    public void incrementFailed() { failed++; }
    public void addError(String path, String message) {
        errors.add(path + ": " + message);
        failed++;
    }

    public int getSucceeded() { return succeeded; }
    public int getFailed() { return failed; }
    public int getTotal() { return succeeded + failed; }
    public List<String> getErrors() { return errors; }
    public boolean hasErrors() { return !errors.isEmpty(); }
}

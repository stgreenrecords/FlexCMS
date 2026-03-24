package com.flexcms.plugin.spi;

/**
 * SPI for custom workflow step implementations.
 */
public interface WorkflowStep {

    /**
     * Execute this workflow step.
     *
     * @param context workflow execution context
     * @return result indicating success, failure, or waiting
     */
    WorkflowStepResult execute(WorkflowStepContext context);
}

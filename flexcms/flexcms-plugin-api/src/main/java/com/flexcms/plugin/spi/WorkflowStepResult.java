package com.flexcms.plugin.spi;

public class WorkflowStepResult {

    public enum Status { SUCCESS, FAILURE, WAITING }

    private final Status status;
    private final String message;

    private WorkflowStepResult(Status status, String message) {
        this.status = status;
        this.message = message;
    }

    public static WorkflowStepResult success() {
        return new WorkflowStepResult(Status.SUCCESS, null);
    }

    public static WorkflowStepResult success(String message) {
        return new WorkflowStepResult(Status.SUCCESS, message);
    }

    public static WorkflowStepResult failure(String message) {
        return new WorkflowStepResult(Status.FAILURE, message);
    }

    public static WorkflowStepResult waiting(String message) {
        return new WorkflowStepResult(Status.WAITING, message);
    }

    public Status getStatus() { return status; }
    public String getMessage() { return message; }
    public boolean isSuccess() { return status == Status.SUCCESS; }
}

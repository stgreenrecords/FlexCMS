package com.flexcms.core.repository;

import com.flexcms.core.model.WorkflowInstance;
import com.flexcms.core.model.WorkflowInstance.WorkflowStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WorkflowInstanceRepository extends JpaRepository<WorkflowInstance, UUID> {

    Optional<WorkflowInstance> findByContentPathAndStatus(String contentPath, WorkflowStatus status);

    List<WorkflowInstance> findByCurrentStepIdAndStatus(String stepId, WorkflowStatus status);

    Page<WorkflowInstance> findByStatus(WorkflowStatus status, Pageable pageable);
}

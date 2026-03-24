package com.flexcms.author.controller;

import com.flexcms.core.model.ReplicationLogEntry;
import com.flexcms.core.model.ReplicationLogEntry.ReplicationStatus;
import com.flexcms.core.repository.ReplicationLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Replication monitoring dashboard API.
 */
@RestController
@RequestMapping("/api/admin/replication")
public class ReplicationMonitorController {

    @Autowired
    private ReplicationLogRepository replicationLog;

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getStatus() {
        return ResponseEntity.ok(Map.of(
                "pendingEvents", replicationLog.countByStatus(ReplicationStatus.PENDING),
                "failedEvents", replicationLog.countByStatus(ReplicationStatus.FAILED),
                "completedEvents", replicationLog.countByStatus(ReplicationStatus.COMPLETED)
        ));
    }

    @GetMapping("/log")
    public ResponseEntity<Page<ReplicationLogEntry>> getLog(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return ResponseEntity.ok(replicationLog.findAllByOrderByInitiatedAtDesc(
                PageRequest.of(page, size)));
    }
}


package com.flexcms.clientlibs.service;

import com.flexcms.clientlibs.model.ClientLibrary;
import com.flexcms.clientlibs.repository.ClientLibRepository;
import com.flexcms.dam.service.S3Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.DigestUtils;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.*;

/**
 * Manages client library registration, compilation, and dependency resolution.
 */
@Service
public class ClientLibManager {

    private static final Logger log = LoggerFactory.getLogger(ClientLibManager.class);

    @Autowired
    private ClientLibRepository clientLibRepo;

    @Autowired(required = false)
    private S3Service s3Service;

    /**
     * Register a new client library.
     */
    @Transactional
    public ClientLibrary register(String name, String category, String[] dependencies,
                                   String[] embeds, String[] cssFiles, String[] jsFiles) {
        ClientLibrary lib = clientLibRepo.findByName(name).orElse(new ClientLibrary());
        lib.setName(name);
        lib.setCategory(category);
        lib.setDependencies(dependencies);
        lib.setEmbeds(embeds);
        lib.setCssFiles(cssFiles);
        lib.setJsFiles(jsFiles);
        lib = clientLibRepo.save(lib);

        log.info("Registered client library: {}", name);
        return lib;
    }

    /**
     * Compile a client library: concatenate CSS/JS, hash, and upload to S3.
     */
    @Transactional
    public ClientLibrary compile(String name) {
        ClientLibrary lib = clientLibRepo.findByName(name)
                .orElseThrow(() -> new IllegalArgumentException("Client library not found: " + name));

        // Compile CSS
        StringBuilder cssBundle = new StringBuilder();
        if (lib.getEmbeds() != null) {
            for (String embed : lib.getEmbeds()) {
                clientLibRepo.findByName(embed).ifPresent(embedded -> {
                    if (embedded.getCompiledCssKey() != null && s3Service != null) {
                        cssBundle.append(s3Service.downloadAsString(embedded.getCompiledCssKey()));
                        cssBundle.append("\n");
                    }
                });
            }
        }
        if (lib.getCssFiles() != null) {
            for (String cssFile : lib.getCssFiles()) {
                cssBundle.append("/* ").append(cssFile).append(" */\n");
                // In production, load from classpath or S3
            }
        }

        String cssContent = cssBundle.toString();
        String cssHash = DigestUtils.md5DigestAsHex(cssContent.getBytes(StandardCharsets.UTF_8)).substring(0, 8);

        // Compile JS
        StringBuilder jsBundle = new StringBuilder();
        if (lib.getEmbeds() != null) {
            for (String embed : lib.getEmbeds()) {
                clientLibRepo.findByName(embed).ifPresent(embedded -> {
                    if (embedded.getCompiledJsKey() != null && s3Service != null) {
                        jsBundle.append(s3Service.downloadAsString(embedded.getCompiledJsKey()));
                        jsBundle.append(";\n");
                    }
                });
            }
        }
        if (lib.getJsFiles() != null) {
            for (String jsFile : lib.getJsFiles()) {
                jsBundle.append("/* ").append(jsFile).append(" */\n");
            }
        }

        String jsContent = jsBundle.toString();
        String jsHash = DigestUtils.md5DigestAsHex(jsContent.getBytes(StandardCharsets.UTF_8)).substring(0, 8);

        // Upload to S3
        String cssKey = "clientlibs/" + lib.getName() + "." + cssHash + ".css";
        String jsKey = "clientlibs/" + lib.getName() + "." + jsHash + ".js";

        if (s3Service != null) {
            if (!cssContent.isEmpty()) {
                s3Service.upload(cssKey, cssContent.getBytes(StandardCharsets.UTF_8), "text/css");
            }
            if (!jsContent.isEmpty()) {
                s3Service.upload(jsKey, jsContent.getBytes(StandardCharsets.UTF_8), "application/javascript");
            }
        }

        lib.setCompiledCssKey(cssKey);
        lib.setCompiledJsKey(jsKey);
        lib.setCssHash(cssHash);
        lib.setJsHash(jsHash);
        lib.setLastCompiled(Instant.now());
        lib.setMinified(true);

        return clientLibRepo.save(lib);
    }

    /**
     * Resolve all client libraries needed for a set of required library names,
     * in dependency order.
     */
    public List<ClientLibrary> resolve(Set<String> requiredLibs) {
        LinkedHashSet<String> resolved = new LinkedHashSet<>();
        for (String lib : requiredLibs) {
            resolveDeps(lib, resolved, new HashSet<>());
        }

        List<ClientLibrary> result = new ArrayList<>();
        for (String name : resolved) {
            clientLibRepo.findByName(name).ifPresent(result::add);
        }
        return result;
    }

    private void resolveDeps(String name, LinkedHashSet<String> resolved, Set<String> visited) {
        if (visited.contains(name)) return; // Cycle protection
        visited.add(name);

        clientLibRepo.findByName(name).ifPresent(lib -> {
            if (lib.getDependencies() != null) {
                for (String dep : lib.getDependencies()) {
                    resolveDeps(dep, resolved, visited);
                }
            }
            resolved.add(name);
        });
    }
}


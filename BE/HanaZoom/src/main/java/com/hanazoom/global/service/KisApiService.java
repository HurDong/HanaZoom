package com.hanazoom.global.service;

import com.hanazoom.global.config.KisConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import javax.annotation.PostConstruct;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import org.json.JSONException;

@Slf4j
@Service
@RequiredArgsConstructor
public class KisApiService {

    private final KisConfig kisConfig;
    private final WebClient webClient;
    private static final Path KEY_PATH = Paths.get("kis_keys.json");
    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    @PostConstruct
    public void init() {
        loadKeysFromFile();
        if (!isAccessTokenValid()) {
            issueAccessToken();
        } else if (kisConfig.getApprovalKey() == null) {
            issueApprovalKey();
        }
    }

    private void loadKeysFromFile() {
        if (Files.exists(KEY_PATH)) {
            try {
                String content = new String(Files.readAllBytes(KEY_PATH));
                JSONObject keys = new JSONObject(content);
                if (keys.has("accessToken") && keys.has("approvalKey") && keys.has("issuedAt")) {
                    kisConfig.setAccessToken(keys.getString("accessToken"));
                    kisConfig.setApprovalKey(keys.getString("approvalKey"));
                    log.info("API keys loaded from file.");
                }
            } catch (IOException | JSONException e) {
                log.error("Failed to load API keys from file.", e);
            }
        }
    }

    private void saveKeysToFile() {
        try {
            JSONObject keys = new JSONObject();
            keys.put("accessToken", kisConfig.getAccessToken());
            keys.put("approvalKey", kisConfig.getApprovalKey());
            keys.put("issuedAt", LocalDateTime.now().format(FORMATTER));
            Files.write(KEY_PATH, keys.toString(4).getBytes());
            log.info("API keys saved to file.");
        } catch (IOException e) {
            log.error("Failed to save API keys to file.", e);
        }
    }

    private boolean isAccessTokenValid() {
        if (kisConfig.getAccessToken() == null || !Files.exists(KEY_PATH)) {
            return false;
        }
        try {
            String content = new String(Files.readAllBytes(KEY_PATH));
            JSONObject keys = new JSONObject(content);
            if (keys.has("issuedAt")) {
                LocalDateTime issuedAt = LocalDateTime.parse(keys.getString("issuedAt"), FORMATTER);
                // 유효기간을 23시간으로 보수적으로 설정
                return issuedAt.plusHours(23).isAfter(LocalDateTime.now());
            }
        } catch (Exception e) {
            log.error("Failed to validate access token from file.", e);
        }
        return false;
    }

    @Scheduled(cron = "0 0 2 * * *") // 매일 새벽 2시에 실행
    public void issueAccessToken() {
        log.info("Requesting KIS access token...");
        JSONObject body = new JSONObject();
        body.put("grant_type", "client_credentials");
        body.put("appkey", kisConfig.getAppKey());
        body.put("appsecret", kisConfig.getAppSecret());

        try {
            String response = webClient.post()
                    .uri(kisConfig.getTokenUrl())
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(body.toString())
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            JSONObject responseJson = new JSONObject(response);
            String accessToken = responseJson.getString("access_token");
            kisConfig.setAccessToken(accessToken);
            log.info("KIS Access Token issued successfully.");

            issueApprovalKey();

        } catch (Exception e) {
            log.error("Failed to issue KIS access token", e);
        }
    }

    public void issueApprovalKey() {
        if (kisConfig.getAccessToken() == null) {
            log.warn("Access token is not available. Cannot issue approval key.");
            return;
        }

        log.info("Requesting KIS approval key...");
        JSONObject body = new JSONObject();
        body.put("grant_type", "approval_key");
        body.put("appkey", kisConfig.getAppKey());
        body.put("secretkey", kisConfig.getAppSecret());

        try {
            String response = webClient.post()
                    .uri(kisConfig.getApprovalUrl())
                    .contentType(MediaType.APPLICATION_JSON)
                    .header("authorization", "Bearer " + kisConfig.getAccessToken())
                    .bodyValue(body.toString())
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            JSONObject responseJson = new JSONObject(response);
            String approvalKey = responseJson.getString("approval_key");
            kisConfig.setApprovalKey(approvalKey);
            log.info("KIS Approval Key issued successfully.");

            // 키 발급 성공 시 파일에 저장
            saveKeysToFile();

        } catch (Exception e) {
            log.error("Failed to issue KIS approval key", e);
        }
    }

    public String getRealtimeApprovalKey() {
        if (!isAccessTokenValid() || kisConfig.getApprovalKey() == null) {
            log.warn("Approval key is not available or expired. Trying to issue a new one.");
            issueAccessToken();
        }
        return kisConfig.getApprovalKey();
    }
}
package com.hanazoom.domain.websocket.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/websocket")
public class WebSocketTestController {

    @GetMapping("/test")
    public ResponseEntity<Map<String, Object>> testWebSocketEndpoint() {
        log.info("📡 웹소켓 테스트 엔드포인트 호출됨");
        
        Map<String, Object> response = new HashMap<>();
        response.put("status", "success");
        response.put("message", "웹소켓 서버가 정상 동작 중입니다");
        response.put("endpoints", Map.of(
            "stock_websocket", "/ws/stocks",
            "chat_websocket", "/ws/chat/region"
        ));
        response.put("timestamp", System.currentTimeMillis());
        
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "healthy");
        response.put("server", "running");
        response.put("websocket_enabled", true);
        response.put("timestamp", System.currentTimeMillis());
        
        return ResponseEntity.ok(response);
    }
}

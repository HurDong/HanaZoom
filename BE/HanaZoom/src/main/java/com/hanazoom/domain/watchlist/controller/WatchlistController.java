package com.hanazoom.domain.watchlist.controller;

import com.hanazoom.domain.watchlist.dto.WatchlistRequest;
import com.hanazoom.domain.watchlist.dto.WatchlistResponse;
import com.hanazoom.domain.watchlist.service.WatchlistService;
import com.hanazoom.global.dto.ApiResponse;
import com.hanazoom.domain.member.entity.Member;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/v1/watchlist")
@RequiredArgsConstructor
public class WatchlistController {

    private final WatchlistService watchlistService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<WatchlistResponse>>> getMyWatchlist(
            @AuthenticationPrincipal Member member) {
        try {
            List<WatchlistResponse> watchlist = watchlistService.getMyWatchlist(member);
            return ResponseEntity.ok(ApiResponse.success(watchlist));
        } catch (Exception e) {
            log.error("관심종목 조회 실패", e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<ApiResponse<WatchlistResponse>> addToWatchlist(
            @AuthenticationPrincipal Member member,
            @RequestBody WatchlistRequest request) {
        try {
            WatchlistResponse watchlist = watchlistService.addToWatchlist(member, request);
            return ResponseEntity.ok(ApiResponse.success(watchlist));
        } catch (Exception e) {
            log.error("관심종목 추가 실패", e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @DeleteMapping("/{stockSymbol}")
    public ResponseEntity<ApiResponse<Void>> removeFromWatchlist(
            @AuthenticationPrincipal Member member,
            @PathVariable String stockSymbol) {
        try {
            watchlistService.removeFromWatchlist(member, stockSymbol);
            return ResponseEntity.ok(ApiResponse.success("관심종목에서 제거되었습니다."));
        } catch (Exception e) {
            log.error("관심종목 제거 실패", e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/check/{stockSymbol}")
    public ResponseEntity<ApiResponse<Boolean>> isInWatchlist(
            @AuthenticationPrincipal Member member,
            @PathVariable String stockSymbol) {
        try {
            boolean isInWatchlist = watchlistService.isInWatchlist(member, stockSymbol);
            return ResponseEntity.ok(ApiResponse.success(isInWatchlist));
        } catch (Exception e) {
            log.error("관심종목 확인 실패", e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/{stockSymbol}/alert")
    public ResponseEntity<ApiResponse<WatchlistResponse>> updateAlert(
            @AuthenticationPrincipal Member member,
            @PathVariable String stockSymbol,
            @RequestBody WatchlistRequest request) {
        try {
            WatchlistResponse watchlist = watchlistService.updateAlert(member, stockSymbol, request);
            return ResponseEntity.ok(ApiResponse.success(watchlist));
        } catch (Exception e) {
            log.error("알림 설정 업데이트 실패", e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
}

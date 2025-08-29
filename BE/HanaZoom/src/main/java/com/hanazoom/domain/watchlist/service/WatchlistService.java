package com.hanazoom.domain.watchlist.service;

import com.hanazoom.domain.watchlist.dto.WatchlistRequest;
import com.hanazoom.domain.watchlist.dto.WatchlistResponse;
import com.hanazoom.domain.watchlist.entity.Watchlist;
import com.hanazoom.domain.watchlist.entity.AlertType;
import com.hanazoom.domain.watchlist.repository.WatchlistRepository;
import com.hanazoom.domain.member.entity.Member;
import com.hanazoom.domain.stock.entity.Stock;
import com.hanazoom.domain.stock.service.StockService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class WatchlistService {

    private final WatchlistRepository watchlistRepository;
    private final StockService stockService;

    /**
     * 사용자의 관심종목 목록 조회
     */
    public List<WatchlistResponse> getMyWatchlist(Member member) {
        List<Watchlist> watchlists = watchlistRepository.findByMember_IdAndIsActiveTrue(member.getId());
        return watchlists.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    /**
     * 관심종목 추가
     */
    @Transactional
    public WatchlistResponse addToWatchlist(Member member, WatchlistRequest request) {
        // 이미 관심종목에 있는지 확인
        if (watchlistRepository.existsByMember_IdAndStock_SymbolAndIsActiveTrue(member.getId(),
                request.getStockSymbol())) {
            throw new IllegalArgumentException("이미 관심종목에 등록된 종목입니다.");
        }

        // 주식 정보 조회
        Stock stock = stockService.getStockBySymbol(request.getStockSymbol());

        // 관심종목 생성
        Watchlist watchlist = Watchlist.builder()
                .member(member)
                .stock(stock)
                .alertPrice(request.getAlertPrice())
                .alertType(request.getAlertType())
                .build();

        Watchlist savedWatchlist = watchlistRepository.save(watchlist);
        return convertToResponse(savedWatchlist);
    }

    /**
     * 관심종목 제거
     */
    @Transactional
    public void removeFromWatchlist(Member member, String stockSymbol) {
        watchlistRepository.deactivateByMemberIdAndStockSymbol(member.getId(), stockSymbol);
    }

    /**
     * 특정 종목의 관심종목 여부 확인
     */
    public boolean isInWatchlist(Member member, String stockSymbol) {
        return watchlistRepository.existsByMember_IdAndStock_SymbolAndIsActiveTrue(member.getId(), stockSymbol);
    }

    /**
     * 관심종목 알림 설정 업데이트
     */
    @Transactional
    public WatchlistResponse updateAlert(Member member, String stockSymbol, WatchlistRequest request) {
        Watchlist watchlist = watchlistRepository
                .findByMember_IdAndStock_SymbolAndIsActiveTrue(member.getId(), stockSymbol)
                .orElseThrow(() -> new IllegalArgumentException("관심종목에 등록되지 않은 종목입니다."));

        if (request.getAlertPrice() != null) {
            watchlist.setAlertPrice(request.getAlertPrice());
        }
        if (request.getAlertType() != null) {
            watchlist.setAlertType(request.getAlertType());
        }

        return convertToResponse(watchlist);
    }

    /**
     * Watchlist 엔티티를 Response DTO로 변환
     */
    private WatchlistResponse convertToResponse(Watchlist watchlist) {
        Stock stock = watchlist.getStock();
        return WatchlistResponse.builder()
                .id(watchlist.getId())
                .stockSymbol(stock.getSymbol())
                .stockName(stock.getName())
                .stockLogoUrl(stock.getLogoUrl())
                .currentPrice(stock.getCurrentPrice())
                .priceChange(stock.getPriceChange())
                .priceChangePercent(stock.getPriceChangePercent())
                .alertPrice(watchlist.getAlertPrice())
                .alertType(watchlist.getAlertType())
                .isActive(watchlist.getIsActive())
                .createdAt(watchlist.getCreatedAt())
                .updatedAt(watchlist.getUpdatedAt())
                .build();
    }
}

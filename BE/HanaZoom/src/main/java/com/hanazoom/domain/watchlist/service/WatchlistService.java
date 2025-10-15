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

    public List<WatchlistResponse> getMyWatchlist(Member member) {
        List<Watchlist> watchlists = watchlistRepository.findByMember_IdAndIsActiveTrue(member.getId());
        return watchlists.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public WatchlistResponse addToWatchlist(Member member, WatchlistRequest request) {

        if (watchlistRepository.existsByMember_IdAndStock_SymbolAndIsActiveTrue(member.getId(),
                request.getStockSymbol())) {
            throw new IllegalArgumentException("이미 관심종목에 등록된 종목입니다.");
        }


        Stock stock = stockService.getStockBySymbol(request.getStockSymbol());


        Watchlist watchlist = Watchlist.builder()
                .member(member)
                .stock(stock)
                .alertPrice(request.getAlertPrice())
                .alertType(request.getAlertType())
                .build();

        Watchlist savedWatchlist = watchlistRepository.save(watchlist);
        return convertToResponse(savedWatchlist);
    }

    @Transactional
    public void removeFromWatchlist(Member member, String stockSymbol) {
        watchlistRepository.deactivateByMemberIdAndStockSymbol(member.getId(), stockSymbol);
    }

    public boolean isInWatchlist(Member member, String stockSymbol) {
        return watchlistRepository.existsByMember_IdAndStock_SymbolAndIsActiveTrue(member.getId(), stockSymbol);
    }

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

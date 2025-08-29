package com.hanazoom.domain.stock.service;

import com.hanazoom.domain.stock.dto.OrderBookResponse;
import com.hanazoom.domain.stock.dto.OrderBookItem;
import com.hanazoom.domain.stock.dto.StockBasicInfoResponse;
import com.hanazoom.domain.stock.dto.StockPriceResponse;
import com.hanazoom.domain.stock.dto.StockTickerDto;
import com.hanazoom.domain.stock.entity.Stock;
import com.hanazoom.domain.stock.repository.StockRepository;
import com.hanazoom.global.service.KisApiService;
import com.hanazoom.global.util.MarketTimeUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class StockServiceImpl implements StockService {

        private final StockRepository stockRepository;
        private final KisApiService kisApiService;
        private final MarketTimeUtils marketTimeUtils;

        @Override
        @Transactional(readOnly = true)
        public Stock getStockBySymbol(String symbol) {
                return stockRepository.findBySymbol(symbol)
                                .orElseThrow(() -> new IllegalArgumentException("주식을 찾을 수 없습니다."));
        }

        @Override
        @Transactional(readOnly = true)
        public List<StockTickerDto> getStockTickers() {
                return stockRepository.findAll().stream()
                                .map(stock -> StockTickerDto.builder()
                                                // 기존 필드명
                                                .symbol(stock.getSymbol())
                                                .name(stock.getName())
                                                .price(stock.getCurrentPrice() != null
                                                                ? stock.getCurrentPrice().toString()
                                                                : "0")
                                                .change(stock.getPriceChangePercent() != null
                                                                ? stock.getPriceChangePercent().toString()
                                                                : "0")
                                                .logoUrl(stock.getLogoUrl())
                                                .sector(stock.getSector() != null ? stock.getSector() : "기타")
                                                // 프론트엔드에서 기대하는 필드명
                                                .stockCode(stock.getSymbol())
                                                .stockName(stock.getName())
                                                .currentPrice(stock.getCurrentPrice() != null
                                                                ? stock.getCurrentPrice().toString()
                                                                : "0")
                                                .priceChange(stock.getPriceChange() != null
                                                                ? stock.getPriceChange().toString()
                                                                : "0")
                                                .changeRate(stock.getPriceChangePercent() != null
                                                                ? stock.getPriceChangePercent().toString()
                                                                : "0")
                                                .build())
                                .collect(Collectors.toList());
        }

        @Override
        @Transactional(readOnly = true)
        public List<StockTickerDto> searchStocks(String query) {
                return stockRepository.findByNameContainingOrSymbolContaining(query, query).stream()
                                .limit(10)
                                .map(stock -> StockTickerDto.builder()
                                                // 기존 필드명
                                                .symbol(stock.getSymbol())
                                                .name(stock.getName())
                                                .price(stock.getCurrentPrice() != null
                                                                ? stock.getCurrentPrice().toString()
                                                                : "0")
                                                .change(stock.getPriceChangePercent() != null
                                                                ? stock.getPriceChangePercent().toString()
                                                                : "0")
                                                .logoUrl(stock.getLogoUrl())
                                                .sector(stock.getSector() != null ? stock.getSector() : "기타")
                                                // 프론트엔드에서 기대하는 필드명
                                                .stockCode(stock.getSymbol())
                                                .stockName(stock.getName())
                                                .currentPrice(stock.getCurrentPrice() != null
                                                                ? stock.getCurrentPrice().toString()
                                                                : "0")
                                                .priceChange(stock.getPriceChange() != null
                                                                ? stock.getPriceChange().toString()
                                                                : "0")
                                                .changeRate(stock.getPriceChangePercent() != null
                                                                ? stock.getPriceChangePercent().toString()
                                                                : "0")
                                                .build())
                                .collect(Collectors.toList());
        }

        @Override
        @Transactional(readOnly = true)
        public Page<StockTickerDto> getAllStocks(Pageable pageable) {
                try {
                        log.info("getAllStocks 호출됨 - pageable: {}", pageable);

                        // 정렬 필드 검증 및 수정
                        Sort sort = pageable.getSort();
                        if (sort.isSorted()) {
                                Sort.Order order = sort.iterator().next();
                                String property = order.getProperty();
                                log.info("정렬 필드: {}", property);

                                // 정렬 필드가 엔티티에 존재하지 않는 경우 기본값으로 설정
                                if (!isValidSortField(property)) {
                                        log.warn("유효하지 않은 정렬 필드: {}, 기본값 'symbol'으로 변경", property);
                                        sort = Sort.by(order.getDirection(), "symbol");
                                        pageable = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(),
                                                        sort);
                                }
                        }

                        // 전체 데이터 개수 확인
                        long totalCount = stockRepository.count();
                        log.info("전체 주식 데이터 개수: {}", totalCount);

                        if (totalCount == 0) {
                                log.warn("데이터베이스에 주식 데이터가 없습니다");
                                throw new RuntimeException("데이터베이스에 주식 데이터가 없습니다");
                        }

                        Page<Stock> stockPage = stockRepository.findAll(pageable);
                        log.info("조회된 페이지 정보: totalElements={}, totalPages={}, currentPage={}",
                                        stockPage.getTotalElements(), stockPage.getTotalPages(), stockPage.getNumber());

                        return stockPage.map(stock -> StockTickerDto.builder()
                                        .symbol(stock.getSymbol())
                                        .name(stock.getName())
                                        .price(stock.getCurrentPrice() != null
                                                        ? stock.getCurrentPrice().toString()
                                                        : "0")
                                        .change(stock.getPriceChangePercent() != null
                                                        ? stock.getPriceChangePercent().toString()
                                                        : "0")
                                        .logoUrl(stock.getLogoUrl())
                                        .sector(stock.getSector() != null ? stock.getSector() : "기타")
                                        .stockCode(stock.getSymbol())
                                        .stockName(stock.getName())
                                        .currentPrice(stock.getCurrentPrice() != null
                                                        ? stock.getCurrentPrice().toString()
                                                        : "0")
                                        .priceChange(stock.getPriceChange() != null
                                                        ? stock.getPriceChange().toString()
                                                        : "0")
                                        .changeRate(stock.getPriceChangePercent() != null
                                                        ? stock.getPriceChangePercent().toString()
                                                        : "0")
                                        .build());

                } catch (Exception e) {
                        log.error("getAllStocks 실행 중 오류 발생", e);
                        throw new RuntimeException("주식 목록 조회 중 오류가 발생했습니다: " + e.getMessage(), e);
                }
        }

        /**
         * 정렬 필드가 유효한지 검증
         */
        private boolean isValidSortField(String field) {
                return field.equals("symbol") || field.equals("name") || field.equals("sector");
        }

        /**
         * 디버깅용: 데이터베이스 상태 확인
         */
        public void debugDatabaseStatus() {
                try {
                        long totalCount = stockRepository.count();
                        log.info("=== 데이터베이스 상태 디버깅 ===");
                        log.info("전체 주식 개수: {}", totalCount);

                        if (totalCount > 0) {
                                List<Stock> firstStock = stockRepository.findAll().stream().limit(1)
                                                .collect(Collectors.toList());
                                if (!firstStock.isEmpty()) {
                                        Stock stock = firstStock.get(0);
                                        log.info("첫 번째 주식: symbol={}, name={}, sector={}",
                                                        stock.getSymbol(), stock.getName(), stock.getSector());
                                }
                        }

                        // 간단한 페이지네이션 테스트
                        Pageable testPageable = PageRequest.of(0, 5);
                        Page<Stock> testPage = stockRepository.findAll(testPageable);
                        log.info("테스트 페이지네이션: totalElements={}, contentSize={}",
                                        testPage.getTotalElements(), testPage.getContent().size());

                } catch (Exception e) {
                        log.error("데이터베이스 상태 확인 중 오류", e);
                }
        }

        @Override
        public StockPriceResponse getRealTimePrice(String stockCode) {
                log.info("Fetching real-time price for stock code: {}", stockCode);

                try {
                        String response = kisApiService.getCurrentStockPrice(stockCode);
                        JSONObject jsonResponse = new JSONObject(response);

                        // KIS API 응답 구조: rt_cd (성공코드), output (데이터)
                        if (!"0".equals(jsonResponse.optString("rt_cd"))) {
                                throw new RuntimeException("KIS API 오류: " + jsonResponse.optString("msg1"));
                        }

                        JSONObject output = jsonResponse.getJSONObject("output");

                        // 시장 운영 상태 확인
                        MarketTimeUtils.MarketTimeInfo marketInfo = marketTimeUtils.getMarketTimeInfo();
                        boolean isMarketOpen = marketInfo.isMarketOpen();
                        boolean isAfterMarketClose = marketInfo.isMarketClosed() &&
                                        !marketInfo.getMarketStatus()
                                                        .equals(MarketTimeUtils.MarketStatus.CLOSED_WEEKEND)
                                        &&
                                        !marketInfo.getMarketStatus()
                                                        .equals(MarketTimeUtils.MarketStatus.CLOSED_HOLIDAY);

                        // 원본 현재가와 전일종가
                        String originalCurrentPrice = output.optString("stck_prpr", "0");
                        String previousClose = output.optString("stck_sdpr", "0");

                        // 장종료 후에는 종가(전일종가가 아닌 당일 종가)를 현재가로 사용
                        // KIS API에서 장종료 후에는 stck_prpr이 당일 종가를 나타냄
                        String displayCurrentPrice = originalCurrentPrice;

                        if (isAfterMarketClose) {
                                log.info("시장 종료 후 - 종가({})를 현재가로 표시: {}", displayCurrentPrice, stockCode);
                        }

                        return StockPriceResponse.builder()
                                        .stockCode(stockCode)
                                        .stockName(output.optString("hts_kor_isnm", "")) // 종목명
                                        .currentPrice(displayCurrentPrice) // 장종료 시 종가 표시
                                        .changePrice(output.optString("prdy_vrss", "0")) // 전일대비
                                        .changeRate(output.optString("prdy_ctrt", "0")) // 전일대비율
                                        .changeSign(output.optString("prdy_vrss_sign", "3")) // 전일대비구분
                                        .openPrice(output.optString("stck_oprc", "0")) // 시가
                                        .highPrice(output.optString("stck_hgpr", "0")) // 고가
                                        .lowPrice(output.optString("stck_lwpr", "0")) // 저가
                                        .volume(output.optString("acml_vol", "0")) // 누적거래량
                                        .volumeRatio(output.optString("vol_tnrt", "0")) // 거래량회전율
                                        .marketCap(output.optString("hts_avls", "0")) // 시가총액
                                        .previousClose(previousClose) // 전일종가
                                        .updatedTime(output.optString("stck_cntg_hour", "")) // 연속시간
                                        // 추가된 필드들
                                        .isMarketOpen(isMarketOpen)
                                        .isAfterMarketClose(isAfterMarketClose)
                                        .marketStatus(marketInfo.getStatusMessage())
                                        .build();

                } catch (Exception e) {
                        log.error("Failed to fetch real-time price for stock code: {}", stockCode, e);
                        throw new RuntimeException("실시간 주식 가격 조회 실패", e);
                }
        }

        @Override
        public StockBasicInfoResponse getStockBasicInfo(String stockCode) {
                log.info("Fetching basic info for stock code: {}", stockCode);

                try {
                        String response = kisApiService.getStockBasicInfo(stockCode);
                        JSONObject jsonResponse = new JSONObject(response);

                        // KIS API 응답 구조: rt_cd (성공코드), output (데이터)
                        if (!"0".equals(jsonResponse.optString("rt_cd"))) {
                                throw new RuntimeException("KIS API 오류: " + jsonResponse.optString("msg1"));
                        }

                        JSONObject output = jsonResponse.getJSONObject("output");

                        return StockBasicInfoResponse.builder()
                                        .stockCode(stockCode)
                                        .stockName(output.optString("prdt_name", "")) // 상품명
                                        .marketName(output.optString("std_pdno", "")) // 표준상품번호
                                        .sector(output.optString("bstp_cls_code_name", "")) // 업종분류코드명
                                        .listingShares(output.optString("lstg_stqt", "")) // 상장주식수
                                        .faceValue(output.optString("face_val", "")) // 액면가
                                        .capital(output.optString("cpta", "")) // 자본금
                                        .listingDate(output.optString("lstg_dt", "")) // 상장일
                                        .ceoName(output.optString("rprs_name", "")) // 대표자명
                                        .website(output.optString("hmpg_url", "")) // 홈페이지
                                        .region(output.optString("rgn_cls_code_name", "")) // 지역분류코드명
                                        .closingMonth(output.optString("sttl_mmdd", "")) // 결산월일
                                        .mainBusiness(output.optString("main_bsn", "")) // 주요사업
                                        .per(output.optString("per", "0")) // PER
                                        .pbr(output.optString("pbr", "0")) // PBR
                                        .eps(output.optString("eps", "0")) // EPS
                                        .bps(output.optString("bps", "0")) // BPS
                                        .dividend(output.optString("divi", "0")) // 배당금
                                        .dividendYield(output.optString("divi_yield", "0")) // 배당수익률
                                        .build();

                } catch (Exception e) {
                        log.error("Failed to fetch basic info for stock code: {}", stockCode, e);
                        throw new RuntimeException("종목 기본 정보 조회 실패", e);
                }
        }

        @Override
        public OrderBookResponse getOrderBook(String stockCode) {
                log.info("Fetching order book for stock code: {}", stockCode);

                try {
                        String response = kisApiService.getOrderBook(stockCode);
                        JSONObject jsonResponse = new JSONObject(response);

                        // KIS API 응답 구조: rt_cd (성공코드), output1 (호가 데이터), output2 (추가 정보)
                        if (!"0".equals(jsonResponse.optString("rt_cd"))) {
                                throw new RuntimeException("KIS API 오류: " + jsonResponse.optString("msg1"));
                        }

                        JSONObject output1 = jsonResponse.getJSONObject("output1");

                        // 매도 호가 리스트 구성 (1~10호가)
                        List<OrderBookItem> askOrders = new ArrayList<>();
                        for (int i = 1; i <= 10; i++) {
                                String askPrice = output1.optString("askp" + i, "0");
                                String askQuantity = output1.optString("askp_rsqn" + i, "0");

                                askOrders.add(OrderBookItem.builder()
                                                .price(askPrice)
                                                .quantity(askQuantity)
                                                .orderCount(String.valueOf(i))
                                                .orderType("매도")
                                                .build());
                        }

                        // 매수 호가 리스트 구성 (1~10호가)
                        List<OrderBookItem> bidOrders = new ArrayList<>();
                        for (int i = 1; i <= 10; i++) {
                                String bidPrice = output1.optString("bidp" + i, "0");
                                String bidQuantity = output1.optString("bidp_rsqn" + i, "0");

                                bidOrders.add(OrderBookItem.builder()
                                                .price(bidPrice)
                                                .quantity(bidQuantity)
                                                .orderCount(String.valueOf(i))
                                                .orderType("매수")
                                                .build());
                        }

                        return OrderBookResponse.builder()
                                        .stockCode(stockCode)
                                        .stockName(output1.optString("hts_kor_isnm", "")) // 종목명
                                        .currentPrice(output1.optString("stck_prpr", "0")) // 현재가
                                        .updatedTime(output1.optString("stck_cntg_hour", "")) // 연속시간
                                        .askOrders(askOrders) // 매도 호가
                                        .bidOrders(bidOrders) // 매수 호가
                                        .totalAskQuantity(output1.optString("total_askp_rsqn", "0")) // 매도 총잔량
                                        .totalBidQuantity(output1.optString("total_bidp_rsqn", "0")) // 매수 총잔량
                                        .build();

                } catch (Exception e) {
                        log.error("Failed to fetch order book for stock code: {}", stockCode, e);
                        throw new RuntimeException("호가창 정보 조회 실패", e);
                }
        }
}
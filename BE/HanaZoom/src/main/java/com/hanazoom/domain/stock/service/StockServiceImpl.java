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
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.fasterxml.jackson.databind.ObjectMapper;
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
        private final RedisTemplate<String, Object> redisTemplate;
        private final ObjectMapper objectMapper;

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
                                                .build())
                                .collect(Collectors.toList());
        }

        @Override
        @Transactional(readOnly = true)
        public List<StockTickerDto> searchStocks(String query) {
                return stockRepository.findByNameContainingOrSymbolContaining(query, query).stream()
                                .limit(10)
                                .map(stock -> StockTickerDto.builder()

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
                                                .build())
                                .collect(Collectors.toList());
        }

        @Override
        @Transactional(readOnly = true)
        public Page<StockTickerDto> getAllStocks(Pageable pageable) {
                try {
                        log.info("getAllStocks 호출됨 - pageable: {}", pageable);


                        Sort sort = pageable.getSort();
                        if (sort.isSorted()) {
                                Sort.Order order = sort.iterator().next();
                                String property = order.getProperty();
                                log.info("정렬 필드: {}", property);


                                if (!isValidSortField(property)) {
                                        log.warn("유효하지 않은 정렬 필드: {}, 기본값 'symbol'으로 변경", property);
                                        sort = Sort.by(order.getDirection(), "symbol");
                                        pageable = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(),
                                                        sort);
                                }
                        }


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

        private boolean isValidSortField(String field) {
                return field.equals("symbol") || field.equals("name") || field.equals("sector");
        }

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
                log.info("🔍 DB에서 현재가 조회 시작: {}", stockCode);

                try {
                        String response = kisApiService.getCurrentStockPrice(stockCode);
                        JSONObject jsonResponse = new JSONObject(response);


                        if (!"0".equals(jsonResponse.optString("rt_cd"))) {
                                log.error("❌ KIS API 오류: {}", jsonResponse.optString("msg1"));
                                throw new RuntimeException("KIS API 오류: " + jsonResponse.optString("msg1"));
                        }

                        JSONObject output = jsonResponse.getJSONObject("output");
                        log.info("📊 KIS API 현재가 응답: 종목={}, 현재가={}, 전일대비={}", 
                            stockCode, output.optString("stck_prpr", "0"), output.optString("prdy_vrss", "0"));


                        MarketTimeUtils.MarketTimeInfo marketInfo = marketTimeUtils.getMarketTimeInfo();
                        boolean isMarketOpen = marketInfo.isMarketOpen();
                        boolean isAfterMarketClose = marketInfo.isMarketClosed() &&
                                        !marketInfo.getMarketStatus()
                                                        .equals(MarketTimeUtils.MarketStatus.CLOSED_WEEKEND)
                                        &&
                                        !marketInfo.getMarketStatus()
                                                        .equals(MarketTimeUtils.MarketStatus.CLOSED_HOLIDAY);


                        String originalCurrentPrice = output.optString("stck_prpr", "0");
                        String previousClose = output.optString("stck_sdpr", "0");
                        String changePrice = output.optString("prdy_vrss", "0");



                        String displayCurrentPrice = originalCurrentPrice;

                        if (isAfterMarketClose) {
                                log.info("시장 종료 후 - 종가({})를 현재가로 표시: {}", displayCurrentPrice, stockCode);
                        }


                        String calculatedChangeRate = "0";
                        try {
                                double currentPriceValue = Double.parseDouble(displayCurrentPrice);
                                double changePriceValue = Double.parseDouble(changePrice);
                                
                                if (currentPriceValue > 0 && changePriceValue != 0) {
                                        double changeRateValue = (changePriceValue / (currentPriceValue - changePriceValue)) * 100;
                                        calculatedChangeRate = String.format("%.2f", changeRateValue);
                                }
                        } catch (Exception e) {
                                log.warn("등락률 계산 실패, KIS API 값 사용: 종목={}, 에러={}", stockCode, e.getMessage());
                                calculatedChangeRate = output.optString("prdy_ctrt", "0");
                        }
                        
                        log.info("📊 등락률 계산: 종목={}, 현재가={}, 변동가={}, 계산된등락률={}, KIS등락률={}", 
                            stockCode, displayCurrentPrice, changePrice, calculatedChangeRate, output.optString("prdy_ctrt", "0"));

                        StockPriceResponse stockPriceResponse = StockPriceResponse.builder()
                                        .stockCode(stockCode)
                                        .stockName(output.optString("hts_kor_isnm", "")) 
                                        .currentPrice(displayCurrentPrice) 
                                        .changePrice(changePrice) 
                                        .changeRate(calculatedChangeRate) 
                                        .changeSign(output.optString("prdy_vrss_sign", "3")) 
                                        .openPrice(output.optString("stck_oprc", "0")) 
                                        .highPrice(output.optString("stck_hgpr", "0")) 
                                        .lowPrice(output.optString("stck_lwpr", "0")) 
                                        .volume(output.optString("acml_vol", "0")) 
                                        .volumeRatio(output.optString("vol_tnrt", "0")) 
                                        .marketCap(output.optString("hts_avls", "0")) 
                                        .previousClose(previousClose) 
                                        .updatedTime(output.optString("stck_cntg_hour", "")) 

                                        .isMarketOpen(isMarketOpen)
                                        .isAfterMarketClose(isAfterMarketClose)
                                        .marketStatus(marketInfo.getStatusMessage())
                                        .build();


                        try {
                                String key = "stock:realtime:" + stockCode;
                                String stockDataJson = objectMapper.writeValueAsString(stockPriceResponse);
                                redisTemplate.opsForValue().set(key, stockDataJson);
                                log.info("💾 KIS API 데이터 Redis 저장: 종목={}, 현재가={}, 키={}", 
                                    stockCode, displayCurrentPrice, key);
                        } catch (Exception e) {
                                log.error("❌ KIS API 데이터 Redis 저장 실패: 종목={}, 에러={}", stockCode, e.getMessage());
                        }

                        return stockPriceResponse;

                } catch (Exception e) {
                        log.error("❌ KIS API 호출 실패: 종목={}, 에러={}", stockCode, e.getMessage());
                        

                        try {
                                Stock stock = stockRepository.findBySymbol(stockCode).orElse(null);
                                if (stock != null) {
                                        log.warn("⚠️ KIS API 실패 - DB 데이터로 fallback: 종목={}, 현재가={}", 
                                            stockCode, stock.getCurrentPrice());
                                        
                                        return StockPriceResponse.builder()
                                                .stockCode(stockCode)
                                                .stockName(stock.getName())
                                                .currentPrice(stock.getCurrentPrice() != null ? stock.getCurrentPrice().toString() : "0")
                                                .changePrice(stock.getPriceChange() != null ? stock.getPriceChange().toString() : "0")
                                                .changeRate(stock.getPriceChangePercent() != null ? stock.getPriceChangePercent().toString() : "0")
                                                .changeSign("3") 
                                                .volume(stock.getVolume() != null ? stock.getVolume().toString() : "0")
                                                .marketCap(stock.getMarketCap() != null ? stock.getMarketCap().toString() : "0")
                                                .updatedTime(String.valueOf(System.currentTimeMillis()))
                                                .isMarketOpen(false) 
                                                .isAfterMarketClose(false)
                                                .marketStatus("DB 데이터 (실시간 연결 실패)")
                                                .build();
                                }
                        } catch (Exception dbException) {
                                log.error("❌ DB fallback도 실패: {}", dbException.getMessage());
                        }
                        
                        throw new RuntimeException("주식 현재가 조회 실패: " + stockCode, e);
                }
        }

        @Override
        public StockBasicInfoResponse getStockBasicInfo(String stockCode) {
                log.info("Fetching basic info for stock code: {}", stockCode);

                try {
                        String response = kisApiService.getStockBasicInfo(stockCode);
                        JSONObject jsonResponse = new JSONObject(response);


                        if (!"0".equals(jsonResponse.optString("rt_cd"))) {
                                throw new RuntimeException("KIS API 오류: " + jsonResponse.optString("msg1"));
                        }

                        JSONObject output = jsonResponse.getJSONObject("output");

                        return StockBasicInfoResponse.builder()
                                        .stockCode(stockCode)
                                        .stockName(output.optString("prdt_name", "")) 
                                        .marketName(output.optString("std_pdno", "")) 
                                        .sector(output.optString("bstp_cls_code_name", "")) 
                                        .listingShares(output.optString("lstg_stqt", "")) 
                                        .faceValue(output.optString("face_val", "")) 
                                        .capital(output.optString("cpta", "")) 
                                        .listingDate(output.optString("lstg_dt", "")) 
                                        .ceoName(output.optString("rprs_name", "")) 
                                        .website(output.optString("hmpg_url", "")) 
                                        .region(output.optString("rgn_cls_code_name", "")) 
                                        .closingMonth(output.optString("sttl_mmdd", "")) 
                                        .mainBusiness(output.optString("main_bsn", "")) 
                                        .per(output.optString("per", "0")) 
                                        .pbr(output.optString("pbr", "0")) 
                                        .eps(output.optString("eps", "0")) 
                                        .bps(output.optString("bps", "0")) 
                                        .dividend(output.optString("divi", "0")) 
                                        .dividendYield(output.optString("divi_yield", "0")) 
                                        .build();

                } catch (Exception e) {
                        log.error("Failed to fetch basic info for stock code: {}", stockCode, e);
                        throw new RuntimeException("종목 기본 정보 조회 실패", e);
                }
        }

        @Override
        public OrderBookResponse getOrderBook(String stockCode) {


                try {
                        String response = kisApiService.getOrderBook(stockCode);
                        JSONObject jsonResponse = new JSONObject(response);


                        if (!"0".equals(jsonResponse.optString("rt_cd"))) {
                                throw new RuntimeException("KIS API 오류: " + jsonResponse.optString("msg1"));
                        }

                        JSONObject output1 = jsonResponse.getJSONObject("output1");


                        List<OrderBookItem> askOrders = new ArrayList<>();
                        for (int i = 1; i <= 10; i++) {
                                String askPrice = output1.optString("askp" + i, "0");
                                String askQuantity = output1.optString("askp_rsqn" + i, "0");

                                askOrders.add(OrderBookItem.builder()
                                                .price(askPrice)
                                                .quantity(askQuantity)
                                                .orderCount(String.valueOf(i))
                                                .orderType("매도")
                                                .rank(i)
                                                .build());
                        }


                        List<OrderBookItem> bidOrders = new ArrayList<>();
                        for (int i = 1; i <= 10; i++) {
                                String bidPrice = output1.optString("bidp" + i, "0");
                                String bidQuantity = output1.optString("bidp_rsqn" + i, "0");

                                bidOrders.add(OrderBookItem.builder()
                                                .price(bidPrice)
                                                .quantity(bidQuantity)
                                                .orderCount(String.valueOf(i))
                                                .orderType("매수")
                                                .rank(i)
                                                .build());
                        }

                        return OrderBookResponse.builder()
                                        .stockCode(stockCode)
                                        .stockName(output1.optString("hts_kor_isnm", "")) 
                                        .currentPrice(output1.optString("stck_prpr", "0")) 
                                        .updatedTime(output1.optString("stck_cntg_hour", "")) 
                                        .askOrders(askOrders) 
                                        .bidOrders(bidOrders) 
                                        .totalAskQuantity(output1.optString("total_askp_rsqn", "0")) 
                                        .totalBidQuantity(output1.optString("total_bidp_rsqn", "0")) 
                                        .build();

                } catch (Exception e) {
                        log.error("Failed to fetch order book for stock code: {}", stockCode, e);
                        throw new RuntimeException("호가창 정보 조회 실패", e);
                }
        }
}
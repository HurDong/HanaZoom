/**
 * 포트폴리오 관리 도메인
 * 
 * <p>
 * 이 패키지는 사용자의 포트폴리오 관리를 위한 모든 기능을 포함합니다.
 * </p>
 * 
 * <h3>주요 기능</h3>
 * <ul>
 * <li><strong>계좌 관리</strong>: 다중 계좌 지원, 계좌 타입별 관리</li>
 * <li><strong>잔고 관리</strong>: 현금/주식 잔고 실시간 추적</li>
 * <li><strong>포트폴리오 관리</strong>: 보유 주식 관리, 평균 매수가 계산</li>
 * <li><strong>거래 내역</strong>: 매수/매도/배당 등 모든 거래 기록</li>
 * <li><strong>성과 분석</strong>: 수익률, 위험 지표, 자산 배분 분석</li>
 * <li><strong>알림 시스템</strong>: 가격/손익/수량 기반 맞춤형 알림</li>
 * <li><strong>리밸런싱</strong>: 자동/수동 포트폴리오 리밸런싱</li>
 * </ul>
 * 
 * <h3>엔터티 구조</h3>
 * <ul>
 * <li><code>Account</code>: 계좌 정보 및 상태 관리</li>
 * <li><code>AccountBalance</code>: 계좌별 잔고 정보</li>
 * <li><code>PortfolioStock</code>: 보유 주식 및 평가 정보</li>
 * <li><code>TradeHistory</code>: 거래 내역 상세 기록</li>
 * <li><code>PortfolioPerformance</code>: 성과 분석 및 위험 지표</li>
 * <li><code>PortfolioAlert</code>: 맞춤형 알림 설정</li>
 * <li><code>RebalancingHistory</code>: 리밸런싱 실행 이력</li>
 * </ul>
 * 
 * <h3>Enum 클래스들</h3>
 * <ul>
 * <li><code>AccountType</code>: 계좌 타입 (주식, 펀드, 혼합)</li>
 * <li><code>TradeType</code>: 거래 타입 (매수, 매도, 배당, 분할, 합병)</li>
 * <li><code>AlertType</code>: 알림 타입 (가격, 손익, 수량, 자산 배분)</li>
 * <li><code>ConditionType</code>: 알림 조건 (이상, 이하, 정확히, 변화)</li>
 * <li><code>NotificationMethod</code>: 알림 방법 (이메일, SMS, 푸시, 모든 방법)</li>
 * <li><code>RebalancingType</code>: 리밸런싱 타입 (수동, 자동, 예약)</li>
 * </ul>
 * 
 * <h3>사용 예시</h3>
 * 
 * <pre>{@code
 * // 계좌 생성
 * Account account = Account.builder()
 *         .member(member)
 *         .accountNumber("1234567890")
 *         .accountName("주식계좌")
 *         .accountType(AccountType.STOCK)
 *         .broker("한국투자증권")
 *         .isMainAccount(true)
 *         .build();
 * 
 * // 포트폴리오 보유 주식 추가
 * PortfolioStock portfolioStock = PortfolioStock.builder()
 *         .account(account)
 *         .stockSymbol("005930")
 *         .quantity(100)
 *         .avgPurchasePrice(new BigDecimal("70000"))
 *         .totalPurchaseAmount(new BigDecimal("7000000"))
 *         .build();
 * 
 * // 거래 내역 기록
 * TradeHistory tradeHistory = TradeHistory.builder()
 *         .account(account)
 *         .stockSymbol("005930")
 *         .tradeType(TradeType.BUY)
 *         .quantity(100)
 *         .pricePerShare(new BigDecimal("70000"))
 *         .totalAmount(new BigDecimal("7000000"))
 *         .commission(new BigDecimal("1000"))
 *         .build();
 * }</pre>
 * 
 * @author HanaZoom Team
 * @version 1.0
 * @since 2024-01-15
 */
package com.hanazoom.domain.portfolio;

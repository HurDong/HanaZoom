package com.hanazoom.domain.portfolio.service;

import com.hanazoom.domain.portfolio.entity.SettlementSchedule;
import com.hanazoom.domain.portfolio.entity.SettlementSchedule.SettlementStatus;
import com.hanazoom.domain.portfolio.repository.SettlementScheduleRepository;
import com.hanazoom.domain.portfolio.repository.AccountBalanceRepository;
import com.hanazoom.domain.portfolio.repository.AccountRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import com.hanazoom.domain.portfolio.entity.AccountBalance;

@Slf4j
@Service
@EnableScheduling
@RequiredArgsConstructor
@Transactional
public class SettlementScheduler {

    private final SettlementScheduleRepository settlementScheduleRepository;
    private final AccountBalanceRepository accountBalanceRepository;
    private final AccountRepository accountRepository;


    @Scheduled(cron = "0 0 0 * * ?")
    @Transactional
    public void processSettlements() {
        LocalDate today = LocalDate.now();
        log.info("정산 처리 시작: {}", today);

        try {

            List<SettlementSchedule> completedSchedules = settlementScheduleRepository
                    .findBySettlementDateAndStatus(today, SettlementStatus.PENDING);

            log.info("정산 처리 대상: {}건", completedSchedules.size());

            for (SettlementSchedule schedule : completedSchedules) {
                processSettlement(schedule);
            }

            log.info("정산 처리 완료: {}건", completedSchedules.size());

        } catch (Exception e) {
            log.error("정산 처리 중 오류 발생", e);
        }
    }

    private void processSettlement(SettlementSchedule schedule) {
        try {

            AccountBalance balance = schedule.getAccountBalance();
            if (balance == null) {
                balance = accountBalanceRepository.findById(schedule.getAccountBalanceId())
                        .orElseThrow(
                                () -> new IllegalArgumentException(
                                        "계좌 잔고를 찾을 수 없습니다: " + schedule.getAccountBalanceId()));
            }

            final AccountBalance finalBalance = balance;


            var account = accountRepository.findById(finalBalance.getAccountId())
                    .orElseThrow(() -> new IllegalArgumentException("계좌를 찾을 수 없습니다: " + finalBalance.getAccountId()));

            log.info("정산 처리: ID={}, 금액={}, 계좌={}",
                    schedule.getId(), schedule.getSettlementAmount(),
                    account.getAccountNumber());

            finalBalance.setSettlementCash(finalBalance.getSettlementCash().subtract(schedule.getSettlementAmount()));
            finalBalance.setWithdrawableCash(finalBalance.getWithdrawableCash().add(schedule.getSettlementAmount()));


            schedule.completeSettlement();


            accountBalanceRepository.save(finalBalance);
            settlementScheduleRepository.save(schedule);

            log.info("정산 완료: ID={}, 계좌={}",
                    schedule.getId(), finalBalance.getAccountId());

        } catch (Exception e) {
            log.error("개별 정산 처리 실패: ID={}", schedule.getId(), e);
        }
    }


    public void processSettlementManually(Long scheduleId) {
        log.info("수동 정산 처리 시작: ID={}", scheduleId);

        try {
            var schedule = settlementScheduleRepository.findById(scheduleId)
                    .orElseThrow(() -> new IllegalArgumentException("정산 스케줄을 찾을 수 없습니다: " + scheduleId));

            if (schedule.getStatus() != SettlementStatus.PENDING) {
                throw new IllegalStateException("정산 대기 상태가 아닙니다: " + schedule.getStatus());
            }

            processSettlement(schedule);
            log.info("수동 정산 처리 완료: ID={}", scheduleId);

        } catch (Exception e) {
            log.error("수동 정산 처리 실패: ID={}", scheduleId, e);
            throw e;
        }
    }


    public void processSettlementsForDate(LocalDate date) {
        log.info("특정 날짜 정산 처리 시작: {}", date);

        try {
            List<SettlementSchedule> schedules = settlementScheduleRepository
                    .findBySettlementDateAndStatus(date, SettlementStatus.PENDING);

            log.info("정산 처리 대상: {}건", schedules.size());

            for (SettlementSchedule schedule : schedules) {
                processSettlement(schedule);
            }

            log.info("특정 날짜 정산 처리 완료: {}건", schedules.size());

        } catch (Exception e) {
            log.error("특정 날짜 정산 처리 중 오류 발생: {}", date, e);
            throw e;
        }
    }
}

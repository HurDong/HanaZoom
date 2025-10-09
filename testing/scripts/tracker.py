#!/usr/bin/env python3
"""
HanaZoom 성능 테스트 결과 추적기
- Gatling 테스트 결과를 자동으로 저장
- 이전 결과와 비교하여 개선 효과 분석
"""

import os
import json
import re
import pandas as pd
from datetime import datetime
from pathlib import Path
import argparse

class PerformanceTracker:
    def __init__(self):
        self.results_dir = Path(r"C:\Users\DA\Desktop\HanaZoom\testing\gatling-charts-highcharts-bundle-3.10.5\results")
        self.history_file = Path(r"C:\Users\DA\Desktop\HanaZoom\testing\logs\performance_history.json")

    def extract_metrics_from_json(self, result_folder):
        """JSON 파일에서 성능 지표 추출"""
        json_file = Path(result_folder) / "js" / "global_stats.json"

        if not json_file.exists():
            print(f"❌ JSON 파일을 찾을 수 없습니다: {json_file}")
            return None

        try:
            with open(json_file, 'r', encoding='utf-8') as f:
                data = json.load(f)

            # 요청 수
            total_requests = data['numberOfRequests']['total']
            ok_requests = data['numberOfRequests']['ok']
            ko_requests = data['numberOfRequests']['ko']

            # 응답시간
            mean_response_time = data['meanResponseTime']['ok']
            min_response_time = data['minResponseTime']['ok']
            max_response_time = data['maxResponseTime']['ok']

            # 백분위수 (percentiles4는 99%에 해당)
            p99_response_time = data['percentiles4']['ok']

            # 처리량
            throughput = data['meanNumberOfRequestsPerSecond']['ok']

            # 응답시간 분포
            lt_800 = data['group1']['count']  # t < 800 ms
            lt_800_pct = data['group1']['percentage']

            bt_800_1200 = data['group2']['count']  # 800 ms <= t < 1200 ms
            bt_800_1200_pct = data['group2']['percentage']

            gt_1200 = data['group3']['count']  # t >= 1200 ms
            gt_1200_pct = data['group3']['percentage']

            failed = data['group4']['count']  # failed
            failed_pct = data['group4']['percentage']

            metrics = {
                'total_requests': total_requests,
                'ok_requests': ok_requests,
                'ko_requests': ko_requests,
                'mean_response_time': mean_response_time,
                'min_response_time': min_response_time,
                'max_response_time': max_response_time,
                'percentile_99_response_time': p99_response_time,
                'throughput': throughput,
                'response_time_lt_800ms': lt_800,
                'response_time_lt_800ms_pct': lt_800_pct,
                'response_time_800_1200ms': bt_800_1200,
                'response_time_800_1200ms_pct': bt_800_1200_pct,
                'response_time_gt_1200ms': gt_1200,
                'response_time_gt_1200ms_pct': gt_1200_pct,
                'failed_requests': failed,
                'failed_requests_pct': failed_pct
            }

            return metrics

        except Exception as e:
            print(f"❌ JSON 파일 파싱 중 오류: {e}")
            return None

    def save_test_results(self, test_name=None):
        """테스트 결과를 히스토리에 저장"""
        history_data = {"HanaZoomChatSimulation": []}

        if self.history_file.exists():
            with open(self.history_file, 'r', encoding='utf-8') as f:
                history_data = json.load(f)

        # 최신 결과 폴더 찾기
        if not self.results_dir.exists():
            print(f"❌ 결과 폴더를 찾을 수 없습니다: {self.results_dir}")
            return

        result_dirs = [d for d in self.results_dir.iterdir() if d.is_dir()]
        if not result_dirs:
            print("❌ 결과 폴더가 비어있습니다")
            return

        latest_result = max(result_dirs, key=lambda x: x.stat().st_mtime)

        print(f"📊 최신 결과 분석: {latest_result.name}")

        metrics = self.extract_metrics_from_json(latest_result)
        if not metrics:
            print("❌ 성능 지표를 추출할 수 없습니다")
            return

        # 타임스탬프 추가
        timestamp = datetime.now().isoformat()
        test_result = {
            'timestamp': timestamp,
            'test_name': test_name or latest_result.name,
            'result_folder': latest_result.name,
            'response_distribution': {
                'fast_responses': metrics['response_time_lt_800ms'],
                'fast_percent': metrics['response_time_lt_800ms_pct'],
                'medium_responses': metrics['response_time_800_1200ms'],
                'medium_percent': metrics['response_time_800_1200ms_pct'],
                'slow_responses': metrics['response_time_gt_1200ms'],
                'slow_percent': metrics['response_time_gt_1200ms_pct']
            },
            **metrics
        }

        # 리스트에 추가
        history_data["HanaZoomChatSimulation"].append(test_result)

        # 최신 10개만 유지
        history_data["HanaZoomChatSimulation"] = history_data["HanaZoomChatSimulation"][-10:]

        # 저장
        with open(self.history_file, 'w', encoding='utf-8') as f:
            json.dump(history_data, f, ensure_ascii=False, indent=2)

        print(f"✅ 테스트 결과 저장 완료: {len(history_data['HanaZoomChatSimulation'])}개 결과")

    def compare_with_previous(self):
        """이전 결과와 비교"""
        if not self.history_file.exists():
            print("❌ 히스토리 파일이 없습니다")
            return

        with open(self.history_file, 'r', encoding='utf-8') as f:
            history_data = json.load(f)

        results = history_data.get("HanaZoomChatSimulation", [])
        if len(results) < 2:
            print("⚠️ 비교할 결과가 2개 미만입니다")
            return

        current = results[-1]
        previous = results[-2]

        print("📈 성능 비교 (최신 vs 이전)")
        print("=" * 50)

        print(f"테스트: {current['test_name']} vs {previous['test_name']}")
        print(f"시간: {current['timestamp']} vs {previous['timestamp']}")
        print()

        improvements = {}

        # 응답시간 비교
        mean_current = current.get('mean_response_time', 0)
        mean_previous = previous.get('mean_response_time', 0)
        if mean_current > 0 and mean_previous > 0:
            mean_change = ((mean_current - mean_previous) / mean_previous) * 100
            improvements['평균 응답시간'] = f"{mean_change:+.1f}%"

        # 99% 응답시간 비교
        p99_current = current.get('percentile_99_response_time', 0)
        p99_previous = previous.get('percentile_99_response_time', 0)
        if p99_current > 0 and p99_previous > 0:
            p99_change = ((p99_current - p99_previous) / p99_previous) * 100
            improvements['99% 응답시간'] = f"{p99_change:+.1f}%"

        # 처리량 비교
        throughput_current = current.get('throughput', 0)
        throughput_previous = previous.get('throughput', 0)
        if throughput_current > 0 and throughput_previous > 0:
            throughput_change = ((throughput_current - throughput_previous) / throughput_previous) * 100
            improvements['처리량'] = f"{throughput_change:+.1f}%"

        for metric, change in improvements.items():
            print(f"{metric}: {change}")

        if not improvements:
            print("⚠️ 비교할 수 있는 지표가 없습니다")

    def show_history(self):
        """전체 히스토리 표시"""
        if not self.history_file.exists():
            print("❌ 히스토리 파일이 없습니다")
            return

        with open(self.history_file, 'r', encoding='utf-8') as f:
            history_data = json.load(f)

        results = history_data.get("HanaZoomChatSimulation", [])

        print("📋 테스트 결과 히스토리")
        print("=" * 60)

        for i, result in enumerate(reversed(results), 1):
            print(f"{i}. {result['timestamp']}")
            print(f"   테스트: {result.get('test_name', 'N/A')}")
            print(f"   총 요청: {result.get('total_requests', 'N/A')}")
            print(f"   평균 응답시간: {result.get('mean_response_time', 'N/A')}ms")
            print(f"   99% 응답시간: {result.get('percentile_99_response_time', 'N/A')}ms")
            print(f"   처리량: {result.get('throughput', 'N/A')} req/sec")

            # 응답시간 분포 정보가 있으면 표시
            if 'response_distribution' in result:
                rd = result['response_distribution']
                print(f"   응답시간 분포: <800ms {rd.get('fast_percent', 0)}%, 800-1200ms {rd.get('medium_percent', 0)}%, ≥1200ms {rd.get('slow_percent', 0)}%")
            print()

    def generate_summary_report(self):
        """요약 보고서 생성"""
        if not self.history_file.exists():
            print("❌ 히스토리 파일이 없습니다")
            return

        with open(self.history_file, 'r', encoding='utf-8') as f:
            results = json.load(f)

        if not results:
            print("❌ 결과가 없습니다")
            return

        latest = results[-1]

        print("📊 HanaZoom 성능 테스트 요약 보고서")
        print("=" * 40)
        print(f"최신 테스트: {latest['timestamp']}")
        print(f"테스트명: {latest['test_name']}")
        print()

        print("🎯 핵심 성능 지표:")
        print(f"• 평균 응답시간: {latest.get('mean_response_time', 'N/A')}ms")
        print(f"• 99% 응답시간: {latest.get('percentile_99_response_time', 'N/A')}ms")
        print(f"• 처리량: {latest.get('throughput', 'N/A')} req/sec")
        print()

        print("📈 응답시간 분포:")
        print(f"• < 800ms: {latest.get('response_time_lt_800ms_pct', 'N/A')}%")
        print(f"• 800-1200ms: {latest.get('response_time_800_1200ms_pct', 'N/A')}%")
        print(f"• ≥ 1200ms: {latest.get('response_time_gt_1200ms_pct', 'N/A')}%")

def main():
    parser = argparse.ArgumentParser(description='HanaZoom 성능 테스트 결과 추적기')
    parser.add_argument('action', nargs='?', default='auto', choices=['save', 'compare', 'history', 'auto'], help='수행할 작업 (auto: 자동 저장 후 비교)')
    parser.add_argument('--test-name', default='HanaZoomChatSimulation', help='테스트 이름')
    parser.add_argument('--html-file', help='HTML 결과 파일 경로')

    args = parser.parse_args()

    tracker = PerformanceTracker()

    if args.action == 'save':
        tracker.save_test_results(args.test_name)
    elif args.action == 'compare':
        tracker.compare_with_previous()
    elif args.action == 'history':
        tracker.show_history()
    elif args.action == 'auto':
        print("🤖 자동 모드: 저장 후 비교")
        tracker.save_test_results(args.test_name)
        print()
        tracker.compare_with_previous()

if __name__ == "__main__":
    main()

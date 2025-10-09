chcp 65001
@echo off
REM HanaZoom 부하테스트 실행 (자동 결과 추적)

echo.
echo 🚀 HanaZoom 초안전 부하테스트 시작
echo 💡 최대 100명까지 단계적 증가 (CPU 100% 방지)
echo 💡 20명 → 50명 → 100명 (최대) 초안전 단계별 증가
echo 💡 테스트 완료 후 자동으로 결과 저장 및 비교
echo.

REM Gatling 실행 (단계적 2000명 테스트)
cd ../gatling-charts-highcharts-bundle-3.10.5
.\bin\gatling.bat
cd ..

echo.
echo 🔍 테스트 완료! 결과 분석 중...
echo.

REM Python 스크립트로 자동 분석 (JSON 기반)
python "%~dp0..\scripts\tracker.py" auto

if %errorlevel% neq 0 (
    echo.
    echo ❌ 자동 분석 중 오류 발생
    echo 💡 수동 분석: python "%~dp0..\scripts\tracker.py" [save/compare/history]
    echo.
)

echo 🎉 테스트 완료 및 분석 완료!
echo 📊 결과를 확인하려면 위의 메시지를 확인하세요.
echo.
pause

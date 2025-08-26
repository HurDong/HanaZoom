# pip install pykrx pandas tqdm tenacity
from pykrx import stock
import pandas as pd
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed
from tenacity import retry, wait_exponential, stop_after_attempt
from time import sleep
import os
from tqdm import tqdm
import logging

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('stock_data_collection.log', encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

CODES = [
    "005930","000660","207940","373220","105560","051910","006400","033780","003550","012330",
    "017670","090430","009830","012450","010140","088350","034020","003490","028260","066570",
    "009150","096770","024110","316140","011200","010130","055550","030200","011170","004990",
    "336260","029780","000120","000720","086280","002380","004020","011790","006360","036570",
    "035250","402340","018260","023530","008770","069960","035760","139480","010950","456040",
    "375500","064350","018880","007070","120110","011210","000880","006650","001450","180640",
    "004000","282330","112610","009240","047040","161390","089860","008930","251270","032830",
    "028670","051900","016360","071050","047810","035720","086790","005940","078930","097950",
    "036460","005830","034730","128940","035420","011780","069500","005380","005490","015760",
    "204320","000150","010120","010620","009540","000810","326030"
]

START = "20100101"
END   = datetime.now().strftime("%Y%m%d")
OUT   = "./out_krx_parallel"

os.makedirs(OUT, exist_ok=True)

def normalize(df: pd.DataFrame) -> pd.DataFrame:
    m = {"시가":"open","고가":"high","저가":"low","종가":"close","거래량":"volume"}
    df = df.rename(columns=m).sort_index()
    keep = [c for c in ["open","high","low","close","volume"] if c in df.columns]
    return df[keep].astype("float64")

def to_weekly(df_daily: pd.DataFrame) -> pd.DataFrame:
    return (df_daily
            .resample("W-FRI")
            .agg({"open":"first","high":"max","low":"min","close":"last","volume":"sum"})
            .dropna())

@retry(wait=wait_exponential(multiplier=0.5, min=0.5, max=8), stop=stop_after_attempt(5))
def fetch_one(code: str):
    try:
        logger.info(f"📊 {code} 데이터 수집 시작...")
        
        # 일별 데이터
        logger.info(f"  └─ {code} 일별 데이터 수집 중...")
        day = stock.get_market_ohlcv_by_date(START, END, code, freq="d")
        logger.info(f"  └─ {code} 일별 데이터 완료 ({len(day)}개 행)")
        
        # 월별 데이터
        logger.info(f"  └─ {code} 월별 데이터 수집 중...")
        mon = stock.get_market_ohlcv_by_date(START, END, code, freq="m")
        logger.info(f"  └─ {code} 월별 데이터 완료 ({len(mon)}개 행)")
        
        # 데이터 정규화
        day, mon = normalize(day), normalize(mon)
        wk = to_weekly(day)
        logger.info(f"  └─ {code} 주별 데이터 생성 완료 ({len(wk)}개 행)")
        
        logger.info(f"✅ {code} 모든 데이터 수집 완료!")
        return code, day, wk, mon
        
    except Exception as e:
        logger.error(f"❌ {code} 데이터 수집 실패: {str(e)}")
        raise

def save(code, day, wk, mon):
    try:
        for frame, suf in [(day,"D"), (wk,"W"), (mon,"M")]:
            p = f"{OUT}/{code}_{suf}.csv"
            frame.index.name = "date"
            frame.to_csv(p, encoding="utf-8")
        logger.info(f"💾 {code} 파일 저장 완료")
    except Exception as e:
        logger.error(f"❌ {code} 파일 저장 실패: {str(e)}")
        raise

def main():
    logger.info("🚀 주식 데이터 수집 시작!")
    logger.info(f"📅 기간: {START} ~ {END}")
    logger.info(f"📁 출력 폴더: {OUT}")
    logger.info(f"📈 대상 종목 수: {len(CODES)}개")
    
    # 동시성: 6~10 사이 추천 (과도한 동시성은 차단/오류↑). KIS/API 사용 시엔 API 제한에 맞춰 더 낮게.
    MAX_WORKERS = 8
    logger.info(f"🔧 동시 처리 워커 수: {MAX_WORKERS}")
    
    completed_count = 0
    error_count = 0
    
    # 진행률 바 생성
    pbar = tqdm(total=len(CODES), desc="📊 주식 데이터 수집", unit="종목")
    
    futures = []
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as ex:
        # 작업 제출
        for code in CODES:
            futures.append(ex.submit(fetch_one, code))
            sleep(0.05)  # 미세한 간격 두기(서버 부담/스파이크 완화)
        
        logger.info("📤 모든 작업 제출 완료, 결과 처리 시작...")
        
        # 결과 처리
        for fut in as_completed(futures):
            try:
                code, day, wk, mon = fut.result()
                save(code, day, wk, mon)
                completed_count += 1
                logger.info(f"🎯 {code} 완료 ({completed_count}/{len(CODES)})")
                
            except Exception as e:
                error_count += 1
                logger.error(f"💥 {code} 실패: {str(e)}")
            
            pbar.update(1)
            pbar.set_postfix({
                '완료': f'{completed_count}/{len(CODES)}',
                '실패': error_count,
                '진행률': f'{((completed_count + error_count) / len(CODES) * 100):.1f}%'
            })
    
    pbar.close()
    
    # 최종 결과 요약
    logger.info("=" * 50)
    logger.info("🏁 데이터 수집 완료!")
    logger.info(f"✅ 성공: {completed_count}개")
    logger.info(f"❌ 실패: {error_count}개")
    logger.info(f"📊 총 진행률: {(completed_count / len(CODES) * 100):.1f}%")
    logger.info(f"📁 결과 저장 위치: {os.path.abspath(OUT)}")
    logger.info("=" * 50)

if __name__ == "__main__":
    main()

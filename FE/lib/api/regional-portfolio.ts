import { RegionalPortfolioAnalysis } from '@/types/regional-portfolio';
import api from '@/app/config/api';

export const regionalPortfolioApi = {
  /**
   * 현재 로그인한 사용자의 지역별 포트폴리오 분석 결과를 조회합니다.
   */
  async getRegionalPortfolioAnalysis(): Promise<RegionalPortfolioAnalysis> {
    try {
      const response = await api.get('/portfolio/regional/analysis');
      return response.data;
    } catch (error: any) {
      console.error('지역별 포트폴리오 분석 조회 실패:', error);
      throw new Error(`지역별 포트폴리오 분석 조회 실패: ${error.response?.status || 'Unknown error'}`);
    }
  },
};

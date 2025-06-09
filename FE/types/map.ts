export interface Stock {
  name: string;
  symbol: string;
  change: number;
  emoji: string;
}

export interface Region {
  id: string;
  name: string;
  x: number;
  y: number;
  size: number;
  topStocks: Stock[];
}

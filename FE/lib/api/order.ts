import api from "@/app/config/api";

export interface OrderRequest {
  stockCode: string;
  orderType: "BUY" | "SELL";
  orderMethod: "LIMIT" | "MARKET";
  price: number;
  quantity: number;
}

export interface OrderResponse {
  id: number;
  stockCode: string;
  stockName: string;
  orderType: "BUY" | "SELL";
  orderMethod: "LIMIT" | "MARKET";
  price: number;
  quantity: number;
  totalAmount: number;
  status: "PENDING" | "PARTIAL_FILLED" | "FILLED" | "CANCELLED" | "REJECTED";
  filledQuantity: number;
  filledAmount: number;
  averageFilledPrice: number | null;
  orderTime: string;
  filledTime: string | null;
  cancelTime: string | null;
  rejectReason: string | null;
  createdAt: string;
  updatedAt: string;
  remainingQuantity: number;
  fillRate: number;
  statusMessage: string;
}

export interface OrdersPageResponse {
  content: OrderResponse[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

/**
 * 주문 생성
 */
export const createOrder = async (request: OrderRequest): Promise<OrderResponse> => {
  const response = await api.post("/orders", request);
  return response.data.data;
};

/**
 * 주문 조회
 */
export const getOrder = async (orderId: number): Promise<OrderResponse> => {
  const response = await api.get(`/orders/${orderId}`);
  return response.data.data;
};

/**
 * 주문 목록 조회
 */
export const getOrders = async (page: number = 0, size: number = 20): Promise<OrdersPageResponse> => {
  const response = await api.get(`/orders?page=${page}&size=${size}`);
  return response.data.data;
};

/**
 * 특정 종목 주문 목록 조회
 */
export const getOrdersByStock = async (stockSymbol: string, page: number = 0, size: number = 20): Promise<OrdersPageResponse> => {
  const response = await api.get(`/orders/stock/${stockSymbol}?page=${page}&size=${size}`);
  return response.data.data;
};

/**
 * 미체결 주문 목록 조회
 */
export const getPendingOrders = async (): Promise<OrderResponse[]> => {
  const response = await api.get("/orders/pending");
  return response.data.data;
};

/**
 * 주문 취소
 */
export const cancelOrder = async (orderId: number): Promise<OrderResponse> => {
  const response = await api.post(`/orders/${orderId}/cancel`);
  return response.data.data;
};

/**
 * 주문 상태 조회
 */
export const getOrderStatus = async (orderId: number): Promise<string> => {
  const response = await api.get(`/orders/${orderId}/status`);
  return response.data.data;
};

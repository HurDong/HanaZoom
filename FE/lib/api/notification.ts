import api from "@/app/config/api";

export interface NotificationItem {
  id: number;
  type: string;
  title: string;
  content: string;
  targetUrl: string;
  isRead: boolean;
  createdAt: string;
  stockSymbol?: string;
  stockName?: string;
  priceChangePercent?: number;
  currentPrice?: number;
  postId?: number;
  commentId?: number;
  mentionedBy?: string;
  emoji: string;
  timeAgo: string;
}

export interface NotificationResponse {
  content: NotificationItem[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

// 사용자별 알림 조회
export const getUserNotifications = async (
  page: number = 0,
  size: number = 20
): Promise<NotificationResponse> => {
  try {
    const response = await api.get(`/notifications?page=${page}&size=${size}`);
    return response.data;
  } catch (error: any) {
    console.error("알림 조회 실패:", error);

    // 404 에러인 경우 (API가 아직 준비되지 않음) 빈 응답 반환
    if (error.response?.status === 404) {
      console.log("알림 API가 아직 준비되지 않았습니다. 빈 응답을 반환합니다.");
      return {
        content: [],
        totalElements: 0,
        totalPages: 0,
        size: size,
        number: page,
      };
    }

    throw error;
  }
};

// 읽지 않은 알림 개수 조회
export const getUnreadCount = async (): Promise<number> => {
  try {
    const response = await api.get("/notifications/unread-count");
    return response.data.data;
  } catch (error: any) {
    console.error("읽지 않은 알림 개수 조회 실패:", error);

    // 404 에러인 경우 (API가 아직 준비되지 않음) 0 반환
    if (error.response?.status === 404) {
      console.log("알림 API가 아직 준비되지 않았습니다. 0을 반환합니다.");
      return 0;
    }

    throw error;
  }
};

// 알림 읽음 처리
export const markAsRead = async (notificationId: number): Promise<void> => {
  try {
    await api.patch(`/notifications/${notificationId}/read`);
  } catch (error) {
    console.error("알림 읽음 처리 실패:", error);
    throw error;
  }
};

// 모든 알림 읽음 처리
export const markAllAsRead = async (): Promise<void> => {
  try {
    await api.patch("/notifications/read-all");
  } catch (error) {
    console.error("모든 알림 읽음 처리 실패:", error);
    throw error;
  }
};

// 알림 삭제
export const deleteNotification = async (
  notificationId: number
): Promise<void> => {
  try {
    await api.delete(`/notifications/${notificationId}`);
  } catch (error) {
    console.error("알림 삭제 실패:", error);
    throw error;
  }
};

import api from "@/app/config/api";

export interface MemberInfoResponse {
  id: string;
  email: string;
  name: string;
  phone: string;
  address?: string | null;
  detailAddress?: string | null;
  zonecode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  regionId?: number | null;
  loginType: string;
  termsAgreed: boolean;
  privacyAgreed: boolean;
  marketingAgreed: boolean;
  createdAt?: string;
  lastLoginAt?: string | null;
}

export interface LocationUpdateRequest {
  address?: string;
  detailAddress?: string;
  zonecode?: string;
  latitude?: number | null;
  longitude?: number | null;
}

export const getMyInfo = async (): Promise<MemberInfoResponse> => {
  const res = await api.get("/members/me");
  return res.data.data as MemberInfoResponse;
};

export const updateMyLocation = async (
  data: LocationUpdateRequest
): Promise<void> => {
  await api.put("/members/location", data);
};

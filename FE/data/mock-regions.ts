export interface Region {
  id: number;
  name: string;
  type: "CITY" | "DISTRICT" | "NEIGHBORHOOD";
  latitude: number;
  longitude: number;
  parent_id?: number;
}

export const mockRegions: Region[] = [
  // 시/도 (Level 1)
  {
    id: 1,
    name: "서울특별시",
    type: "CITY",
    latitude: 37.5665,
    longitude: 126.978,
  },
  {
    id: 2,
    name: "경기도",
    type: "CITY",
    latitude: 37.2751,
    longitude: 127.0094,
  },

  // 서울특별시 구 (Level 2)
  {
    id: 101,
    name: "강남구",
    type: "DISTRICT",
    parent_id: 1,
    latitude: 37.5172,
    longitude: 127.0473,
  },
  {
    id: 102,
    name: "종로구",
    type: "DISTRICT",
    parent_id: 1,
    latitude: 37.5729,
    longitude: 126.9794,
  },
  {
    id: 103,
    name: "마포구",
    type: "DISTRICT",
    parent_id: 1,
    latitude: 37.5662,
    longitude: 126.9015,
  },

  // 경기도 시/군 (Level 2)
  {
    id: 201,
    name: "수원시",
    type: "DISTRICT",
    parent_id: 2,
    latitude: 37.2636,
    longitude: 127.0286,
  },
  {
    id: 202,
    name: "성남시",
    type: "DISTRICT",
    parent_id: 2,
    latitude: 37.4206,
    longitude: 127.1269,
  },
  {
    id: 203,
    name: "고양시",
    type: "DISTRICT",
    parent_id: 2,
    latitude: 37.6584,
    longitude: 126.832,
  },

  // 강남구 동 (Level 3)
  {
    id: 10101,
    name: "역삼동",
    type: "NEIGHBORHOOD",
    parent_id: 101,
    latitude: 37.5006,
    longitude: 127.0367,
  },
  {
    id: 10102,
    name: "논현동",
    type: "NEIGHBORHOOD",
    parent_id: 101,
    latitude: 37.5114,
    longitude: 127.0294,
  },
  {
    id: 10103,
    name: "삼성동",
    type: "NEIGHBORHOOD",
    parent_id: 101,
    latitude: 37.5145,
    longitude: 127.0572,
  },

  // 종로구 동 (Level 3)
  {
    id: 10201,
    name: "사직동",
    type: "NEIGHBORHOOD",
    parent_id: 102,
    latitude: 37.5755,
    longitude: 126.9698,
  },
  {
    id: 10202,
    name: "삼청동",
    type: "NEIGHBORHOOD",
    parent_id: 102,
    latitude: 37.5822,
    longitude: 126.9811,
  },
  {
    id: 10203,
    name: "가회동",
    type: "NEIGHBORHOOD",
    parent_id: 102,
    latitude: 37.583,
    longitude: 126.9856,
  },

  // 수원시 팔달구 동 (Level 3)
  {
    id: 20101,
    name: "인계동",
    type: "NEIGHBORHOOD",
    parent_id: 201,
    latitude: 37.2628,
    longitude: 127.0318,
  },
  {
    id: 20102,
    name: "행궁동",
    type: "NEIGHBORHOOD",
    parent_id: 201,
    latitude: 37.2831,
    longitude: 127.0145,
  },

  // 성남시 분당구 동 (Level 3)
  {
    id: 20201,
    name: "정자동",
    type: "NEIGHBORHOOD",
    parent_id: 202,
    latitude: 37.3695,
    longitude: 127.1089,
  },
  {
    id: 20202,
    name: "서현동",
    type: "NEIGHBORHOOD",
    parent_id: 202,
    latitude: 37.3855,
    longitude: 127.1235,
  },
];

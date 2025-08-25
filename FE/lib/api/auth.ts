// 비밀번호 찾기 - 인증 코드 발송
export const sendPasswordResetCode = async (email: string): Promise<void> => {
  const response = await api.post("/members/forgot-password/send-code", {
    email,
  });
  return response.data;
};

// 비밀번호 찾기 - 비밀번호 재설정
export const resetPassword = async (
  email: string,
  code: string,
  newPassword: string
): Promise<void> => {
  const response = await api.post("/members/forgot-password/reset", {
    email,
    code,
    newPassword,
  });
  return response.data;
};

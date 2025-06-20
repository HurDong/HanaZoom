export const setTokens = (accessToken: string, refreshToken: string) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
  }
};

export const getAccessToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("accessToken");
  }
  return null;
};

export const getRefreshToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("refreshToken");
  }
  return null;
};

export const removeTokens = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.setItem("isLoggingOut", "true");
    setTimeout(() => {
      localStorage.removeItem("isLoggingOut");
    }, 1000);
  }
};

export const isLoggedIn = () => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("accessToken");
    return !!token;
  }
  return false;
};

export const isLoggingOut = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("isLoggingOut") === "true";
  }
  return false;
};

  // src/utils/auth.ts
  export function setToken(token: string) {
    sessionStorage.setItem("token", token);
  }

  export function getToken() {
    return sessionStorage.getItem("token");
  }

  export function removeToken() {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("userId");
  }

  export function isLogin() {
    return !!getToken();
  }
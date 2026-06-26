import axios from 'axios';

const http = axios.create({
  baseURL: 'http://localhost:8080',
  timeout: 10000,
});

// 请求拦截器
http.interceptors.request.use((config) => {
  
  
  try {
    // 从 sessionStorage 拿 token
    const token = sessionStorage.getItem('token');
    if (token) {
      config.headers.token = token;
    }
  } catch (e) {}

  return config;
});

// 响应拦截器
http.interceptors.response.use((response) => {
  
  return response;
});

export default http;
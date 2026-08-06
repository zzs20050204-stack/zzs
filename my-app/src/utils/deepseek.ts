import http from './http/http';

export type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

export async function chatDeepSeek(messages: ChatMessage[]) {
  const res = await http.post('/api/ai/chat', { messages });
  return res.data;
}

export function chatDeepSeekStream(
  messages: ChatMessage[],
  onToken: (token: string) => void,
  onDone: () => void,
  onError: (err: string) => void,
): AbortController {
  const controller = new AbortController();
  const token = sessionStorage.getItem('token') || '';

  fetch('http://localhost:8080/api/ai/chat/stream', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'token': token,
    },
    body: JSON.stringify({ messages }),
    signal: controller.signal,
  }).then(async (response) => {
    if (!response.ok) {
      if (response.status === 401) onError('请先登录后再使用AI助手');
      else onError('请求失败: ' + response.status);
      return;
    }
    const reader = response.body?.getReader();
    if (!reader) { onError('浏览器不支持流式读取'); return; }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // Spring SseEmitter format: "event:token\ndata:你好\n\n"
      // Split on double-newline to get complete events
      const parts = buffer.split('\n\n');
      buffer = parts.pop() || '';

      for (const part of parts) {
        const lines = part.split('\n');
        let eventName = '';
        let eventData = '';
        for (const line of lines) {
          if (line.startsWith('event:')) {
            eventName = line.slice(6).trim();
          } else if (line.startsWith('data:')) {
            eventData = line.slice(5).trim();
          }
        }

        if (eventName === 'token' && eventData) {
          onToken(eventData);
        } else if (eventName === 'done') {
          onDone();
          return;
        } else if (eventName === 'error') {
          onError(eventData || '未知错误');
          return;
        }
      }
    }
    onDone();
  }).catch((err) => {
    if (err.name !== 'AbortError') onError(err.message || '网络错误');
  });

  return controller;
}

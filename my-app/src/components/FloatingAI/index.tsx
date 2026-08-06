import { useState, useRef, useEffect, useCallback } from 'react';
import { Avatar, Input, Button, Space, Typography, Badge } from 'antd';
import { RobotOutlined, UserOutlined, SendOutlined, CloseOutlined } from '@ant-design/icons';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { chatDeepSeekStream, ChatMessage } from '../../utils/deepseek';
import './style.css';

const { Text } = Typography;

const STORAGE_KEY_PREFIX = 'ai_chat_';
const MAX_HISTORY = 60;

function loadHistory(key: string): ChatMessage[] {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveHistory(key: string, messages: ChatMessage[]) {
  const trimmed = messages.length > MAX_HISTORY ? messages.slice(-MAX_HISTORY) : messages;
  sessionStorage.setItem(key, JSON.stringify(trimmed));
}

export default function FloatingAI() {
  const username = useSelector((state: RootState) => state.auth.username) || 'anon';
  const currentKey = useSelector((state: RootState) => state.menu.currentKey);
  const storageKey = STORAGE_KEY_PREFIX + username;

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadHistory(storageKey));
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [unread, setUnread] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    saveHistory(storageKey, messages);
  }, [messages, storageKey]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  const doSend = useCallback((text: string) => {
    const updated: ChatMessage[] = [...messages, { role: 'user', content: text }];
    setMessages(updated);
    setLoading(true);

    chatDeepSeekStream(
      updated,
      (token) => {
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last && last.role === 'assistant') {
            return [...prev.slice(0, -1), { ...last, content: last.content + token }];
          }
          return [...prev, { role: 'assistant', content: token }];
        });
      },
      () => setLoading(false),
      () => {
        setMessages(prev => [...prev, { role: 'assistant', content: '抱歉，请求失败，请稍后重试。' }]);
        setLoading(false);
      }
    );
  }, [messages]);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    setInput('');
    doSend(text);
  };

  const handleToggle = () => {
    setOpen(prev => {
      if (prev) {
        setUnread(0);
      }
      return !prev;
    });
  };

  return (
    <>
      {/* 浮动小人按钮 */}
      <div
        className={`floating-ai-btn ${open || currentKey === '/ai-assistant' ? 'hidden' : ''}`}
        onClick={handleToggle}
        title="有问题？问小智！"
      >
        <Badge count={unread} size="small" offset={[-3, 3]}>
          <div className="floating-avatar-bg">
            <RobotOutlined className="floating-icon" />
          </div>
        </Badge>
        <div className="floating-label">小智</div>
      </div>

      {/* 聊天面板 */}
      <div className={`floating-panel ${open ? 'open' : ''}`}>
        <div className="floating-panel-header">
          <Space>
            <Avatar icon={<RobotOutlined />} size={28} style={{ background: 'linear-gradient(135deg, #52c41a, #1890ff)' }} />
            <span style={{ fontWeight: 600, fontSize: 14 }}>小智</span>
          </Space>
          <Button
            type="text"
            size="small"
            icon={<CloseOutlined />}
            onClick={() => setOpen(false)}
          />
        </div>

        <div className="floating-panel-body" ref={listRef}>
          {messages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 16px' }}>
              <Avatar icon={<RobotOutlined />} size={40} style={{ background: 'linear-gradient(135deg, #52c41a, #1890ff)', marginBottom: 10 }} />
              <div style={{ fontWeight: 600, marginBottom: 4 }}>你好，我是小智</div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                智慧社区专属助手，可以问我报修、缴费、访客等问题
              </Text>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  display: 'flex', gap: 8, marginBottom: 12,
                  flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                }}
              >
                <Avatar
                  icon={msg.role === 'user' ? <UserOutlined /> : <RobotOutlined />}
                  size={24}
                  style={{
                    background: msg.role === 'user' ? '#1677ff' : 'linear-gradient(135deg, #52c41a, #1890ff)',
                    flexShrink: 0, fontSize: 12,
                  }}
                />
                <div
                  style={{
                    maxWidth: '75%',
                    padding: '8px 10px',
                    borderRadius: 10,
                    background: msg.role === 'user' ? '#1677ff' : '#f5f5f5',
                    color: msg.role === 'user' ? '#fff' : '#333',
                    lineHeight: 1.55,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    fontSize: 12.5,
                    borderTopLeftRadius: msg.role === 'assistant' ? 3 : 10,
                    borderTopRightRadius: msg.role === 'user' ? 3 : 10,
                  }}
                >
                  {msg.content}
                </div>
              </div>
            ))
          )}
          {loading && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <Avatar icon={<RobotOutlined />} size={24} style={{ background: 'linear-gradient(135deg, #52c41a, #1890ff)', flexShrink: 0, fontSize: 12 }} />
              <div style={{ padding: '8px 14px', borderRadius: 10, background: '#f5f5f5', borderTopLeftRadius: 3 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>正在输入...</Text>
              </div>
            </div>
          )}
        </div>

        <div className="floating-panel-footer">
          <Space.Compact style={{ width: '100%' }}>
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              onPressEnter={handleSend}
              placeholder="输入问题..."
              disabled={loading}
              size="small"
              style={{ fontSize: 12 }}
            />
            <Button
              type="primary"
              size="small"
              icon={<SendOutlined />}
              onClick={handleSend}
              loading={loading}
            />
          </Space.Compact>
        </div>
      </div>
    </>
  );
}

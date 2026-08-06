import { useState, useRef, useEffect, useCallback } from 'react';
import { Card, Input, Button, Space, Typography, Avatar, Tag, Popconfirm } from 'antd';
import { RobotOutlined, UserOutlined, SendOutlined, BulbOutlined, DeleteOutlined } from '@ant-design/icons';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { chatDeepSeekStream, ChatMessage } from '../../utils/deepseek';

const { Text, Title } = Typography;

const STORAGE_KEY_PREFIX = 'ai_chat_';
const MAX_HISTORY = 60;

const suggestions = [
  { label: '怎么在线报修', text: '我想报修家里的东西坏了，在在线报修里怎么操作？', icon: '\u{1F527}' },
  { label: '怎么交物业费', text: '物业缴费在哪里？怎么交物业费？', icon: '\u{1F4B0}' },
  { label: '访客预约流程', text: '家里要来客人，访客预约怎么办理？', icon: '\u{1F3E0}' },
  { label: '怎么买商品', text: '如何在商品页面购买东西？下单后怎么查看物流？', icon: '\u{1F6CD}' },
  { label: '订单状态说明', text: '订单有哪些状态？每个状态代表什么意思？', icon: '\u{1F4E6}' },
  { label: '怎么提建议', text: '我想给物业提建议，在建议反馈里怎么提交？', icon: '\u{1F4DD}' },
];

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

export default function AiAssistant() {
  const username = useSelector((state: RootState) => state.auth.username) || 'anon';
  const storageKey = STORAGE_KEY_PREFIX + username;

  const [messages, setMessages] = useState<ChatMessage[]>(() => loadHistory(storageKey));
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => { saveHistory(storageKey, messages); }, [messages, storageKey]);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
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
        setMessages(prev => [...prev, { role: 'assistant', content: '抱歉，请求失败，请检查后端服务和API Key配置。' }]);
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

  const handleClear = () => {
    setMessages([]);
    sessionStorage.removeItem(storageKey);
  };

  const isEmpty = messages.length === 0;

  return (
    <div style={{
      height: 'calc(100vh - 120px)',
      display: 'flex',
      flexDirection: 'column',
      maxWidth: 780,
      margin: '0 auto',
      width: '100%',
    }}>
      {/* 顶部标题栏 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 24px',
        borderBottom: '1px solid #f0f0f0',
        background: 'rgba(255,255,255,0.6)',
        backdropFilter: 'blur(10px)',
        flexShrink: 0,
        borderRadius: '0 0 0 0',
      }}>
        <Space>
          <Avatar
            icon={<RobotOutlined />}
            size={36}
            style={{ background: 'linear-gradient(135deg, #52c41a, #1890ff)', boxShadow: '0 2px 8px rgba(82,196,26,0.3)' }}
          />
          <div>
            <div style={{ fontWeight: 600, fontSize: 15, lineHeight: 1.3 }}>小智</div>
            <Text type="secondary" style={{ fontSize: 11 }}>在线 · 智慧社区专属助手</Text>
          </div>
        </Space>
        {!isEmpty && (
          <Popconfirm title="确定清空所有聊天记录？" onConfirm={handleClear} okText="确定" cancelText="取消">
            <Button size="small" type="text" icon={<DeleteOutlined />} danger>
              清空记录
            </Button>
          </Popconfirm>
        )}
      </div>

      {/* 聊天区域 */}
      <div
        ref={listRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: isEmpty ? '40px 24px' : '20px 24px',
          minHeight: 0,
          background: 'linear-gradient(180deg, #f8fafb 0%, #ffffff 100%)',
        }}
      >
        {isEmpty ? (
          /* 欢迎页 */
          <div style={{ textAlign: 'center', paddingTop: 60 }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: 'linear-gradient(135deg, #52c41a 0%, #1890ff 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
              boxShadow: '0 8px 30px rgba(82,196,26,0.25)',
              animation: 'pulse-glow 2.5s ease-in-out infinite',
            }}>
              <RobotOutlined style={{ fontSize: 36, color: '#fff' }} />
            </div>
            <Title level={3} style={{ marginBottom: 8, fontWeight: 700 }}>你好，我是小智</Title>
            <Text type="secondary" style={{ fontSize: 14, display: 'block', marginBottom: 32 }}>
              你的智慧社区专属助手，随时解答社区生活问题
            </Text>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: 10,
              maxWidth: 500,
              margin: '0 auto',
              padding: '0 12px',
            }}>
              {suggestions.map((s, i) => (
                <div
                  key={i}
                  onClick={() => doSend(s.text)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '12px 16px',
                    borderRadius: 12,
                    background: '#fff',
                    border: '1px solid #e8e8e8',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    fontSize: 13,
                    color: '#333',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#1890ff';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(24,144,255,0.1)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e8e8e8';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <span style={{ fontSize: 18 }}>{s.icon}</span>
                  <span>{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* 消息列表 */
          messages.map((msg, i) => (
            <div
              key={i}
              style={{
                display: 'flex', gap: 12, marginBottom: 20,
                flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                animation: 'msg-in 0.3s ease-out',
              }}
            >
              <Avatar
                icon={msg.role === 'user' ? <UserOutlined /> : <RobotOutlined />}
                size={34}
                style={{
                  background: msg.role === 'user'
                    ? '#1677ff'
                    : 'linear-gradient(135deg, #52c41a, #1890ff)',
                  flexShrink: 0,
                  boxShadow: msg.role === 'assistant'
                    ? '0 2px 8px rgba(82,196,26,0.2)'
                    : '0 2px 8px rgba(22,119,255,0.2)',
                }}
              />
              <div style={{ maxWidth: '68%', display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: 16,
                    background: msg.role === 'user'
                      ? 'linear-gradient(135deg, #1677ff, #4096ff)'
                      : '#fff',
                    color: msg.role === 'user' ? '#fff' : '#333',
                    lineHeight: 1.65,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    fontSize: 14,
                    borderTopRightRadius: msg.role === 'user' ? 4 : 16,
                    borderTopLeftRadius: msg.role === 'assistant' ? 4 : 16,
                    boxShadow: msg.role === 'user'
                      ? '0 2px 12px rgba(22,119,255,0.25)'
                      : '0 1px 6px rgba(0,0,0,0.06)',
                    border: msg.role === 'assistant' ? '1px solid #f0f0f0' : 'none',
                  }}
                >
                  {msg.content}
                </div>
              </div>
            </div>
          ))
        )}
        {loading && (
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, animation: 'msg-in 0.3s ease-out' }}>
            <Avatar
              icon={<RobotOutlined />}
              size={34}
              style={{ background: 'linear-gradient(135deg, #52c41a, #1890ff)', flexShrink: 0, boxShadow: '0 2px 8px rgba(82,196,26,0.2)' }}
            />
            <div style={{
              padding: '14px 20px',
              borderRadius: 16,
              borderTopLeftRadius: 4,
              background: '#fff',
              border: '1px solid #f0f0f0',
              boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}>
              <span className="typing-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#bbb', animation: 'typing 1.4s infinite' }} />
              <span className="typing-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#bbb', animation: 'typing 1.4s 0.2s infinite' }} />
              <span className="typing-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#bbb', animation: 'typing 1.4s 0.4s infinite' }} />
            </div>
          </div>
        )}
      </div>

      {/* 底部输入区 */}
      <div style={{
        padding: '16px 24px',
        borderTop: '1px solid #f0f0f0',
        background: '#fff',
        flexShrink: 0,
      }}>
        <Space.Compact style={{ width: '100%' }}>
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            onPressEnter={handleSend}
            placeholder="输入问题，比如：物业费怎么交？报修流程是什么？"
            disabled={loading}
            size="large"
            style={{ borderRadius: '10px 0 0 10px', fontSize: 14 }}
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSend}
            loading={loading}
            size="large"
            style={{ borderRadius: '0 10px 10px 0', minWidth: 80 }}
          >
            发送
          </Button>
        </Space.Compact>
      </div>

      {/* 动画样式注入 */}
      <style>{`
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 8px 30px rgba(82,196,26,0.25); }
          50% { box-shadow: 0 8px 40px rgba(82,196,26,0.45); }
        }
        @keyframes msg-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes typing {
          0%, 60%, 100% { opacity: 0.3; }
          30% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

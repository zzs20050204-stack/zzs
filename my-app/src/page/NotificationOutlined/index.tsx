import { useState, useEffect } from 'react';
import {
  Button, Input, Modal, Form, message,
  Popconfirm, Card, Typography, Empty, Checkbox, Tag, Space, Switch, DatePicker, Skeleton, Avatar
} from 'antd';
import {
  PlusOutlined, DeleteOutlined, PushpinFilled,
  ClockCircleOutlined, UserOutlined, SoundFilled, CalendarOutlined,
  SearchOutlined, FireOutlined, AudioOutlined
} from '@ant-design/icons';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';
import http from '../../utils/http/http';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

const { Text, Title, Paragraph } = Typography;

interface NoticeItem {
  id: number;
  title: string;
  content: string;
  userId: number;
  createTime?: string;
  isTop: number;
  expireTime?: string;
  isExpired?: boolean;
}

// 为每个公告生成稳定的装饰色
const palette = ['#55c4ae', '#5b8def', '#f0a05d', '#eb6f92', '#a78bfa', '#38bdf8', '#fb923c', '#34d399'];
const getColor = (id: number) => palette[id % palette.length];

function Notification() {
  const [form] = Form.useForm();
  const [noticeList, setNoticeList] = useState<NoticeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const [anonymous, setAnonymous] = useState(false);
  const [userMap, setUserMap] = useState<Record<number, string>>({});
  const [searchText, setSearchText] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const { token, username } = useSelector((state: RootState) => state.auth);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const res = await http.get('/getInfo');
        if (res.data.code === 200) {
          setCurrentUserId(res.data.data.id);
          setIsAdmin(res.data.data.role === '管理员');
        }
      } catch {}
    };
    fetchInfo();
    getNoticeList();
  }, [token]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await http.get('/user/list');
        const users = res.data.data || res.data || [];
        const map: Record<number, string> = {};
        users.forEach((u: any) => { map[u.id] = u.username; });
        setUserMap(map);
      } catch {}
    };
    fetchUsers();
  }, []);

  const getNoticeList = async () => {
    setLoading(true);
    try {
      const res = await http.get('/notice/user/list');
      let list: NoticeItem[] = res.data.data || [];
      list = list.map(item => ({
        ...item,
        isExpired: item.expireTime ? dayjs(item.expireTime).isBefore(dayjs()) : false,
      }));
      setNoticeList(list);
    } catch {
      message.error('加载公告失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!currentUserId) return message.error('请登录');
    try {
      const values = await form.validateFields();
      const content = anonymous ? values.content + '||ANON||' : values.content;
      const postData: Record<string, any> = { title: values.title, content };
      if (isAdmin) {
        postData.isTop = values.isTop ? 1 : 0;
        if (values.expireTime) postData.expireTime = dayjs(values.expireTime).format('YYYY-MM-DD HH:mm:ss');
      }
      await http.post('/notice/user/add', postData, { params: { userId: currentUserId } });
      message.success('发布成功');
      setVisible(false);
      form.resetFields();
      setAnonymous(false);
      getNoticeList();
    } catch {
      message.error('发布失败');
    }
  };

  const handleDelete = async (item: NoticeItem) => {
    try {
      if (isAdmin) {
        await http.delete('/notice/admin/delete', { params: { id: item.id } });
      } else {
        await http.delete('/notice/user/delete', { params: { id: item.id, loginUserId: currentUserId } });
      }
      message.success('删除成功');
      getNoticeList();
    } catch { message.error('删除失败'); }
  };

  const handleToggleTop = async (id: number, currentTop: number) => {
    try {
      await http.put('/notice/toggleTop', null, { params: { id, isTop: currentTop === 1 ? 0 : 1 } });
      message.success(currentTop === 1 ? '已取消置顶' : '已置顶');
      getNoticeList();
    } catch { message.error('操作失败'); }
  };

  const openModal = () => { form.resetFields(); setVisible(true); };

  const toggleExpand = (id: number) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const filteredList = noticeList.filter(item =>
    item.title.includes(searchText) || item.content.includes(searchText)
  );
  const topNotices = filteredList.filter(item => item.isTop === 1);
  const normalNotices = filteredList.filter(item => item.isTop !== 1);

  const renderCard = (item: NoticeItem) => {
    const isAnon = (item.content || '').endsWith('||ANON||');
    const realContent = item.content.replace('||ANON||', '');
    const realName = userMap[item.userId] || `用户${item.userId}`;
    const displayName = isAdmin ? realName : (isAnon ? '匿名用户' : realName);
    const color = getColor(item.id);
    const isExpanded = expandedIds.has(item.id);
    const isLong = realContent.length > 100;
    const isTop = item.isTop === 1;

    return (
      <div
        key={item.id}
        style={{
          position: 'relative',
          background: '#fff',
          borderRadius: 16,
          padding: 0,
          overflow: 'hidden',
          boxShadow: isTop
            ? '0 4px 24px rgba(255,77,79,0.12), 0 1px 4px rgba(0,0,0,0.04)'
            : '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)',
          transition: 'all 0.25s ease',
          cursor: 'default',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
          (e.currentTarget as HTMLDivElement).style.boxShadow = isTop
            ? '0 8px 30px rgba(255,77,79,0.18), 0 2px 8px rgba(0,0,0,0.06)'
            : '0 6px 20px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
          (e.currentTarget as HTMLDivElement).style.boxShadow = isTop
            ? '0 4px 24px rgba(255,77,79,0.12), 0 1px 4px rgba(0,0,0,0.04)'
            : '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)';
        }}
      >
        {/* 顶部颜色条 */}
        <div
          style={{
            height: 4,
            background: item.isExpired
              ? '#e5e5e5'
              : isTop
                ? 'linear-gradient(90deg, #ff4d4f, #ff7875)'
                : `linear-gradient(90deg, ${color}, ${color}88)`,
          }}
        />

        <div style={{ padding: '20px 24px 16px' }}>
          {/* 标题行 */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                flexShrink: 0,
                background: item.isExpired ? '#f5f5f5' : `${color}15`,
                color: item.isExpired ? '#d0d0d0' : color,
              }}
            >
              {isTop ? <PushpinFilled /> : <AudioOutlined />}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <Text
                  strong
                  style={{
                    fontSize: 15,
                    color: item.isExpired ? '#bfbfbf' : '#1a1a2e',
                    textDecoration: item.isExpired ? 'line-through' : 'none',
                  }}
                >
                  {item.title}
                </Text>
                {isTop && (
                  <Tag
                    color="red"
                    style={{ borderRadius: 6, margin: 0, fontSize: 11, lineHeight: '20px', padding: '0 8px' }}
                  >
                    置顶
                  </Tag>
                )}
                {item.isExpired && (
                  <Tag
                    style={{
                      borderRadius: 6, margin: 0, fontSize: 11,
                      background: '#f5f5f5', color: '#bfbfbf', border: 'none',
                      lineHeight: '20px', padding: '0 8px',
                    }}
                  >
                    已过期
                  </Tag>
                )}
                {isAnon ? (
                  <Tag style={{ borderRadius: 6, margin: 0, fontSize: 11, background: '#f5f5f5', color: '#8c8c8c', border: 'none', lineHeight: '20px', padding: '0 8px' }}>匿名</Tag>
                ) : (
                  <Tag style={{ borderRadius: 6, margin: 0, fontSize: 11, background: `${color}15`, color: color, border: 'none', lineHeight: '20px', padding: '0 8px' }}>实名</Tag>
                )}
              </div>
            </div>

            {/* 操作按钮 */}
            <Space size={2} style={{ flexShrink: 0 }}>
              {isAdmin && (
                <Button
                  size="small"
                  type="text"
                  onClick={() => handleToggleTop(item.id, item.isTop)}
                  style={{ color: isTop ? '#ff4d4f' : '#8c8c8c', fontSize: 12 }}
                >
                  {isTop ? '取消置顶' : '置顶'}
                </Button>
              )}
              <Popconfirm title="确定删除这条公告？" onConfirm={() => handleDelete(item)} okText="确定" cancelText="取消">
                <Button type="text" danger size="small" icon={<DeleteOutlined />} />
              </Popconfirm>
            </Space>
          </div>

          {/* 内容 */}
          <div style={{ paddingLeft: 52 }}>
            <div
              style={{
                background: item.isExpired ? '#fafafa' : '#f9fafb',
                borderRadius: 12,
                padding: '14px 16px',
                marginBottom: 14,
                border: item.isExpired ? '1px solid #f0f0f0' : '1px solid #f0f4ff',
              }}
            >
              {isLong && !isExpanded ? (
                <Paragraph
                  ellipsis={{ rows: 2 }}
                  style={{ margin: 0, color: item.isExpired ? '#d0d0d0' : '#4a4a5a', lineHeight: 1.7, fontSize: 14 }}
                >
                  {realContent}
                </Paragraph>
              ) : (
                <Paragraph style={{ margin: 0, color: item.isExpired ? '#d0d0d0' : '#4a4a5a', lineHeight: 1.7, fontSize: 14, whiteSpace: 'pre-wrap' }}>
                  {realContent}
                </Paragraph>
              )}
              {isLong && (
                <Button
                  type="link"
                  size="small"
                  onClick={() => toggleExpand(item.id)}
                  style={{ padding: 0, marginTop: 6, fontSize: 12 }}
                >
                  {isExpanded ? '收起 ↑' : '展开全文 ↓'}
                </Button>
              )}
            </div>

            {/* 底部 meta */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Space size={8}>
                <Avatar
                  size={22}
                  icon={<UserOutlined />}
                  style={{ backgroundColor: color, flexShrink: 0 }}
                />
                <Text style={{ fontSize: 13, color: '#6b7280' }}>{displayName}</Text>
              </Space>
              <Space size={16}>
                {item.expireTime && (
                  <Text style={{ fontSize: 12, color: '#9ca3af' }}>
                    <CalendarOutlined style={{ marginRight: 4 }} />
                    {dayjs(item.expireTime).format('MM/DD HH:mm')} 截止
                  </Text>
                )}
                <Text style={{ fontSize: 12, color: '#9ca3af' }}>
                  <ClockCircleOutlined style={{ marginRight: 4 }} />
                  {item.createTime ? dayjs(item.createTime).fromNow() : ''}
                </Text>
              </Space>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fc' }}>
      {/* Hero */}
      <div
        style={{
          background: 'linear-gradient(135deg, #55c4ae 0%, #7ed3bf 50%, #a8e4d6 100%)',
          padding: '28px 32px 34px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ maxWidth: 880, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <Space size={12} align="center">
              <div style={{
                width: 42, height: 42, borderRadius: 12,
                background: 'rgba(255,255,255,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <SoundFilled style={{ fontSize: 20, color: '#fff' }} />
              </div>
              <div>
                <Title level={3} style={{ color: '#fff', margin: 0, fontWeight: 600 }}>
                  社区公告
                </Title>
                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>
                  {filteredList.length} 条公告 · 了解社区最新动态
                </Text>
              </div>
            </Space>

            <Space size={10}>
              <Input
                placeholder="搜索公告..."
                prefix={<SearchOutlined style={{ color: 'rgba(255,255,255,0.5)' }} />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
                style={{ width: 200, borderRadius: 8 }}
              />
              <Button
                icon={<PlusOutlined />}
                onClick={openModal}
                style={{ borderRadius: 8, fontWeight: 500, background: '#fff', color: '#55c4ae', border: 'none' }}
              >
                发布公告
              </Button>
            </Space>
          </div>
        </div>
      </div>

      {/* 内容 */}
      <div style={{ maxWidth: 880, margin: '0 auto', padding: '24px 24px', marginTop: -16, position: 'relative', zIndex: 2 }}>
        {loading ? (
          <Card style={{ borderRadius: 16, border: 'none', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <Skeleton active avatar paragraph={{ rows: 4 }} />
            <div style={{ height: 16 }} />
            <Skeleton active avatar paragraph={{ rows: 2 }} />
          </Card>
        ) : filteredList.length === 0 ? (
          <Card style={{ borderRadius: 16, border: 'none', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', textAlign: 'center', padding: '80px 0' }}>
            <Empty
              image={
                <div style={{
                  width: 72, height: 72, borderRadius: '50%', margin: '0 auto 20px',
                  background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <SoundFilled style={{ fontSize: 28, color: '#d0d0d0' }} />
                </div>
              }
              description={<Text style={{ color: '#999' }}>暂无公告，社区很安静</Text>}
            />
          </Card>
        ) : (
          <>
            {/* 置顶区 */}
            {topNotices.length > 0 && (
              <div style={{ marginBottom: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, paddingLeft: 4 }}>
                  <FireOutlined style={{ color: '#ff4d4f', fontSize: 16 }} />
                  <Text strong style={{ fontSize: 15, color: '#ff4d4f' }}>置顶公告</Text>
                  <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, #ff4d4f, transparent)', marginLeft: 8 }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
                  {topNotices.map(renderCard)}
                </div>
              </div>
            )}

            {/* 普通公告区 */}
            {normalNotices.length > 0 && (
              <div>
                {topNotices.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, paddingLeft: 4 }}>
                    <ClockCircleOutlined style={{ color: '#9ca3af', fontSize: 16 }} />
                    <Text strong style={{ fontSize: 15, color: '#374151' }}>全部公告</Text>
                    <div style={{ flex: 1, height: 1, background: '#e5e7eb', marginLeft: 8 }} />
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
                  {normalNotices.map(renderCard)}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* 弹窗 */}
      <Modal
        open={visible}
        title={<Space><SoundFilled style={{ color: '#55c4ae' }} /><span>发布社区公告</span></Space>}
        onCancel={() => setVisible(false)}
        onOk={handleSave}
        width={560}
        maskClosable={false}
        okText="确定" cancelText="取消"
      >
        <Form form={form} layout="vertical" style={{ marginTop: 8 }}>
          <Form.Item name="title" label="公告标题" rules={[{ required: true, message: '请输入标题' }]}>
            <Input placeholder="请输入标题" maxLength={50} showCount />
          </Form.Item>
          <Form.Item name="content" label="公告内容" rules={[{ required: true, message: '请输入内容' }]}>
            <Input.TextArea rows={5} placeholder="请输入内容" maxLength={500} showCount />
          </Form.Item>
          {isAdmin && (
            <>
              <Form.Item name="isTop" label="置顶公告" valuePropName="checked">
                <Switch />
              </Form.Item>
              <Form.Item name="expireTime" label="有效期（不选则永久有效）">
                <DatePicker showTime style={{ width: '100%' }} placeholder="选择过期时间" format="YYYY-MM-DD HH:mm:ss" />
              </Form.Item>
            </>
          )}
          <div style={{ background: '#f9fafb', borderRadius: 10, padding: '12px 16px' }}>
            <Checkbox checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)}>
              匿名发布
            </Checkbox>
            <div style={{ marginTop: 6, color: '#8c8c8c', fontSize: 13 }}>
              <UserOutlined style={{ marginRight: 4 }} />
              当前身份：{anonymous ? '匿名用户' : username}
            </div>
          </div>
        </Form>
      </Modal>
    </div>
  );
}

export default Notification;

import { useState, useEffect, useCallback, useRef } from 'react';
import { Popover, List, Badge, Typography, Empty, Spin, Tabs, Button } from 'antd';
import {
  BellOutlined,
  WarningOutlined,
  UsergroupAddOutlined,
  ShoppingCartOutlined,
  PayCircleOutlined,
  MessageOutlined,
  NotificationOutlined,
  ReloadOutlined,
  ClearOutlined,
} from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { setMenuKey } from '../../utils/menuSlice';
import { RootState } from '../../store';
import http from '../../utils/http/http';

const { Text } = Typography;

interface NotificationItem {
  id: string;
  type: string;
  icon: string;
  title: string;
  content: string;
  time: string;
  status: string;
}

const iconMap: Record<string, React.ReactNode> = {
  repair: <WarningOutlined style={{ color: '#ff4d4f' }} />,
  visitor: <UsergroupAddOutlined style={{ color: '#1890ff' }} />,
  order: <ShoppingCartOutlined style={{ color: '#52c41a' }} />,
  property: <PayCircleOutlined style={{ color: '#722ed1' }} />,
  suggestion: <MessageOutlined style={{ color: '#faad14' }} />,
  notice: <NotificationOutlined style={{ color: '#55c4ae' }} />,
};

const typeLabel: Record<string, string> = {
  repair: '报修',
  visitor: '访客',
  order: '订单',
  property: '物业',
  suggestion: '建议',
  notice: '公告',
};

const typeRoute: Record<string, string> = {
  repair: '/repair',
  visitor: '/visitor',
  order: '/my',
  property: '/property',
  suggestion: '/suggestion',
  notice: '/notices',
};

const adminTypeRoute: Record<string, string> = {
  repair: '/repair',
  visitor: '/admin/visitor',
  order: '/order',
  property: '/admin/property',
  suggestion: '/admin/suggestion',
  notice: '/notices',
};

function loadSet(key: string): Set<string> {
  try {
    const raw = localStorage.getItem(key);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveSet(key: string, set: Set<string>) {
  localStorage.setItem(key, JSON.stringify([...set]));
}

export default function NotificationCenter() {
  const username = useSelector((state: RootState) => state.auth.username) || 'anon';
  const readKey = `notification_read_${username}`;
  const dismissedKey = `notification_dismissed_${username}`;

  const [list, setList] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [isAdmin, setIsAdmin] = useState(false);
  const [winW, setWinW] = useState(window.innerWidth);
  const [winH, setWinH] = useState(window.innerHeight);
  const isMobile = winW < 768;

  useEffect(() => {
    const handleResize = () => { setWinW(window.innerWidth); setWinH(window.innerHeight); };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const prevSnapshotRef = useRef<Map<string, string>>(new Map());
  const dispatch = useDispatch();
  // 用 ref 存当前 key，避免 fetchNotifications 闭包捕获到过期 key
  const readKeyRef = useRef(readKey);
  readKeyRef.current = readKey;
  const dismissedKeyRef = useRef(dismissedKey);
  dismissedKeyRef.current = dismissedKey;
  const loadedKeyRef = useRef('');

  // 在 Redux 状态稳定后加载已持久化的已读/已清除数据
  useEffect(() => {
    if (dismissedKey !== loadedKeyRef.current) {
      loadedKeyRef.current = dismissedKey;
      setDismissedIds(loadSet(dismissedKey));
      setReadIds(loadSet(readKey));
    }
  }, [dismissedKey, readKey]);

  const saveDismissed = (set: Set<string>) => {
    saveSet(dismissedKeyRef.current, set);
  };

  useEffect(() => {
    const getRole = async () => {
      try {
        const res = await http.get('/getInfo');
        if (res.data.code === 200) {
          setIsAdmin(res.data.data.role === '管理员');
        }
      } catch {}
    };
    getRole();
  }, []);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await http.get('/notification/list');
      if (res.data.code === 200) {
        const newList: NotificationItem[] = res.data.data || [];
        // 状态或内容变更的自动重置为未读
        // 先保存旧快照，再更新 ref
        const oldSnapshots = new Map(prevSnapshotRef.current);
        newList.forEach(item => {
          prevSnapshotRef.current.set(item.id, item.status + '|' + item.content);
        });
        setReadIds(prev => {
          const next = new Set(prev);
          let changed = false;
          newList.forEach(item => {
            const oldSnapshot = oldSnapshots.get(item.id);
            const newSnapshot = item.status + '|' + item.content;
            if (oldSnapshot && oldSnapshot !== newSnapshot && next.has(item.id)) {
              next.delete(item.id);
              changed = true;
            }
          });
          if (changed) saveSet(readKeyRef.current, next);
          return changed ? next : prev;
        });
        // 待处理项内容变更时也清除已清除标记
        setDismissedIds(prev => {
          const next = new Set(prev);
          let changed = false;
          newList.forEach(item => {
            if (!item.id.startsWith('pending-')) return;
            const oldSnapshot = oldSnapshots.get(item.id);
            const newSnapshot = item.status + '|' + item.content;
            if (oldSnapshot && oldSnapshot !== newSnapshot && next.has(item.id)) {
              next.delete(item.id);
              changed = true;
            }
          });
          if (changed) saveDismissed(next);
          return changed ? next : prev;
        });
        setList(newList);
      }
    } catch {
      // 静默
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const timer = setInterval(fetchNotifications, 30000);
    return () => clearInterval(timer);
  }, [fetchNotifications]);

  // 过滤掉已清除的
  const visibleList = list.filter(item => !dismissedIds.has(item.id));

  // 标记单条为已读
  const markRead = (id: string) => {
    const next = new Set(readIds);
    next.add(id);
    setReadIds(next);
    saveSet(readKeyRef.current, next);
  };

  const handleItemClick = (item: NotificationItem) => {
    markRead(item.id);
    const routeMap = isAdmin ? adminTypeRoute : typeRoute;
    const route = routeMap[item.type];
    const label = typeLabel[item.type];
    if (route) {
      dispatch(setMenuKey({ key: route, title: label }));
      setOpen(false);
    }
  };

  // 全部已读
  const handleMarkAllRead = () => {
    const next = new Set(readIds);
    visibleList.forEach(item => next.add(item.id));
    setReadIds(next);
    saveSet(readKeyRef.current, next);
  };

  // 清除已读：把已读的移到已清除（内容变化时会自动恢复）
  const handleClearRead = () => {
    const newDismissed = new Set(dismissedIds);
    const newRead = new Set(readIds);
    visibleList.forEach(item => {
      if (readIds.has(item.id)) {
        newDismissed.add(item.id);
        newRead.delete(item.id);
      }
    });
    setDismissedIds(newDismissed);
    setReadIds(newRead);
    saveDismissed(newDismissed);
    saveSet(readKeyRef.current, newRead);
  };

  const filteredList = activeTab === 'all'
    ? visibleList
    : visibleList.filter(item => item.type === activeTab);

  // 已读但未清除的数量 / 未读数量
  const readCount = visibleList.filter(item => readIds.has(item.id)).length;
  const unreadCount = visibleList.filter(item => !readIds.has(item.id)).length;

  const getStatusColor = (status: string) => {
    if (['已通过', '已完成', '已处理', '已缴费', '已支付', '已发货'].includes(status)) return '#52c41a';
    if (['已驳回', '已退款', '待处理'].includes(status)) return '#ff4d4f';
    if (['待审核', '待缴费', '待支付', '申请退款中'].includes(status)) return '#faad14';
    return '#8c8c8c';
  };

  const tabItems = [
    { key: 'all', label: isMobile ? '全部' : '全部' },
    { key: 'repair', label: '报修' },
    { key: 'order', label: '商品' },
    { key: 'property', label: '缴费' },
    { key: 'visitor', label: '访客' },
    { key: 'notice', label: '公告' },
    { key: 'suggestion', label: '建议' },
  ];

  const content = (
    <div style={{
      width: isMobile ? winW - 48 : 400,
      maxHeight: isMobile ? 380 : 480,
      padding: 0,
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: isMobile ? '4px 6px 6px' : '0 0 12px 0',
        borderBottom: '1px solid #f0f0f0', marginBottom: isMobile ? 2 : 8
      }}>
        <Text strong style={{ fontSize: isMobile ? 13 : 16 }}>消息中心</Text>
        <div style={{ display: 'flex', gap: 0 }}>
          {unreadCount > 0 && (
            <Button size="small" type="text" onClick={handleMarkAllRead} style={{ fontSize: 11 }}>
              已读
            </Button>
          )}
          {readCount > 0 && (
            <Button size="small" type="text" icon={<ClearOutlined />} onClick={handleClearRead} style={{ fontSize: 11 }} />
          )}
          <Button size="small" type="text" icon={<ReloadOutlined />} loading={loading} onClick={fetchNotifications} style={{ fontSize: 11 }} />
        </div>
      </div>

      {!isMobile && (
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          size="small"
          style={{ marginBottom: 8 }}
          items={tabItems}
        />
      )}
      {isMobile && (
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          size="small"
          tabBarStyle={{ marginBottom: 4, fontSize: 10 }}
          tabBarGutter={2}
          items={tabItems.map(t => ({ ...t, label: t.label }))}
        />
      )}

      <div style={{ maxHeight: isMobile ? 240 : 340, overflowY: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: isMobile ? 16 : 40 }}><Spin size="small" /></div>
        ) : filteredList.length === 0 ? (
          <Empty description="暂无消息" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ padding: isMobile ? '8px 0' : '20px 0' }} />
        ) : (
          <List
            dataSource={filteredList}
            renderItem={(item) => {
              const isRead = readIds.has(item.id);
              const iconSize = isMobile ? 24 : 36;
              return (
                <div
                  style={{
                    padding: isMobile ? '6px 3px' : '12px 8px',
                    borderBottom: '1px solid #fafafa',
                    cursor: 'pointer',
                    borderRadius: 6,
                    transition: 'background 0.2s',
                    display: 'flex',
                    gap: isMobile ? 6 : 12,
                    alignItems: 'flex-start',
                    opacity: isRead ? 0.65 : 1,
                  }}
                  onClick={() => handleItemClick(item)}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#f9fafb')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{
                    width: iconSize, height: iconSize, borderRadius: 6,
                    background: '#f5f5f5', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, marginTop: 1,
                    fontSize: isMobile ? 12 : 16,
                  }}>
                    {iconMap[item.icon] || <BellOutlined />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text strong={!isRead} style={{ fontSize: isMobile ? 11 : 13 }}>
                        <span style={{
                          display: 'inline-block', width: 5, height: 5, borderRadius: '50%',
                          background: isRead ? '#d9d9d9' : '#ff4d4f',
                          marginRight: 4,
                        }} />
                        {item.title}
                      </Text>
                      {item.status && (
                        <Text style={{ fontSize: 10, color: getStatusColor(item.status) }}>{item.status}</Text>
                      )}
                    </div>
                    <Text style={{ fontSize: 11, color: '#666', lineHeight: 1.3 }} ellipsis>
                      {item.content}
                    </Text>
                    {item.time && <Text style={{ fontSize: 10, color: '#bfbfbf' }}>{item.time}</Text>}
                  </div>
                </div>
              );
            }}
          />
        )}
      </div>
    </div>
  );

  return (
    <Popover
      content={content}
      trigger="click"
      open={open}
      onOpenChange={setOpen}
      placement={isMobile ? 'bottom' : 'bottomRight'}
      align={isMobile ? { offset: [0, 4] } : undefined}
      overlayStyle={{ maxWidth: isMobile ? winW - 16 : 440, padding: 0 }}
      overlayInnerStyle={{ padding: isMobile ? 8 : undefined }}
    >
      <Badge count={unreadCount} size="small" offset={[-2, 2]}>
        <BellOutlined
          style={{ fontSize: 18, color: '#fff', cursor: 'pointer' }}
          onClick={() => {
            setOpen(!open);
            if (!open) fetchNotifications();
          }}
        />
      </Badge>
    </Popover>
  );
}

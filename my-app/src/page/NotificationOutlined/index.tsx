import { useState, useEffect } from 'react';
import {
  Button, Input, Modal, Form, message,
  Popconfirm, Card, Typography, Empty, Checkbox, Tag, Space, Switch, DatePicker
} from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useSelector } from 'react-redux';
import dayjs from 'dayjs';
import http from '../../utils/http/http';

const { Text, Title } = Typography;
const { Search } = Input;

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

function Notification() {
  const [form] = Form.useForm();
  const [noticeList, setNoticeList] = useState<NoticeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const [anonymous, setAnonymous] = useState(false);
  const [userMap, setUserMap] = useState<Record<number, string>>({});
  const [searchText, setSearchText] = useState('');

  const { token, username } = useSelector((state: any) => state.auth);
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
        users.forEach((u: any) => {
          map[u.id] = u.username;
        });
        setUserMap(map);
      } catch {}
    };
    fetchUsers();
  }, []);

  // 获取列表 + 标记过期
  const getNoticeList = async () => {
    setLoading(true);
    try {
      const res = await http.get('/notice/user/list');
      let list: NoticeItem[] = res.data.data || [];
      const now = dayjs();
      list = list.map(item => {
        item.isExpired = item.expireTime ? dayjs(item.expireTime).isBefore(now) : false;
        return item;
      });
      setNoticeList(list);
    } catch {
      message.error('加载公告失败');
    } finally {
      setLoading(false);
    }
  };

  // 发布公告
  const handleSave = async () => {
    if (!currentUserId) return message.error('请登录');
    try {
      const values = await form.validateFields();
      const content = anonymous ? values.content + '||ANON||' : values.content;

      const postData: Record<string, any> = {
        title: values.title,
        content: content
      };

      if (isAdmin) {
        postData.isTop = values.isTop ? 1 : 0;
        if (values.expireTime) {
          postData.expireTime = dayjs(values.expireTime).format('YYYY-MM-DD HH:mm:ss');
        }
      }

      await http.post(
        '/notice/user/add',
        postData,
        { params: { userId: currentUserId } }
      );

      message.success('发布成功');
      setVisible(false);
      form.resetFields();
      setAnonymous(false);
      getNoticeList();
    } catch (err: any) {
      console.error(err);
      message.error('发布失败');
    }
  };

  // 删除公告
  const handleDelete = async (item: NoticeItem) => {
    try {
      if (isAdmin) {
        await http.delete('/notice/admin/delete', { params: { id: item.id } });
      } else {
        await http.delete('/notice/user/delete', {
          params: { id: item.id, loginUserId: currentUserId }
        });
      }
      message.success('删除成功');
      getNoticeList();
    } catch {
      message.error('删除失败');
    }
  };

  // 切换置顶状态
  const handleToggleTop = async (id: number, currentTop: number) => {
    try {
      // 1 和 0 互相切换
      const newTop = currentTop === 1 ? 0 : 1;
      await http.put('/notice/toggleTop', null, { params: { id, isTop: newTop } });
      message.success(newTop === 1 ? '已置顶' : '已取消置顶');
      getNoticeList();
    } catch {
      message.error('操作失败');
    }
  };

  const openModal = () => {
    form.resetFields();
    setVisible(true);
  };

  const filteredList = noticeList.filter(item =>
    item.title.includes(searchText) || item.content.includes(searchText)
  );

  return (
    <div style={{ padding: 20 }}>
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={4} style={{ margin: 0 }}>社区公告</Title>
          <Space>
            <Search
              placeholder="搜索标题/内容"
              allowClear
              style={{ width: 260 }}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={openModal}>发布新公告</Button>
          </Space>
        </div>
      </Card>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, fontSize: 16 }}>加载中...</div>
      ) : filteredList.length === 0 ? (
        <Empty description="暂无公告" style={{ padding: 60 }} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {filteredList.map((item) => {
            const isAnon = (item.content || '').endsWith('||ANON||');
            const realContent = item.content.replace('||ANON||', '');
            const realName = userMap[item.userId] || `用户${item.userId}`;

            return (
              <Card
                key={item.id}
                title={
                  <Space>
                    {item.isTop === 1 && <Tag color="red">置顶</Tag>}
                    {item.isExpired && <Tag color="default">已过期</Tag>}
                    <span>{item.title}</span>
                  </Space>
                }
                variant="outlined"
                style={{
                  borderRadius: 10,
                  height: '100%',
                  border: item.isTop === 1 ? '1px solid red' : undefined
                }}
                extra={
                  <Space>
                    {/* 管理员专属：置顶/取消置顶切换按钮 */}
                    {isAdmin && (
                      <Button
                        size="small"
                        onClick={() => handleToggleTop(item.id, item.isTop)}
                      >
                        {item.isTop === 1 ? '取消置顶' : '设为置顶'}
                      </Button>
                    )}
                    <Popconfirm title="确定删除？" onConfirm={() => handleDelete(item)}>
                      <Button type="text" danger size="small" icon={<DeleteOutlined />} />
                    </Popconfirm>
                  </Space>
                }
              >
                <div style={{ marginBottom: 12 }}>
                  <Text>{realContent}</Text>
                </div>
                <Space size="small">
                  {isAnon ? <Tag color="gray">匿名</Tag> : <Tag color="blue">实名</Tag>}
                  <Text type="secondary">
                    {isAdmin ? realName : (isAnon ? '匿名用户' : realName)}
                  </Text>
                </Space>
                <div style={{ marginTop: 8, textAlign: 'right' }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {item.createTime}
                    {item.expireTime && ` · 有效期至: ${item.expireTime}`}
                  </Text>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        open={visible}
        title="发布社区公告"
        onCancel={() => setVisible(false)}
        onOk={handleSave}
        width={580}
        maskClosable={false}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="公告标题" rules={[{ required: true }]}>
            <Input placeholder="请输入标题" maxLength={50} showCount />
          </Form.Item>
          <Form.Item name="content" label="公告内容" rules={[{ required: true }]}>
            <Input.TextArea rows={6} placeholder="请输入内容" maxLength={500} showCount />
          </Form.Item>

          {isAdmin && (
            <>
              <Form.Item name="isTop" label="是否置顶" valuePropName="checked">
                <Switch />
              </Form.Item>
              <Form.Item name="expireTime" label="有效期（不选永久）">
                <DatePicker showTime style={{ width: '100%' }} placeholder="选择过期时间" />
              </Form.Item>
            </>
          )}

          <Checkbox checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)}>
            匿名发布
          </Checkbox>
          <div style={{ marginTop: 10, color: '#999' }}>
            发布身份：{anonymous ? '匿名用户' : username}
          </div>
        </Form>
      </Modal>
    </div>
  );
}

export default Notification;

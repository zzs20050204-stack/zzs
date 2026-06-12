import { useState, useEffect } from 'react';
import {
  List, Button, Input, Modal, Form, message,
  Popconfirm, Card, Typography, Empty, Checkbox, Tag, Space
} from 'antd';
import {
  PlusOutlined, DeleteOutlined, FileTextOutlined, SearchOutlined
} from '@ant-design/icons';
import { useSelector } from 'react-redux';
import http from '../../utils/http/http';

const { Text, Title } = Typography;
const { Search } = Input;

interface NoticeItem {
  id: number;
  title: string;
  content: string;
  userId: number;
  createTime?: string;
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

  const getNoticeList = async () => {
    setLoading(true);
    try {
      const res = await http.get('/notice/user/list');
      setNoticeList(res.data.data || []);
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

      await http.post('/notice/user/add',
        { title: values.title, content },
        { params: { userId: currentUserId } }
      );

      message.success('发布成功');
      setVisible(false);
      form.resetFields();
      setAnonymous(false);
      getNoticeList();
    } catch {
      message.error('发布失败');
    }
  };

  const handleDelete = async (record: NoticeItem) => {
    if (!currentUserId) return;
    if (!isAdmin && record.userId !== currentUserId) {
      return message.error('只能删除自己发布的公告');
    }
    try {
      await http.delete('/notice/admin/delete', { params: { id: record.id } });
      message.success('删除成功');
      getNoticeList();
    } catch {
      message.error('删除失败');
    }
  };

  const filteredList = noticeList.filter(item =>
    item.title.includes(searchText) || item.content.replace('||ANON||', '').includes(searchText)
  );

  return (
    <div style={{ padding: '24px', background: '#f5f7fa', minHeight: 'calc(100vh - 180px)' }}>
      {/* 顶部栏 */}
      <Card bordered={false} style={{ marginBottom: 20, borderRadius: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <FileTextOutlined style={{ fontSize: 20, color: '#1890ff' }} />
            <div>
              <Title level={5} style={{ margin: 0 }}>社区公告</Title>
              <Text type="secondary" style={{ fontSize: 12 }}>支持实名 / 匿名发布</Text>
            </div>
          </div>
          <Space>
            <Search
              placeholder="搜索标题/内容"
              allowClear
              style={{ width: 260 }}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={() => {
              form.resetFields();
              setAnonymous(false);
              setVisible(true);
            }}>发布新公告</Button>
          </Space>
        </div>
      </Card>

      {/* 卡片式列表（核心改这里） */}
      <List
        loading={loading}
        dataSource={filteredList}
        grid={{ gutter: 16, column: 2 }} // 一行2张卡片，可改1/2/3
        locale={{ emptyText: <Empty description="暂无公告" /> }}
        renderItem={(item) => {
          const isAnon = (item.content || '').endsWith('||ANON||');
          const realContent = item.content.replace('||ANON||', '');
          const realName = userMap[item.userId] || `用户${item.userId}`;

          return (
            <List.Item>
              <Card
                title={item.title}
                bordered
                style={{ borderRadius: 10, height: '100%' }}
                extra={
                  <Popconfirm title="确定删除？" onConfirm={() => handleDelete(item)}>
                    <Button type="text" danger size="small" icon={<DeleteOutlined />} />
                  </Popconfirm>
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
                  <Text type="secondary" style={{ fontSize: 12 }}>{item.createTime}</Text>
                </div>
              </Card>
            </List.Item>
          );
        }}
      />

      {/* 发布弹窗 */}
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
          <Checkbox checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)}>匿名发布</Checkbox>
          <div style={{ marginTop: 10, color: '#999' }}>
            发布身份：{anonymous ? '匿名用户' : username}
          </div>
        </Form>
      </Modal>
    </div>
  );
}

export default Notification;

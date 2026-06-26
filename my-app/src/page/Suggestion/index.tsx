import { useState, useEffect } from 'react';
import {
  Card, Form, Input, Button, message,
  Typography, Divider, Table, Tag, Empty
} from 'antd';
import { MessageOutlined } from '@ant-design/icons';
import http from '../../utils/http/http';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface Suggestion {
  id: number;
  userName: string;
  content: string;
  status: string;
  createTime: string;
}

export default function Suggestion() {
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [list, setList] = useState<Suggestion[]>([]);
  const [form] = Form.useForm();

  const username = sessionStorage.getItem('username') || '';

  const loadMySuggestion = async () => {
    if (!username) return;
    setListLoading(true);
    try {
      const res = await http.get('/property/suggestion/myList?username=' + username);
      setList(res.data.data || []);
    } catch {
      message.error('加载失败');
    } finally {
      setListLoading(false);
    }
  };

  const onFinish = async (values: any) => {
    if (loading) return;
    setLoading(true);
    try {
      await http.post('/property/suggestion/add', {
        username,
        content: values.content,
      });
      message.success('提交成功');
      form.resetFields();
      loadMySuggestion();
    } catch {
      message.error('提交失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMySuggestion();
  }, [username]);

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{
        marginBottom: 20,
        borderBottom: '1px solid #f0f2f5',
        paddingBottom: 12
      }}>
        <Title level={4} style={{ margin: 0 }}>建议反馈</Title>
        <Text type="secondary" style={{ fontSize: 13 }}>欢迎提出宝贵意见，帮助我们改进服务</Text>
      </div>

      <Card variant="borderless" style={{ borderRadius: 12, marginBottom: 24 }}>
        <Title level={5} style={{ marginBottom: 16 }}>
          <MessageOutlined style={{ marginRight: 8, color: '#55c4ae' }} />
          提交建议
        </Title>
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item
            name="content"
            rules={[{ required: true, message: '请输入内容' }]}
          >
            <TextArea rows={4} placeholder="请输入您的建议或反馈..." maxLength={500} showCount />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
            >
              提交建议
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Card
        variant="borderless"
        style={{ borderRadius: 12 }}
        title="我的建议记录"
      >
        <Table
          rowKey="id"
          loading={listLoading}
          dataSource={list}
          scroll={{ x: 'max-content' }}
          pagination={{ pageSize: 10 }}
          locale={{
            emptyText: <Empty description="还没有提交过建议">
              <MessageOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />
            </Empty>
          }}
          columns={[
            { title: '内容', dataIndex: 'content', ellipsis: true },
            {
              title: '状态',
              dataIndex: 'status',
              width: 100,
              align: 'center',
              render: (s: string) => (
                <Tag color={s === '待处理' ? 'red' : 'green'}>{s}</Tag>
              ),
            },
            { title: '提交时间', dataIndex: 'createTime', width: 180, render: (v: string) => v?.replace('T', ' ') },
          ]}
        />
      </Card>
    </div>
  );
}

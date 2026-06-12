import { useState, useEffect } from 'react';
import {
  Card, Form, Input, Button, message,
  Typography, Divider, Table, Tag, Empty
} from 'antd';
import http from '../../utils/http/http';

const { Title } = Typography;
const { TextArea } = Input;

interface Suggestion {
  id: number;
  userName: string;
  content: string;
  status: string;
  createTime: string;
}

const Suggestion = () => {
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<Suggestion[]>([]);
  const [form] = Form.useForm();

  const username = sessionStorage.getItem('username') || '';

  // 加载我的建议
  const loadMySuggestion = async () => {
    if (!username) return;
    try {
      const res = await http.get('/property/suggestion/myList?username=' + username);
      setList(res.data.data || []);
    } catch (err) {
      console.error('加载失败', err);
    }
  };

  // 提交建议（防重复提交）
  const onFinish = async (values: any) => {
    if (loading) return; // 正在加载中，直接return，防止重复提交
    setLoading(true);

    try {
      await http.post('/property/suggestion/add', {
        username: username,
        content: values.content
      });
      message.success('提交成功');
      form.resetFields(); // 清空输入框
      loadMySuggestion();
    } catch (e) {
      message.error('提交失败');
    } finally {
      setLoading(false); // 释放按钮
    }
  };

  useEffect(() => {
    loadMySuggestion();
  }, [username]);

  return (
    <div style={{ padding: 20 }}>
      <Card style={{ maxWidth: 700, margin: '0 auto' }}>
        <Title level={4} style={{ textAlign: 'center' }}>建议反馈</Title>
        <Divider />

        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item
            name="content"
            rules={[{ required: true, message: '请输入内容' }]}
            label="建议内容"
          >
            <TextArea rows={5} placeholder="请输入您的建议..." />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              disabled={loading}  // 👈 防重复提交
              block
            >
              {loading ? '提交中...' : '提交建议'}
            </Button>
          </Form.Item>
        </Form>

        <Divider />

        <div>
          <h4>📋 我的建议历史</h4>
          {list.length === 0 ? (
            <Empty style={{ margin: '20px 0' }} />
          ) : (
            <Table
              rowKey="id"
              dataSource={list}
              pagination={false}
              columns={[
                { title: '内容', dataIndex: 'content' },
                {
                  title: '状态',
                  render: (_, r) => (
                    <Tag color={r.status === '待处理' ? 'red' : 'green'}>
                      {r.status}
                    </Tag>
                  )
                },
                { title: '时间', dataIndex: 'createTime' }
              ]}
            />
          )}
        </div>
      </Card>
    </div>
  );
};

export default Suggestion;

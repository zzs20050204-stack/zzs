import { useState, useEffect } from 'react';
import {
  Table, Button, Input, Modal, Form, message,
  Popconfirm, Card, Space, Tag, Typography, Tooltip, Upload, Image
} from 'antd';
import { PlusOutlined, UploadOutlined } from '@ant-design/icons';
import { useSelector } from 'react-redux';
import type { UploadFile } from 'antd/es/upload/interface';
import http from '../../utils/http/http';

const { TextArea } = Input;
const { Title } = Typography;

interface Repair {
  id: number;
  content: string;
  username: string;
  phone: string;
  address: string;
  status: string;
  createTime: string;
  imgUrl?: string;
}

interface RootState {
  auth: {
    token: string;
    username: string;
    role: string;
  };
}

function RepairPage() {
  const [form] = Form.useForm();
  const [list, setList] = useState<Repair[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [visible, setVisible] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [currentName, setCurrentName] = useState<string>('');

  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [previewOpen, setPreviewOpen] = useState<boolean>(false);
  const [previewImage, setPreviewImage] = useState<string>('');

  const { auth } = useSelector((state: RootState) => state);

  // 获取用户信息
  useEffect(() => {
    const getInfo = async () => {
      try {
        const res = await http.get('/getInfo');
        if (res.data.code === 200) {
          setCurrentName(res.data.data.username);
          setIsAdmin(res.data.data.role === '管理员');
        }
      } catch (err) {
        console.error(err);
      }
    };
    getInfo();
  }, [auth.token]);

  // 加载列表
  const getList = async () => {
    setLoading(true);
    try {
      const res = await http.get('/repair/list');
      let data: Repair[] = res.data.data || [];
      if (!isAdmin) {
        data = data.filter((item) => item.username === currentName);
      }
      setList(data);
    } catch {
      message.error('列表加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getList();
  }, [currentName, isAdmin]);

  // 图片压缩 - 【替换 new Image()，彻底解决 ts7009】
  const handleFileChange = ({ fileList: newFileList }: { fileList: UploadFile[] }) => {
    const files = newFileList.slice(-1);
    setFileList(files);

    if (files.length && files[0].originFileObj) {
      const file = files[0].originFileObj;
      const reader = new FileReader();
      reader.readAsDataURL(file);

      reader.onload = (e) => {
        // 替代 new Image()，类型安全，无构造签名报错
        const img = document.createElement('img');
        img.src = e.target?.result as string;

        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const maxWidth = 800;
          const maxHeight = 800;
          let width = img.width;
          let height = img.height;

          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.floor(width * ratio);
            height = Math.floor(height * ratio);
          }

          canvas.width = width;
          canvas.height = height;
          ctx?.drawImage(img, 0, 0, width, height);
          const compressBase64 = canvas.toDataURL('image/jpeg', 0.7);
          form.setFieldValue('imgUrl', compressBase64);
        };
      };
    } else {
      form.setFieldValue('imgUrl', '');
    }
  };

  // 图片预览
  const handlePreview = (file: UploadFile) => {
    setPreviewImage(file.url || (file.preview as string));
    setPreviewOpen(true);
  };

  // 提交报修
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      if (!values.imgUrl) {
        delete values.imgUrl;
      }
      await http.post('/repair/add', values);
      message.success('提交成功');
      setVisible(false);
      form.resetFields();
      setFileList([]);
      getList();
    } catch {
      message.error('提交失败');
    }
  };

  // 修改状态
  const handleStatus = async (id: number, status: string) => {
    await http.post('/repair/update', { id, status });
    message.success('状态修改成功');
    getList();
  };

  // 删除报修
  const handleDelete = async (id: number) => {
    await http.delete('/repair/delete', { params: { id } });
    message.success('删除成功');
    getList();
  };

  // 表格列配置
  const columns = [
    {
      title: '报修内容',
      dataIndex: 'content',
      ellipsis: true,
      render: (text: string) => (
        <Tooltip title={text} placement="topLeft">
          {text}
        </Tooltip>
      ),
    },
    {
      title: '报修人',
      dataIndex: 'username',
      align: 'center' as const,
    },
    {
      title: '联系电话',
      dataIndex: 'phone',
      align: 'center' as const,
    },
    {
      title: '住址',
      dataIndex: 'address',
      align: 'center' as const,
    },
    {
      title: '报修照片',
      dataIndex: 'imgUrl',
      align: 'center' as const,
      render: (img: string) => {
        if (!img) return <span style={{ color: '#999' }}>无图片</span>;
        return <Image width={60} height={60} style={{ objectFit: 'cover' }} src={img} preview />;
      }
    },
    {
      title: '处理状态',
      dataIndex: 'status',
      align: 'center' as const,
      render: (status: string, record: Repair) => {
        const color = status === '已处理' ? 'green' : 'gold';
        if (isAdmin) {
          return (
            <Space size="small">
              <Tag color={color}>{status}</Tag>
              {status === '待处理' ? (
                <Button size="small" type="primary" onClick={() => handleStatus(record.id, '已处理')}>
                  设为已处理
                </Button>
              ) : (
                <Button size="small" onClick={() => handleStatus(record.id, '待处理')}>
                  改回待处理
                </Button>
              )}
            </Space>
          );
        }
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: '报修时间',
      dataIndex: 'createTime',
      align: 'center' as const,
    },
    {
      title: '操作',
      align: 'center' as const,
      render: (_: unknown, record: Repair) => {
        const canDelete = isAdmin || record.username === currentName;
        return canDelete ? (
          <Popconfirm title="确定删除这条报修？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" danger size="small">删除</Button>
          </Popconfirm>
        ) : null;
      },
    },
  ];

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1400, margin: '0 auto' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        borderBottom: '1px solid #f0f2f5',
        paddingBottom: 12
      }}>
        <Title level={4} style={{ margin: 0 }}>报修管理</Title>
        <Button
          icon={<PlusOutlined />}
          type="primary"
          onClick={() => {
            form.setFieldsValue({ username: currentName, imgUrl: '' });
            setFileList([]);
            setVisible(true);
          }}
        >
          我要报修
        </Button>
      </div>

      <Card
        variant="borderless"
        style={{ borderRadius: 12 }}
        styles={{ body: { padding: '20px 24px' } }}
      >
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={list}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        open={visible}
        title="提交报修"
        width={500}
        onCancel={() => setVisible(false)}
        onOk={handleSave}
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item name="username" label="姓名">
            <Input disabled />
          </Form.Item>
          <Form.Item name="phone" label="联系电话" rules={[{ required: true }]}>
            <Input placeholder="请输入联系电话" />
          </Form.Item>
          <Form.Item name="address" label="居住地址" rules={[{ required: true }]}>
            <Input placeholder="请输入详细住址" />
          </Form.Item>
          <Form.Item name="content" label="报修问题" rules={[{ required: true }]}>
            <TextArea rows={5} placeholder="请描述问题" />
          </Form.Item>

          <Form.Item label="上传报修照片（选填）">
            <Upload
              listType="picture-card"
              fileList={fileList}
              onChange={handleFileChange}
              onPreview={handlePreview}
              maxCount={1}
              accept="image/*"
              customRequest={({ onSuccess }) => onSuccess?.('ok')}
            >
              {fileList.length < 1 && (
                <div>
                  <UploadOutlined />
                  <div style={{ marginTop: 4 }}>拍照/上传</div>
                </div>
              )}
            </Upload>
          </Form.Item>

          <Form.Item name="imgUrl" hidden>
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      {/* 修复 onOpenChange 传参报错 ts(2554) */}
      {previewImage && (
        <Image
          width={0}
          height={0}
          src={previewImage}
          preview={{
            open: previewOpen,
            onOpenChange: (open: boolean) => setPreviewOpen(open)
          }}
        />
      )}
    </div>
  );
}

export default RepairPage;

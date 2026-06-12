import { useState, useEffect } from 'react';
import { Card, Table, Button, message, Spin } from 'antd';
import http from '../../utils/http/http';


interface BillItem {
  id: number;
  userId: string;
  payType: string;
  money: string;
  status: string;
  deadline: string;
  remark: string;
}

export default function Property() {
  const [list, setList] = useState<BillItem[]>([]);
  const [loading, setLoading] = useState(false);

  const loadList = async () => {
    setLoading(true);
    try {
      // ===========================
      // ✅ 终极正确：直接取 username！
      // ===========================
      const username = sessionStorage.getItem('username');
      console.log("当前用户名：", username);

      if (!username) {
        message.error("未获取到用户信息");
        setLoading(false);
        return;
      }

      // 请求接口
      const res = await http.get(`/property/bill/list/user?userId=${username}`);
      console.log("缴费数据：", res.data);

      if (res.data.code === 200) {
        setList(res.data.data);
      }
    } catch (err) {
      console.error("请求失败", err);
    } finally {
      setLoading(false);
    }
  };

  const pay = async (id: number) => {
    try {
      await http.post('/property/bill/pay', { id });
      message.success('缴费成功');
      loadList();
    } catch {
      message.error('缴费失败');
    }
  };

  useEffect(() => {
    loadList();
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <Card title="我的缴费单">
        <Spin spinning={loading}>
          <Table
            rowKey="id"
            dataSource={list}
            columns={[
              { title: '类型', dataIndex: 'payType' },
              { title: '金额', dataIndex: 'money' },
              { title: '状态', dataIndex: 'status' },
              { title: '截止时间', dataIndex: 'deadline' },
              { title: '备注', dataIndex: 'remark' },
              {
                title: '操作',
                render: (_, r) =>
                  r.status === '待缴费' ? (
                    <Button type="primary" onClick={() => pay(r.id)}>
                      立即缴费
                    </Button>
                  ) : '已完成'
              },
            ]}
          />
        </Spin>
      </Card>
    </div>
  );
}
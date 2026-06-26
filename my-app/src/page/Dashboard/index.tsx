import { useState, useEffect } from 'react';
import { Card, Typography, Row, Col, Statistic, Spin, Empty, message } from 'antd';
import {
  TeamOutlined, ShoppingCartOutlined, PayCircleOutlined,
  WarningOutlined, NotificationOutlined, ShopOutlined
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import http from '../../utils/http/http';

const { Text, Title } = Typography;

interface DashboardData {
  userCount: number;
  orderCount: number;
  orderStatusStats: Record<string, number>;
  propertyTotalBills: number;
  propertyPaidBills: number;
  propertyUnpaidBills: number;
  propertyTotalAmount: number;
  propertyPaidAmount: number;
  repairTotal: number;
  repairStatusStats: Record<string, number>;
  suggestionTotal: number;
  suggestionStatusStats: Record<string, number>;
  visitorTotal: number;
  visitorStatusStats: Record<string, number>;
  noticeCount: number;
  goodsCount: number;
  recentOrders: Array<{ orderNo: string; status: string; totalPrice: number; username: string }>;
}

function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const res = await http.get('/dashboard/statistics');
        if (res.data.code === 200) {
          setData(res.data.data);
        }
      } catch {
        message.error('数据看板加载失败');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const orderPieData = data?.orderStatusStats
    ? Object.entries(data.orderStatusStats).map(([name, value]) => ({ name, value }))
    : [];

  const propertyPieData = [
    { name: '已缴费', value: data?.propertyPaidBills || 0 },
    { name: '待缴费', value: data?.propertyUnpaidBills || 0 },
  ];

  const repairPieData = data?.repairStatusStats
    ? Object.entries(data.repairStatusStats).map(([name, value]) => ({ name, value }))
    : [];

  const pieOption = (title: string, pieData: Array<{ name: string; value: number }>) => ({
    title: { text: title, left: 'center', textStyle: { fontSize: 14 } },
    tooltip: { trigger: 'item' as const },
    legend: { bottom: 0, textStyle: { fontSize: 11 } },
    series: [{
      type: 'pie',
      radius: ['35%', '60%'],
      center: ['50%', '45%'],
      label: { formatter: '{b}\n{d}%' },
      data: pieData,
    }],
  });

  const orderBarOption = (pieData: Array<{ name: string; value: number }>) => ({
    title: { text: '订单状态分布', left: 'center', textStyle: { fontSize: 14 } },
    tooltip: { trigger: 'axis' as const },
    xAxis: { type: 'category' as const, data: pieData.map(d => d.name), axisLabel: { rotate: 15 } },
    yAxis: { type: 'value' as const },
    grid: { bottom: 60 },
    series: [{
      type: 'bar',
      data: pieData.map(d => d.value),
      itemStyle: { borderRadius: [4, 4, 0, 0], color: '#55c4ae' },
    }],
  });

  return (
    <div style={{ padding: '20px 24px', maxWidth: 1400, margin: '0 auto' }}>
      <Title level={3} style={{ marginBottom: 20 }}>数据看板</Title>

      <Spin spinning={loading}>
        {/* Stat Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          {[
            { title: '社区用户', value: data?.userCount || 0, icon: <TeamOutlined />, color: '#1890ff', bg: '#e6f7ff' },
            { title: '订单总数', value: data?.orderCount || 0, icon: <ShoppingCartOutlined />, color: '#52c41a', bg: '#f6ffed' },
            { title: '已缴/总缴费单', value: `${data?.propertyPaidBills || 0}/${data?.propertyTotalBills || 0}`, icon: <PayCircleOutlined />, color: '#722ed1', bg: '#f9f0ff' },
            { title: '待处理报修', value: data?.repairStatusStats?.['待处理'] || 0, icon: <WarningOutlined />, color: '#ff4d4f', bg: '#fff2f0' },
            { title: '社区公告', value: data?.noticeCount || 0, icon: <NotificationOutlined />, color: '#faad14', bg: '#fffbe6' },
            { title: '在售商品', value: data?.goodsCount || 0, icon: <ShopOutlined />, color: '#13c2c2', bg: '#e6fffb' },
          ].map((card, i) => (
            <Col xs={12} sm={8} md={4} key={i}>
              <Card variant="borderless" style={{ borderRadius: 12, backgroundColor: card.bg, textAlign: 'center' }}>
                <div style={{ fontSize: 28, color: card.color, marginBottom: 8 }}>{card.icon}</div>
                <Statistic title={card.title} value={card.value} styles={{ content: { fontSize: 22 } }} />
              </Card>
            </Col>
          ))}
        </Row>

        {/* Charts */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} md={12}>
            <Card variant="borderless" style={{ borderRadius: 12 }}>
              <ReactECharts option={pieOption('物业费缴纳比例', propertyPieData)} style={{ height: 280 }} />
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card variant="borderless" style={{ borderRadius: 12 }}>
              <ReactECharts option={orderBarOption(orderPieData)} style={{ height: 280 }} />
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card variant="borderless" style={{ borderRadius: 12 }}>
              <ReactECharts option={pieOption('报修处理进度', repairPieData)} style={{ height: 280 }} />
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card variant="borderless" style={{ borderRadius: 12, height: 320 }}>
              <Title level={5} style={{ textAlign: 'center', marginBottom: 16 }}>最近订单</Title>
              {data?.recentOrders?.length ? (
                data.recentOrders.map((o, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f0f0f0' }}>
                    <Text>{o.orderNo}</Text>
                    <Text type="secondary">{o.username}</Text>
                    <Text strong>¥{o.totalPrice}</Text>
                    <Text style={{ color: '#55c4ae' }}>{o.status}</Text>
                  </div>
                ))
              ) : (
                <Empty description="暂无订单" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              )}
            </Card>
          </Col>
        </Row>
      </Spin>
    </div>
  );
}


export default DashboardPage;

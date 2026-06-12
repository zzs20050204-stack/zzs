import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setMenuKey } from '../../utils/menuSlice';
import { setToken } from '../../store/login/authSlice';
import { removeToken } from '../../utils/auth';
import request from '../../utils/http/http';
import ProfileModal from '../../page/profile';
import {
  Menu,
  Dropdown,
  Space,
  Avatar,
  type MenuProps
} from 'antd';
import {
  PieChartOutlined,
  UserOutlined,
  WarningOutlined,
  NotificationOutlined,
  TeamOutlined,
  ShopOutlined,
  UserAddOutlined,
  OrderedListOutlined,
  PayCircleOutlined,
  MessageOutlined,
  FileOutlined,
  PoweroffOutlined,
  DownOutlined,
  HomeOutlined 
} from '@ant-design/icons';

type MenuItem = Required<MenuProps>['items'][number];

function getItem(
  label: React.ReactNode,
  key: React.Key,
  icon?: React.ReactNode,
  children?: MenuItem[],
): MenuItem {
  return { key, icon, children, label };
}

const titleMap: Record<string, string> = {
  '1': '首页',
  '/goods': '商品',
  '/9': '在线报修',
  '/order': '订单管理',
  '/sub1': '住户管理',
  
  '/10': '公告管理',
  '/11': '用户管理',
  '/my': '我的',
  '/property': '物业缴费',
  '/admin/property': '缴费单管理',
  '/suggestion': '建议反馈',
  '/admin/suggestion': '建议管理',
};

function TopMenu() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentKey } = useSelector((state: any) => state.menu);

  const [userRole, setUserRole] = useState<'admin' | 'user'>('user');
  const [user, setUser] = useState<any>(null);
  const [showProfile, setShowProfile] = useState(false);

  const getUserInfo = async () => {
    try {
      const res = await request.get('/getInfo');
      if (res.data.code === 200) {
        const userData = res.data.data;
        setUser(userData);
        const role = (userData.role || "").trim();
        setUserRole(role === "管理员" ? 'admin' : 'user');
      }
    } catch (error) {
      console.error("获取用户信息失败", error);
    }
  };

  useEffect(() => {
    getUserInfo();
  }, []);

  const handleClick: MenuProps['onClick'] = (e) => {
    dispatch(setMenuKey({ key: e.key, title: titleMap[e.key] || '' }));
  };

  const userMenuItems: MenuProps['items'] = [
    { key: 'profile', label: '个人中心', icon: <UserOutlined /> },
    { key: 'logout', label: '退出登录', icon: <PoweroffOutlined /> },
  ];

  const onUserMenuClick = ({ key }: { key: string }) => {
    if (key === 'profile') {
      setShowProfile(true);
    } else if (key === 'logout') {
      removeToken();
      dispatch(setToken(''));
      navigate('/login');
    }
  };

  const adminMenu = [
    getItem('首页', '1', <PieChartOutlined />),
    getItem('商品', '/goods', <ShopOutlined />),
    getItem('在线报修', '/9', <WarningOutlined />),
    getItem('订单管理', '/order', <OrderedListOutlined />),
    getItem('住户管理', '/sub1', <UserOutlined />),
   
    getItem('公告管理', '/10', <NotificationOutlined />),
    getItem('用户管理', '/11', <TeamOutlined />),
    getItem('缴费单管理', '/admin/property', <FileOutlined />),
    getItem('建议管理', '/admin/suggestion', <MessageOutlined />),
    getItem('我的', '/my', <UserAddOutlined />),
  ];

  const userMenu = [
    getItem('首页', '1', <PieChartOutlined />),
    getItem('商品', '/goods', <ShopOutlined />),
    getItem('在线报修', '/9', <WarningOutlined />),
    getItem('公告', '/10', <NotificationOutlined />),
    getItem('物业缴费', '/property', <PayCircleOutlined />),
    getItem('建议反馈', '/suggestion', <MessageOutlined />),
    getItem('我的', '/my', <UserAddOutlined />),
  ];

  const menuItems = userRole === 'admin' ? adminMenu : userMenu;

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      background: '#574f4f', 
      height: 48,
      width: '100vw',
      margin: 0,
      padding: 0,
      boxSizing: 'border-box',
      position: 'fixed',
      top: 0,
      left: 0,
      zIndex: 999,
    }}>
      <style>
        {`
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          /* 唯一加的代码：解决fixed遮挡 */
          body {
            padding-top: 48px !important;
          }
          .ant-menu-item {
            font-size: 14px !important;
            padding: 0 12px !important;
          }
          .ant-menu.ant-menu-dark .ant-menu-item-selected {
            color: #ff4d4f !important;
            background-color: transparent !important;
          }
          .ant-menu.ant-menu-dark .ant-menu-item::after,
          .ant-menu.ant-menu-dark .ant-menu-item-selected::after {
            display: none !important;
          }
          .ant-menu.ant-menu-dark .ant-menu-item:hover {
            color: #ff4d4f !important;
            background-color: transparent !important;
          }
          .ant-menu.ant-menu-dark .ant-menu-item-selected .anticon {
            color: #ff4d4f !important;
          }
          .ant-menu.ant-menu-dark .ant-menu-item:hover .anticon {
            color: #ff4d4f !important;
          }
        `}
      </style>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        paddingLeft: '24px',
        color: '#fff',
        fontSize: '16px',
        fontWeight: 'bold',
        whiteSpace: 'nowrap',
        minWidth: '140px'
      }}>
        <HomeOutlined style={{ marginRight: '8px', fontSize: '18px', color: '#ff4d4f' }} />
        <span>智慧社区</span>
      </div>

      <div style={{ 
        flex: 1, 
        display: 'flex', 
        justifyContent: 'center', 
        minWidth: 0
      }}>
        <Menu
          mode="horizontal"
          selectedKeys={[currentKey]}
          items={menuItems}
          onClick={handleClick}
          overflowedIndicator={null}
          style={{
            background: '#574f4f',
            color: '#fff',
            height: 48,
            lineHeight: '48px',
            border: 0,
            margin: 0,
            padding: 0,
            width: '100%',
            display: 'flex',
            justifyContent: 'center'
          }}
          theme="dark"
        />
      </div>

      <div style={{ 
        paddingRight: '24px', 
        height: 48, 
        display: 'flex', 
        alignItems: 'center',
        fontSize: '14px',
        color: '#fff',
        whiteSpace: 'nowrap',
        minWidth: '140px',
        justifyContent: 'flex-end'
      }}>
        <Dropdown
          menu={{ items: userMenuItems, onClick: onUserMenuClick }}
          placement="bottom"
        >
          <Space style={{ cursor: 'pointer' }}>
            <Avatar
              size={24}
              src={user?.avatar ? `http://localhost:8080${user.avatar}` : null}
              icon={<UserOutlined />}
            />
            欢迎您,{user?.username || '用户'} <DownOutlined />
          </Space>
        </Dropdown>
      </div>

      <ProfileModal
        visible={showProfile}
        onClose={() => setShowProfile(false)}
        user={user}
      />
    </div>
  );
}

export default TopMenu;

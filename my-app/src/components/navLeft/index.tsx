import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setMenuKey } from '../../utils/menuSlice';
import { setToken } from '../../store/login/authSlice';
import { removeToken } from '../../utils/auth';
import request from '../../utils/http/http';
import { RootState } from '../../store';
import { BASE_URL } from '../../utils/constants';
import ProfileModal from '../../page/profile';
import NotificationCenter from '../NotificationCenter';
import {
  Menu,
  Dropdown,
  Space,
  Avatar,
  Drawer,
  Button,
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
  HomeOutlined,
  UsergroupAddOutlined,
  AuditOutlined,
  MenuOutlined,
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
  '/repair': '在线报修',
  '/order': '订单管理',
  '/household': '住户管理',
  '/notices': '公告管理',
  '/users': '用户管理',
  '/my': '我的',
  '/property': '物业缴费',
  '/admin/property': '缴费单管理',
  '/suggestion': '建议反馈',
  '/admin/suggestion': '建议管理',
  '/visitor': '访客预约',
  '/admin/visitor': '访客审核',
  '/dashboard': '数据看板'
};

function TopMenu() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentKey } = useSelector((state: RootState) => state.menu);

  const [userRole, setUserRole] = useState<'admin' | 'user'>('user');
  const [user, setUser] = useState<any>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    setMobileMenuOpen(false);
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
      dispatch(setMenuKey({ key: '1', title: '首页' }));
      navigate('/login', { replace: true });
    }
  };

  const adminMenu: MenuItem[] = [
    getItem('首页', '1', <PieChartOutlined />),
    getItem('商品', '/goods', <ShopOutlined />),
    getItem('在线报修', '/repair', <WarningOutlined />),
    getItem('订单管理', '/order', <OrderedListOutlined />),
    getItem('住户管理', '/household', <UserOutlined />),
    getItem('公告管理', '/notices', <NotificationOutlined />),
    getItem('用户管理', '/users', <TeamOutlined />),
    getItem('访客审核', '/admin/visitor', <AuditOutlined />),
    getItem('缴费单管理', '/admin/property', <FileOutlined />),
    getItem('建议管理', '/admin/suggestion', <MessageOutlined />),
    getItem('我的', '/my', <UserAddOutlined />),
  ];

  const userMenu: MenuItem[] = [
    getItem('首页', '1', <PieChartOutlined />),
    getItem('商品', '/goods', <ShopOutlined />),
    getItem('在线报修', '/repair', <WarningOutlined />),
    getItem('公告', '/notices', <NotificationOutlined />),
    getItem('物业缴费', '/property', <PayCircleOutlined />),
    getItem('访客预约', '/visitor', <UsergroupAddOutlined />),
    getItem('建议反馈', '/suggestion', <MessageOutlined />),
    getItem('我的', '/my', <UserAddOutlined />),
  ];

  const menuItems = userRole === 'admin' ? adminMenu : userMenu;

  return (
    <>
      <style>
        {`
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
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
          @media (max-width: 768px) {
            body {
              padding-top: 44px !important;
            }
            .mobile-user-text {
              display: none;
            }
          }
        `}
      </style>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: '#574f4f',
        height: isMobile ? 44 : 48,
        width: '100vw',
        margin: 0,
        padding: isMobile ? '0 12px' : '0 0',
        boxSizing: 'border-box',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 999,
      }}>
        {isMobile && (
          <Button
            type="text"
            icon={<MenuOutlined style={{ color: '#fff', fontSize: 18 }} />}
            onClick={() => setMobileMenuOpen(true)}
            style={{ padding: 4 }}
          />
        )}

        <div style={{
          display: 'flex',
          alignItems: 'center',
          paddingLeft: isMobile ? '8px' : '24px',
          color: '#fff',
          fontSize: isMobile ? '14px' : '16px',
          fontWeight: 'bold',
          whiteSpace: 'nowrap',
          minWidth: isMobile ? 'auto' : '140px'
        }}>
          <HomeOutlined style={{ marginRight: '6px', fontSize: isMobile ? '16px' : '18px', color: '#ff4d4f' }} />
          <span>智慧社区</span>
        </div>

        {!isMobile && (
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
        )}

        <div style={{
          paddingRight: isMobile ? '0' : '24px',
          height: isMobile ? 44 : 48,
          display: 'flex',
          alignItems: 'center',
          fontSize: '14px',
          color: '#fff',
          whiteSpace: 'nowrap',
          minWidth: isMobile ? 'auto' : '140px',
          justifyContent: 'flex-end',
          gap: isMobile ? 10 : 16
        }}>
          <NotificationCenter />
          <Dropdown
            menu={{ items: userMenuItems, onClick: onUserMenuClick }}
            placement="bottomRight"
          >
            <Space style={{ cursor: 'pointer' }}>
              <Avatar
                size={isMobile ? 22 : 24}
                src={user?.avatar ? `${BASE_URL}${user.avatar}` : null}
                icon={<UserOutlined />}
              />
              {!isMobile && (
                <span>欢迎您,{user?.username || '用户'} <DownOutlined /></span>
              )}
            </Space>
          </Dropdown>
        </div>
      </div>

      <Drawer
        title="智慧社区"
        placement="left"
        width={260}
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        styles={{ body: { padding: 0 } }}
      >
        <Menu
          mode="inline"
          selectedKeys={[currentKey]}
          items={menuItems}
          onClick={handleClick}
          style={{ border: 'none', marginTop: 4 }}
        />
      </Drawer>

      <ProfileModal
        visible={showProfile}
        onClose={() => setShowProfile(false)}
        user={user}
      />
    </>
  );
}

export default TopMenu;

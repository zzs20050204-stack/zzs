import { lazy, ReactNode } from "react"

// 懒加载所有页面
const UserOutlined = lazy(() => import("../page/UserOutlined"));
const Notification = lazy(() => import("../page/NotificationOutlined"));
const Repair = lazy(() => import("../page/Repair"));
const UserManage = lazy(() => import("../page/UserManage"));
const Goods = lazy(() => import("../page/Goods"));
const MyPage = lazy(() => import("../page/MyPage"));
const AdminOrder = lazy(() => import("../page/AdminOrder"));

// 物业模块（最终版）
const Property = lazy(() => import("../page/Property"));              // 用户：我的物业缴费
const AdminProperty = lazy(() => import("../page/Property/adminProperty"));    // 管理员：缴费单管理
const Suggestion = lazy(() => import("../page/Suggestion"));
const AdminSuggestion = lazy(() => import("../page/Suggestion/adminSuggestion"));  // 管理员：建议反馈管理

const VisitorPage = lazy(() => import("../page/VisitorPage"));
const VisitorAudit = lazy(() => import("../page/VisitorPage/AuditPage"));
const Dashboard = lazy(() => import("../page/Dashboard"));

// ✅新增AI助手懒加载
const AiAssistant = lazy(() => import("../page/Ai/AiAssistant"));

// 路由映射表：全部 带 / 斜杠
export const componentMap: Record<string, ReactNode> = {
  "/goods": <Goods />,
  "/order": <AdminOrder />,
  "/household": <UserOutlined />,
  "/repair": <Repair />,
  "/notices": <Notification />,
  "/users": <UserManage />,
  "/my": <MyPage />,

  // 物业缴费（用户端）
  "/property": <Property />,
  // 缴费单管理（管理员端）
  "/admin/property": <AdminProperty />,
  // 建议反馈
  "/suggestion": <Suggestion />,
  // 建议反馈管理（管理员端）
  "/admin/suggestion": <AdminSuggestion />,
  "/visitor": <VisitorPage />,
  "/admin/visitor": <VisitorAudit />,
  "/dashboard": <Dashboard />,
  // ✅AI助手
  "/ai-assistant": <AiAssistant />
};
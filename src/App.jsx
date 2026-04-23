// App.jsx — Root component với routing và auth protection
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { TaskConfigProvider } from './context/TaskConfigContext';
import MainLayout from './components/layout/MainLayout';
import LoginPage from './pages/LoginPage';
import PendingPage from './pages/PendingPage';
import TodayPage from './pages/TodayPage';
import LoadingSpinner from './components/common/LoadingSpinner';
import ErrorBoundary from './components/common/ErrorBoundary';

// Lazy-load các trang ít dùng hơn → giảm bundle size khởi tạo
const AllTasksPage = lazy(() => import('./pages/AllTasksPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const MembersPage = lazy(() => import('./pages/MembersPage'));
const TrashPage = lazy(() => import('./pages/TrashPage'));
const TaskConfigPage = lazy(() => import('./pages/TaskConfigPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const PenaltyManagementPage = lazy(() => import('./pages/PenaltyManagementPage'));
const SystemInfoPage = lazy(() => import('./pages/SystemInfoPage'));

// Lazy-load module Chỉ tiêu / Cơ sở (Unit)
import UnitLayout from './components/unit/UnitLayout';
const UnitDashboard = lazy(() => import('./components/unit/UnitDashboard'));
const UnitSubmissionsList = lazy(() => import('./components/unit/UnitSubmissionsList'));
const UnitSubmitPage = lazy(() => import('./components/unit/UnitSubmitPage'));
const UnitPlansList = lazy(() => import('./components/unit/UnitPlansList'));
const UnitPlanDetail = lazy(() => import('./components/unit/UnitPlanDetail'));

// Lazy-load module Quản lý nội bộ (Internal)
const CriteriaSetsPage = lazy(() => import('./components/criteria/CriteriaSetsPage'));
const CriteriaOverviewPage = lazy(() => import('./components/criteria/CriteriaOverviewPage'));
const CriteriaDetailPage = lazy(() => import('./components/criteria/CriteriaDetailPage'));
const CriteriaSetDetailPage = lazy(() => import('./components/criteria/CriteriaSetDetailPage'));
const PlansManagePage = lazy(() => import('./components/criteria/PlansManagePage'));
const PlanDetailPage = lazy(() => import('./components/criteria/PlanDetailPage'));
const UnitsPage = lazy(() => import('./components/criteria/UnitsPage'));

// Route bảo vệ — yêu cầu đăng nhập
const ProtectedRoute = ({ children, roles }) => {
  const { currentUser, userProfile, isUnit, loading, isPending } = useAuth();

  if (loading) return <LoadingSpinner fullScreen />;
  if (!currentUser) return <Navigate to="/login" replace />;
  if (isUnit) return <Navigate to="/unit/dashboard" replace />;
  if (!userProfile) return <LoadingSpinner fullScreen />;

  // User chờ duyệt → chuyển sang trang chờ
  if (isPending) return <Navigate to="/pending" replace />;

  // Kiểm tra quyền nếu có yêu cầu
  if (roles && !roles.includes(userProfile.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Route cho trang login — nếu đã login thì redirect về home
const PublicRoute = ({ children }) => {
  const { currentUser, isUnit, loading } = useAuth();
  if (loading) return <LoadingSpinner fullScreen />;
  if (currentUser) {
    return isUnit ? <Navigate to="/unit/dashboard" replace /> : <Navigate to="/" replace />;
  }
  return children;
};

// Route cho trang pending — chỉ hiện khi user đang chờ duyệt
const PendingRoute = () => {
  const { currentUser, loading, isPending } = useAuth();
  if (loading) return <LoadingSpinner fullScreen />;
  if (!currentUser) return <Navigate to="/login" replace />;
  if (!isPending) return <Navigate to="/" replace />;
  return <PendingPage />;
};

// Route bảo vệ dành riêng cho Unit
const UnitRoute = ({ children }) => {
  const { currentUser, isUnit, loading } = useAuth();

  if (loading) return <LoadingSpinner fullScreen />;
  if (!currentUser) return <Navigate to="/login" replace />;
  if (!isUnit) return <Navigate to="/" replace />;

  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={
        <PublicRoute><LoginPage /></PublicRoute>
      } />
      <Route path="/pending" element={<PendingRoute />} />

      <Route element={
        <ProtectedRoute><MainLayout /></ProtectedRoute>
      }>
        <Route index element={<TodayPage />} />
        <Route path="tasks" element={<AllTasksPage />} />
        <Route path="dashboard" element={
          <ProtectedRoute roles={['admin', 'manager']}><DashboardPage /></ProtectedRoute>
        } />
        <Route path="members" element={
          <ProtectedRoute roles={['admin']}><MembersPage /></ProtectedRoute>
        } />
        <Route path="trash" element={
          <ProtectedRoute roles={['admin']}><TrashPage /></ProtectedRoute>
        } />
        <Route path="task-config" element={
          <ProtectedRoute roles={['admin']}><TaskConfigPage /></ProtectedRoute>
        } />
        <Route path="penalties" element={
          <ProtectedRoute roles={['admin', 'manager']}><PenaltyManagementPage /></ProtectedRoute>
        } />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="system-info" element={<SystemInfoPage />} />

        {/* Module Chỉ tiêu & Kế hoạch (Admin/Manager) */}
        <Route path="criteria-sets" element={
          <ProtectedRoute roles={['admin', 'manager']}><CriteriaSetsPage /></ProtectedRoute>
        } />
        <Route path="criteria-set/:setId" element={
          <ProtectedRoute roles={['admin', 'manager']}><CriteriaSetDetailPage /></ProtectedRoute>
        } />
        <Route path="criteria-overview/:criteriaSetId" element={
          <ProtectedRoute roles={['admin', 'manager']}><CriteriaOverviewPage /></ProtectedRoute>
        } />
        <Route path="criteria-detail/:periodId/:submissionId" element={
          <ProtectedRoute roles={['admin', 'manager']}><CriteriaDetailPage /></ProtectedRoute>
        } />
        <Route path="plans-manage" element={
          <ProtectedRoute roles={['admin', 'manager']}><PlansManagePage /></ProtectedRoute>
        } />
        <Route path="plans/:planId" element={
          <ProtectedRoute roles={['admin', 'manager']}><PlanDetailPage /></ProtectedRoute>
        } />
        <Route path="units" element={
          <ProtectedRoute roles={['admin', 'manager']}><UnitsPage /></ProtectedRoute>
        } />
      </Route>

      {/* ====== ROUTES CHO CƠ SỞ (UNIT) ====== */}
      <Route path="/unit" element={<UnitRoute><UnitLayout /></UnitRoute>}>
        <Route path="dashboard" element={<UnitDashboard />} />
        <Route path="submissions" element={<UnitSubmissionsList />} />
        <Route path="submit/:criteriaSetId" element={<UnitSubmitPage />} />
        <Route path="plans" element={<UnitPlansList />} />
        <Route path="plans/:planId" element={<UnitPlanDetail />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ErrorBoundary>
          <TaskConfigProvider>
            <NotificationProvider>
              <Suspense fallback={<LoadingSpinner fullScreen />}>
                <AppRoutes />
              </Suspense>
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 3500,
                  className: 'dark:bg-gray-800 dark:text-white dark:border dark:border-gray-700',
                  style: {
                    borderRadius: '16px',
                    background: 'var(--toast-bg, #ffffff)',
                    color: 'var(--toast-color, #1f2937)',
                    fontSize: '14px',
                    fontWeight: '600',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
                  },
                  success: {
                    iconTheme: { primary: '#10b981', secondary: '#fff' },
                  },
                  error: {
                    iconTheme: { primary: '#ef4444', secondary: '#fff' },
                  },
                }}
              />
            </NotificationProvider>
          </TaskConfigProvider>
        </ErrorBoundary>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;

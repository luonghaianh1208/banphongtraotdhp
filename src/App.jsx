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

// Route bảo vệ — yêu cầu đăng nhập
const ProtectedRoute = ({ children, roles }) => {
  const { currentUser, userProfile, loading, isPending } = useAuth();

  if (loading) return <LoadingSpinner fullScreen />;
  if (!currentUser) return <Navigate to="/login" replace />;
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
  const { currentUser, loading } = useAuth();
  if (loading) return <LoadingSpinner fullScreen />;
  if (currentUser) return <Navigate to="/" replace />;
  return children;
};

// Route cho trang pending — chỉ hiện khi user đang chờ duyệt
const PendingRoute = () => {
  const { currentUser, userProfile, loading, isPending } = useAuth();
  if (loading) return <LoadingSpinner fullScreen />;
  if (!currentUser) return <Navigate to="/login" replace />;
  if (!isPending) return <Navigate to="/" replace />;
  return <PendingPage />;
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
                  duration: 3000,
                  style: { borderRadius: '12px', background: '#1f2937', color: '#fff', fontSize: '14px' },
                  success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
                  error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
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

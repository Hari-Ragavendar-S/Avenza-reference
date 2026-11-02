import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import AdminLoginPage from './pages/AdminLoginPage'

// Redirect /ref/:code → /register?ref=:code
function RefRedirect() {
  const { code } = useParams()
  return <Navigate to={`/register?ref=${code}`} replace />
}

// User pages
import UserLayout from './layouts/UserLayout'
import UserDashboard from './pages/user/Dashboard'
import UserFXUWallet from './pages/user/FXUWallet'
import UserWallet from './pages/user/Wallet'
import UserTrades from './pages/user/Trades'
import UserOrders from './pages/user/Orders'
import UserAIBot from './pages/user/AIBot'
import UserPlans from './pages/user/Plans'
import UserReferral from './pages/user/Referral'
import UserMarket from './pages/user/Market'
import UserTickets from './pages/user/Tickets'
import UserSecurity from './pages/user/Security'
import UserProfile from './pages/user/Profile'
import UserNotifications from './pages/user/Notifications'
import UserInvestments from './pages/user/Investments'
import UserAwards from './pages/user/Awards'
import UserInternalTransfer from './pages/user/InternalTransfer'
import UserKYC from './pages/user/KYC'

// Admin pages
import AdminLayout from './layouts/AdminLayout'
import AdminDashboard from './pages/admin/Dashboard'
import AdminUsers from './pages/admin/Users'
import AdminDeposits from './pages/admin/Deposits'
import AdminWithdrawals from './pages/admin/Withdrawals'
import AdminMarkets from './pages/admin/Markets'
import AdminPlans from './pages/admin/Plans'
import AdminReferrals from './pages/admin/Referrals'
import AdminTickets from './pages/admin/Tickets'
import AdminSettings from './pages/admin/Settings'
import AdminKYC from './pages/admin/KYC'
import AdminReports from './pages/admin/Reports'
import AdminROI from './pages/admin/ROI'
import AdminFXUWallet from './pages/admin/FXUWallet'
import AdminInternalTransfers from './pages/admin/InternalTransfers'

function ProtectedRoute({ children, requiredRole }) {
  const { isAuthenticated, role } = useAuthStore()
  if (!isAuthenticated) return <Navigate to={requiredRole === 'admin' ? '/admin-login' : '/login'} replace />
  if (requiredRole && role !== requiredRole) {
    return <Navigate to={role === 'admin' ? '/admin' : '/dashboard'} replace />
  }
  return children
}

export default function App() {
  const { isAuthenticated, role } = useAuthStore()

  return (
    <BrowserRouter>
      <Routes>
        {/* Public landing */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/register" element={
          isAuthenticated
            ? <Navigate to={role === 'admin' ? '/admin' : '/dashboard'} replace />
            : <RegisterPage />
        } />
        <Route path="/login" element={
          isAuthenticated
            ? <Navigate to={role === 'admin' ? '/admin' : '/dashboard'} replace />
            : <LoginPage />
        } />
        <Route path="/admin-login" element={
          isAuthenticated && role === 'admin'
            ? <Navigate to="/admin" replace />
            : <AdminLoginPage />
        } />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        {/* Referral link redirect — /ref/FXU1234 → /register?ref=FXU1234 */}
        <Route path="/ref/:code" element={<RefRedirect />} />

        {/* User Routes */}
        <Route path="/app" element={
          <ProtectedRoute requiredRole="user"><UserLayout /></ProtectedRoute>
        }>
          <Route index element={<Navigate to="/dashboard" replace />} />
        </Route>

        <Route element={<ProtectedRoute requiredRole="user"><UserLayout /></ProtectedRoute>}>
          <Route path="dashboard" element={<UserDashboard />} />
          <Route path="wallet" element={<UserWallet />} />
          <Route path="fxu-wallet" element={<UserFXUWallet />} />
          <Route path="transactions" element={<UserFXUWallet defaultTab="transactions" />} />
          <Route path="internal-transfer" element={<UserInternalTransfer />} />
          <Route path="investments" element={<UserInvestments />} />
          <Route path="my-packages" element={<UserInvestments defaultTab="active" />} />
          <Route path="trades" element={<UserTrades />} />
          <Route path="orders" element={<UserOrders />} />
          <Route path="ai-bot" element={<UserAIBot />} />
          <Route path="plans" element={<UserPlans />} />
          <Route path="deposit" element={<UserFXUWallet defaultTab="deposit" />} />
          <Route path="withdraw" element={<Navigate to="/fxu-wallet?tab=withdraw" replace />} />
          <Route path="referral" element={<UserReferral />} />
          <Route path="awards" element={<UserAwards />} />
          <Route path="market" element={<UserMarket />} />
          <Route path="tickets" element={<UserTickets />} />
          <Route path="security" element={<UserSecurity />} />
          <Route path="profile" element={<UserProfile />} />
          <Route path="notifications" element={<UserNotifications />} />
          <Route path="kyc" element={<UserKYC />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin" element={
          <ProtectedRoute requiredRole="admin"><AdminLayout /></ProtectedRoute>
        }>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="deposits" element={<AdminDeposits />} />
          <Route path="withdrawals" element={<AdminWithdrawals />} />
          <Route path="markets" element={<AdminMarkets />} />
          <Route path="plans" element={<AdminPlans />} />
          <Route path="referrals" element={<AdminReferrals />} />
          <Route path="tickets" element={<AdminTickets />} />
          <Route path="kyc" element={<AdminKYC />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="fxu-wallet" element={<AdminFXUWallet />} />
          <Route path="internal-transfers" element={<AdminInternalTransfers />} />
          <Route path="roi" element={<AdminROI />} />
        </Route>

        <Route path="*" element={
          <Navigate to={isAuthenticated ? (role === 'admin' ? '/admin' : '/dashboard') : '/'} replace />
        } />
      </Routes>
    </BrowserRouter>
  )
}

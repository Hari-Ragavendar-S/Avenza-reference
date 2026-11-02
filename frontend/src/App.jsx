import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import TradingSplashScreen from './components/TradingSplashScreen';
import Header from './components/Header';
import Footer from './components/Footer';
import ScrollToTopButton, { ScrollToTopOnMount } from './components/ScrollToTop';
import Home from './pages/Home';
import Markets from './pages/Markets';
import Trading from './pages/Trading';
import About from './pages/About';
import FeaturesPage from './pages/FeaturesPage';
import FAQPage from './pages/FAQPage';
import ContactPage from './pages/ContactPage';
import Login from './pages/Login';
import Register from './pages/Register';
import { ThemeProvider } from './hooks/useTheme';

// Admin imports
import './admin/admin.css';
import AdminLoginPage from './admin/pages/AdminLoginPage';
import AdminLayout from './admin/layouts/AdminLayout';
import Dashboard from './admin/pages/Dashboard';
import Users from './admin/pages/Users';
import UserDetail from './admin/pages/UserDetail';
import AdminWalletTransactions from './admin/pages/AdminWalletTransactions';
import Deposits from './admin/pages/Deposits';
import Withdrawals from './admin/pages/Withdrawals';
import AdminMarkets from './admin/pages/Markets';
import Plans from './admin/pages/Plans';
import Referrals from './admin/pages/Referrals';
import Tickets from './admin/pages/Tickets';
import AdminSupport from './admin/pages/Support';
import AdminSupportChat from './admin/pages/SupportChat';
import Reports from './admin/pages/Reports';
import ROI from './admin/pages/ROI';
import Wallet from './admin/pages/Wallet';
import Settings from './admin/pages/Settings';
import InternalTransfers from './admin/pages/InternalTransfers';
import AdminLevelIncome from './admin/pages/LevelIncome';
import AdminReferralBonus from './admin/pages/ReferralBonus';
import PublicWalletConfig from './admin/pages/PublicWalletConfig';
import PublicTransactions from './admin/pages/PublicTransactions';
import PublicDistributionDetail from './admin/pages/PublicDistributionDetail';

// User Panel imports
import UserLayout from './layouts/UserLayout';
import UserDashboard from './pages/user/Dashboard';
import UserWallet from './pages/user/Wallet';
import UserDeposit from './pages/user/Deposit';
import UserWithdraw from './pages/user/Withdraw';
import UserInvestments from './pages/user/Investments';
import UserMyPackages from './pages/user/MyPackages';
import UserReferral from './pages/user/Referral';
import UserAwards from './pages/user/Awards';
import UserMarket from './pages/user/Market';
import UserTrades from './pages/user/Trades';
import UserOrders from './pages/user/Orders';
import UserAIBot from './pages/user/AIBot';
import UserPlans from './pages/user/Plans';
import UserInvest from './pages/user/Invest';
import UserTickets from './pages/user/Tickets';
import UserProfile from './pages/user/Profile';
import UserSecurity from './pages/user/Security';
import UserInternalTransfer from './pages/user/InternalTransfer';
import UserKYC from './pages/user/KYC';
import UserNotifications from './pages/user/Notifications';
import UserTransactions from './pages/user/Transactions';
import TransferChat from './pages/user/TransferChat';
import TransactionDetail from './pages/user/TransactionDetail';
import Profile from './pages/user/Profile';
import LevelIncome from './pages/user/LevelIncome';
import ReferralBonus from './pages/user/ReferralBonus';
import YourLevel from './pages/user/YourLevel';
import BinaryMatching from './pages/user/BinaryMatching';
import BinaryTree from './pages/user/BinaryTree';
import MatchingTiers from './pages/user/MatchingTiers';
import MatchingHistory from './pages/user/MatchingHistory';
import MatchingHistoryDetailed from './pages/user/MatchingHistoryDetailed';
import DownlineMatchingBonus from './pages/user/DownlineMatchingBonus';
import PublicDepositHistory from './pages/user/PublicDepositHistory';

// Public pages (no authentication)
import PublicDeposit from './pages/public/PublicDeposit';
import TopUpUser from './pages/public/TopUpUser';

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Show splash for exactly 3 seconds
    const timer = setTimeout(() => {
      setLoading(false);
      // Mark that splash screen was shown
      sessionStorage.setItem('splashShown', 'true');
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <TradingSplashScreen />;
  }

  return (
    <ThemeProvider>
      <Router>
        <ScrollToTopOnMount />
        <Routes>
          {/* Admin Routes - Separate Layout */}
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="users" element={<Users />} />
            <Route path="user/:userId" element={<UserDetail />} />
            <Route path="wallet-transactions" element={<AdminWalletTransactions />} />
            <Route path="deposits" element={<Deposits />} />
            <Route path="withdrawals" element={<Withdrawals />} />
            <Route path="markets" element={<AdminMarkets />} />
            <Route path="plans" element={<Plans />} />
            <Route path="internal-transfers" element={<InternalTransfers />} />
            <Route path="level-income" element={<AdminLevelIncome />} />
            <Route path="referral-bonus" element={<AdminReferralBonus />} />
            <Route path="referrals" element={<Referrals />} />
            <Route path="tickets" element={<Tickets />} />
            <Route path="support" element={<AdminSupport />} />
            <Route path="support/chat/:userId" element={<AdminSupportChat />} />
            <Route path="reports" element={<Reports />} />
            <Route path="roi" element={<ROI />} />
            <Route path="wallet" element={<Wallet />} />
            <Route path="settings" element={<Settings />} />
            <Route path="public-wallet-config" element={<PublicWalletConfig />} />
            <Route path="public-transactions" element={<PublicTransactions />} />
            <Route path="public-distribution/:sourceType/:txHash" element={<PublicDistributionDetail />} />
          </Route>

          {/* User Panel Routes - Separate Layout (No Header/Footer) */}
          <Route element={<UserLayout />}>
            <Route path="/dashboard" element={<UserDashboard />} />
            <Route path="/wallet" element={<UserWallet />} />
            <Route path="/deposit" element={<UserDeposit />} />
            <Route path="/withdraw" element={<UserWithdraw />} />
            <Route path="/investments" element={<UserInvestments />} />
            <Route path="/my-packages" element={<UserMyPackages />} />
            <Route path="/referral" element={<UserReferral />} />
            <Route path="/your-level" element={<YourLevel />} />
            <Route path="/level-income" element={<LevelIncome />} />
            <Route path="/referral-bonus" element={<ReferralBonus />} />
            <Route path="/awards" element={<UserAwards />} />
            <Route path="/market" element={<UserMarket />} />
            <Route path="/trades" element={<UserTrades />} />
            <Route path="/orders" element={<UserOrders />} />
            <Route path="/ai-bot" element={<UserAIBot />} />
            <Route path="/plans" element={<UserPlans />} />
            <Route path="/invest" element={<UserInvest />} />
            <Route path="/tickets" element={<UserTickets />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/user-profile" element={<Profile />} />
            <Route path="/security" element={<UserSecurity />} />
            <Route path="/internal-transfer" element={<UserInternalTransfer />} />
            <Route path="/transfer/chat/:userId" element={<TransferChat />} />
            <Route path="/transaction/:transactionId" element={<TransactionDetail />} />
            <Route path="/kyc" element={<UserKYC />} />
            <Route path="/notifications" element={<UserNotifications />} />
            <Route path="/transactions" element={<UserTransactions />} />
            <Route path="/binary-matching" element={<BinaryMatching />} />
            <Route path="/binary-tree" element={<BinaryTree />} />
            <Route path="/matching-tiers" element={<MatchingTiers />} />
            <Route path="/matching-history" element={<MatchingHistory />} />
            <Route path="/matching-history-detailed" element={<MatchingHistoryDetailed />} />
            <Route path="/downline-matching-bonus" element={<DownlineMatchingBonus />} />
            <Route path="/public-deposit-history" element={<PublicDepositHistory />} />
          </Route>

          {/* Main Website Routes - With Header/Footer */}
          <Route path="*" element={
            <div className="app">
              <Header />
              <main>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/markets" element={<Markets />} />
                  <Route path="/trading" element={<Trading />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/features" element={<FeaturesPage />} />
                  <Route path="/faq" element={<FAQPage />} />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/public-deposit" element={<PublicDeposit />} />
                  <Route path="/top-up-user" element={<TopUpUser />} />
                  <Route path="/:referralUsername/left" element={<Register />} />
                  <Route path="/:referralUsername/right" element={<Register />} />
                  <Route path="/:referralUsername" element={<Register />} />
                </Routes>
              </main>
              <Footer />
              <ScrollToTopButton />
            </div>
          } />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;

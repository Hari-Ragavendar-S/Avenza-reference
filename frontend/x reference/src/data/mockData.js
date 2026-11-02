// Realistic Forex Mock Data

export const marketPairs = [
  { id: 1, pair: 'EUR/USD', price: 1.08542, change: 0.0023, changePct: 0.21, high: 1.0891, low: 1.0821, volume: '2.4B', bid: 1.08538, ask: 1.08546, spread: 0.8 },
  { id: 2, pair: 'GBP/USD', price: 1.26731, change: -0.0041, changePct: -0.32, high: 1.2731, low: 1.2641, volume: '1.8B', bid: 1.26725, ask: 1.26737, spread: 1.2 },
  { id: 3, pair: 'USD/JPY', price: 149.872, change: 0.341, changePct: 0.23, high: 150.21, low: 149.41, volume: '3.1B', bid: 149.868, ask: 149.876, spread: 0.8 },
  { id: 4, pair: 'USD/CHF', price: 0.90124, change: -0.0018, changePct: -0.20, high: 0.9041, low: 0.8991, volume: '980M', bid: 0.90119, ask: 0.90129, spread: 1.0 },
  { id: 5, pair: 'AUD/USD', price: 0.64821, change: 0.0031, changePct: 0.48, high: 0.6511, low: 0.6451, volume: '1.2B', bid: 0.64817, ask: 0.64825, spread: 1.4 },
  { id: 6, pair: 'USD/CAD', price: 1.36542, change: 0.0019, changePct: 0.14, high: 1.3681, low: 1.3621, volume: '1.1B', bid: 1.36537, ask: 1.36547, spread: 1.0 },
  { id: 7, pair: 'NZD/USD', price: 0.59341, change: -0.0022, changePct: -0.37, high: 0.5971, low: 0.5911, volume: '620M', bid: 0.59337, ask: 0.59345, spread: 1.6 },
  { id: 8, pair: 'EUR/GBP', price: 0.85621, change: 0.0011, changePct: 0.13, high: 0.8591, low: 0.8531, volume: '890M', bid: 0.85617, ask: 0.85625, spread: 1.0 },
  { id: 9, pair: 'EUR/JPY', price: 162.541, change: 0.621, changePct: 0.38, high: 163.21, low: 161.81, volume: '1.4B', bid: 162.537, ask: 162.545, spread: 0.8 },
  { id: 10, pair: 'GBP/JPY', price: 189.872, change: -0.341, changePct: -0.18, high: 190.51, low: 189.21, volume: '1.1B', bid: 189.867, ask: 189.877, spread: 1.0 },
]

export const topCoins = [
  { id: 1, symbol: 'BTC', name: 'Bitcoin', price: 67842.50, change: 2.34, marketCap: '1.33T', volume: '28.4B', icon: 'BTC' },
  { id: 2, symbol: 'ETH', name: 'Ethereum', price: 3521.80, change: 1.87, marketCap: '423B', volume: '14.2B', icon: 'ETH' },
  { id: 3, symbol: 'BNB', name: 'BNB', price: 412.30, change: -0.54, marketCap: '63.4B', volume: '1.8B', icon: 'BNB' },
  { id: 4, symbol: 'SOL', name: 'Solana', price: 178.42, change: 4.21, marketCap: '82.1B', volume: '4.3B', icon: 'SOL' },
  { id: 5, symbol: 'XRP', name: 'XRP', price: 0.6241, change: -1.23, marketCap: '35.2B', volume: '2.1B', icon: 'XRP' },
  { id: 6, symbol: 'ADA', name: 'Cardano', price: 0.4821, change: 0.87, marketCap: '17.1B', volume: '890M', icon: 'ADA' },
]

export const tradeHistory = [
  { id: 1, pair: 'EUR/USD', type: 'BUY', lots: 0.5, openPrice: 1.08321, closePrice: 1.08542, profit: 110.50, status: 'Closed', openTime: '2024-04-05 09:14:22', closeTime: '2024-04-05 14:32:11', duration: '5h 18m' },
  { id: 2, pair: 'GBP/USD', type: 'SELL', lots: 1.0, openPrice: 1.27012, closePrice: 1.26731, profit: 281.00, status: 'Closed', openTime: '2024-04-05 10:22:45', closeTime: '2024-04-05 16:41:30', duration: '6h 19m' },
  { id: 3, pair: 'USD/JPY', type: 'BUY', lots: 0.3, openPrice: 149.521, closePrice: 149.872, profit: 70.20, status: 'Closed', openTime: '2024-04-04 08:11:00', closeTime: '2024-04-04 12:55:22', duration: '4h 44m' },
  { id: 4, pair: 'AUD/USD', type: 'SELL', lots: 2.0, openPrice: 0.65102, closePrice: 0.64821, profit: 562.00, status: 'Closed', openTime: '2024-04-04 11:30:00', closeTime: '2024-04-04 18:20:10', duration: '6h 50m' },
  { id: 5, pair: 'EUR/JPY', type: 'BUY', lots: 0.8, openPrice: 161.920, closePrice: 162.541, profit: 414.72, status: 'Closed', openTime: '2024-04-03 07:45:00', closeTime: '2024-04-03 15:10:00', duration: '7h 25m' },
  { id: 6, pair: 'USD/CHF', type: 'SELL', lots: 1.5, openPrice: 0.90342, closePrice: 0.90124, profit: 327.00, status: 'Closed', openTime: '2024-04-03 09:00:00', closeTime: '2024-04-03 17:30:00', duration: '8h 30m' },
  { id: 7, pair: 'GBP/JPY', type: 'BUY', lots: 0.4, openPrice: 190.213, closePrice: 189.872, profit: -136.40, status: 'Closed', openTime: '2024-04-02 10:15:00', closeTime: '2024-04-02 14:45:00', duration: '4h 30m' },
]

export const openOrders = [
  { id: 1, pair: 'EUR/USD', type: 'BUY', lots: 1.0, openPrice: 1.08321, currentPrice: 1.08542, sl: 1.0800, tp: 1.0900, profit: 221.00, margin: 1083.21, openTime: '2024-04-06 08:30:00' },
  { id: 2, pair: 'GBP/USD', type: 'SELL', lots: 0.5, openPrice: 1.27012, currentPrice: 1.26731, sl: 1.2750, tp: 1.2600, profit: 140.50, margin: 635.06, openTime: '2024-04-06 09:15:00' },
  { id: 3, pair: 'USD/JPY', type: 'BUY', lots: 2.0, openPrice: 149.521, currentPrice: 149.872, sl: 149.00, tp: 150.50, profit: 468.00, margin: 1993.61, openTime: '2024-04-06 10:00:00' },
]

export const depositHistory = [
  { id: 1, txId: 'DEP-2024-001842', method: 'Bank Transfer', amount: 5000.00, currency: 'USD', status: 'Completed', date: '2024-04-01 10:22:00', fee: 0 },
  { id: 2, txId: 'DEP-2024-001791', method: 'USDT (TRC20)', amount: 2500.00, currency: 'USD', status: 'Completed', date: '2024-03-28 14:45:00', fee: 1.50 },
  { id: 3, txId: 'DEP-2024-001654', method: 'Credit Card', amount: 1000.00, currency: 'USD', status: 'Completed', date: '2024-03-20 09:10:00', fee: 25.00 },
  { id: 4, txId: 'DEP-2024-001521', method: 'Bitcoin', amount: 3200.00, currency: 'USD', status: 'Pending', date: '2024-04-06 07:30:00', fee: 0 },
  { id: 5, txId: 'DEP-2024-001488', method: 'Bank Transfer', amount: 10000.00, currency: 'USD', status: 'Completed', date: '2024-03-15 11:00:00', fee: 0 },
]

export const withdrawHistory = [
  { id: 1, txId: 'WIT-2024-000921', method: 'Bank Transfer', amount: 2000.00, currency: 'USD', status: 'Completed', date: '2024-04-03 13:20:00', fee: 15.00 },
  { id: 2, txId: 'WIT-2024-000887', method: 'USDT (ERC20)', amount: 1500.00, currency: 'USD', status: 'Processing', date: '2024-04-05 16:45:00', fee: 5.00 },
  { id: 3, txId: 'WIT-2024-000812', method: 'Bank Transfer', amount: 3000.00, currency: 'USD', status: 'Completed', date: '2024-03-25 10:30:00', fee: 15.00 },
]

export const aiPlans = [
  { id: 1, name: 'Starter Bot', price: 49, duration: 30, minDeposit: 500, maxProfit: 8, description: 'Low-risk scalping strategy on major pairs', pairs: ['EUR/USD', 'GBP/USD'], status: 'active', subscribers: 1240 },
  { id: 2, name: 'Growth Bot', price: 149, duration: 30, minDeposit: 2000, maxProfit: 18, description: 'Balanced swing trading with AI trend detection', pairs: ['EUR/USD', 'USD/JPY', 'GBP/USD'], status: 'active', subscribers: 842 },
  { id: 3, name: 'Pro Trader Bot', price: 349, duration: 30, minDeposit: 5000, maxProfit: 32, description: 'High-frequency multi-pair AI trading system', pairs: ['All Major Pairs'], status: 'active', subscribers: 421 },
  { id: 4, name: 'Elite Bot', price: 799, duration: 30, minDeposit: 15000, maxProfit: 55, description: 'Institutional-grade AI with portfolio management', pairs: ['All Pairs + Crypto'], status: 'active', subscribers: 98 },
]

export const referralData = {
  code: 'FXU-REF-7K2M',
  link: 'https://fxuniverse.live/ref/FXU-REF-7K2M',
  totalReferrals: 14,
  activeReferrals: 9,
  totalEarned: 1240.50,
  pendingEarnings: 180.00,
  commissionRate: 15,
  referrals: [
    { id: 1, name: 'Marcus Johnson', email: 'mar***@gmail.com', joinDate: '2024-03-10', deposits: 5000, commission: 375.00, status: 'Active' },
    { id: 2, name: 'Sarah Williams', email: 'sar***@yahoo.com', joinDate: '2024-03-18', deposits: 2500, commission: 187.50, status: 'Active' },
    { id: 3, name: 'David Chen', email: 'dav***@outlook.com', joinDate: '2024-03-25', deposits: 1000, commission: 75.00, status: 'Active' },
    { id: 4, name: 'Emma Rodriguez', email: 'emm***@gmail.com', joinDate: '2024-04-01', deposits: 3000, commission: 225.00, status: 'Active' },
    { id: 5, name: 'James Wilson', email: 'jam***@hotmail.com', joinDate: '2024-04-03', deposits: 0, commission: 0, status: 'Pending' },
  ]
}

export const supportTickets = [
  { id: 'TKT-2024-0041', subject: 'Withdrawal delay - 3 business days', category: 'Withdrawal', priority: 'High', status: 'Open', date: '2024-04-05 14:22:00', messages: 3 },
  { id: 'TKT-2024-0038', subject: 'AI Bot not executing trades', category: 'Technical', priority: 'Medium', status: 'In Progress', date: '2024-04-04 09:10:00', messages: 5 },
  { id: 'TKT-2024-0031', subject: 'KYC verification pending for 5 days', category: 'Account', priority: 'Medium', status: 'Resolved', date: '2024-03-30 11:45:00', messages: 7 },
  { id: 'TKT-2024-0024', subject: 'Referral commission not credited', category: 'Referral', priority: 'Low', status: 'Resolved', date: '2024-03-22 16:30:00', messages: 4 },
]

export const notifications = [
  { id: 1, type: 'trade', message: 'EUR/USD BUY order closed with +$221.00 profit', time: '2 min ago', read: false },
  { id: 2, type: 'deposit', message: 'Deposit of $5,000 confirmed via Bank Transfer', time: '1 hour ago', read: false },
  { id: 3, type: 'system', message: 'Your KYC verification has been approved', time: '3 hours ago', read: true },
  { id: 4, type: 'referral', message: 'New referral signup: Emma Rodriguez joined using your link', time: '1 day ago', read: true },
  { id: 5, type: 'plan', message: 'Growth Bot subscription renewed successfully', time: '2 days ago', read: true },
]

export const walletData = {
  totalBalance: 24850.75,
  availableBalance: 18320.50,
  inTrade: 4712.25,
  profit: 3240.50,
  bonus: 500.00,
  currencies: [
    { symbol: 'USD', name: 'US Dollar', balance: 18320.50, icon: '$' },
    { symbol: 'EUR', name: 'Euro', balance: 2840.20, icon: '€' },
    { symbol: 'GBP', name: 'British Pound', balance: 1240.80, icon: '£' },
    { symbol: 'BTC', name: 'Bitcoin', balance: 0.0842, icon: 'B' },
    { symbol: 'USDT', name: 'Tether', balance: 2449.25, icon: 'T' },
  ]
}

export const chartData = Array.from({ length: 30 }, (_, i) => {
  const base = 1.0800
  const rand = () => (Math.random() - 0.5) * 0.008
  const open = base + rand() + i * 0.0003
  const close = open + rand()
  return {
    date: new Date(2024, 2, i + 1).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    open: parseFloat(open.toFixed(5)),
    close: parseFloat(close.toFixed(5)),
    high: parseFloat((Math.max(open, close) + Math.abs(rand()) * 0.5).toFixed(5)),
    low: parseFloat((Math.min(open, close) - Math.abs(rand()) * 0.5).toFixed(5)),
    volume: Math.floor(Math.random() * 5000 + 2000),
    price: parseFloat(close.toFixed(5)),
  }
})

// Admin mock data
export const adminUsers = [
  { id: 1, name: 'Marcus Johnson', email: 'marcus.j@gmail.com', country: 'United States', balance: 12450.00, status: 'Active', kyc: 'Verified', joined: '2024-01-15', trades: 142 },
  { id: 2, name: 'Sarah Williams', email: 'sarah.w@yahoo.com', country: 'United Kingdom', balance: 8320.50, status: 'Active', kyc: 'Verified', joined: '2024-02-03', trades: 87 },
  { id: 3, name: 'David Chen', email: 'david.c@outlook.com', country: 'Singapore', balance: 31200.00, status: 'Active', kyc: 'Verified', joined: '2024-01-28', trades: 312 },
  { id: 4, name: 'Emma Rodriguez', email: 'emma.r@gmail.com', country: 'Spain', balance: 4100.00, status: 'Active', kyc: 'Pending', joined: '2024-03-10', trades: 23 },
  { id: 5, name: 'James Wilson', email: 'james.w@hotmail.com', country: 'Australia', balance: 0, status: 'Inactive', kyc: 'Not Submitted', joined: '2024-04-03', trades: 0 },
  { id: 6, name: 'Aisha Patel', email: 'aisha.p@gmail.com', country: 'India', balance: 7800.00, status: 'Active', kyc: 'Verified', joined: '2024-02-20', trades: 65 },
  { id: 7, name: 'Carlos Mendez', email: 'carlos.m@gmail.com', country: 'Mexico', balance: 15600.00, status: 'Suspended', kyc: 'Verified', joined: '2024-01-05', trades: 198 },
]

export const adminStats = {
  totalUsers: 4821,
  activeUsers: 3241,
  totalDeposits: 2841500,
  totalWithdrawals: 1240800,
  totalTrades: 184210,
  openTrades: 2841,
  revenue: 142050,
  pendingKyc: 142,
  pendingWithdrawals: 38,
  openTickets: 24,
}

export const revenueChartData = Array.from({ length: 12 }, (_, i) => ({
  month: new Date(2024, i, 1).toLocaleDateString('en-US', { month: 'short' }),
  deposits: Math.floor(Math.random() * 300000 + 150000),
  withdrawals: Math.floor(Math.random() * 150000 + 80000),
  revenue: Math.floor(Math.random() * 20000 + 8000),
}))

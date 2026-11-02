import { createAppKit } from '@reown/appkit'
import { EthersAdapter } from '@reown/appkit-adapter-ethers'
import { defineChain } from '@reown/appkit/networks'
import { BrowserProvider, parseEther, formatEther } from 'ethers'

// BSC Mainnet chain definition
export const bscMainnet = defineChain({
  id: 56,
  caipNetworkId: 'eip155:56',
  chainNamespace: 'eip155',
  name: 'BNB Smart Chain',
  nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
  rpcUrls: { default: { http: ['https://bsc-dataseed.binance.org/'] } },
  blockExplorers: { default: { name: 'BscScan', url: 'https://bscscan.com' } },
})

const projectId = '1bfd2bb271179b7feba57e5b0f1af942'

const ethersAdapter = new EthersAdapter()

// Initialize AppKit — supports MetaMask, Trust Wallet, Coinbase, OKX, SafePal, all WalletConnect wallets
export const appKit = createAppKit({
  adapters: [ethersAdapter],
  networks: [bscMainnet],
  projectId,
  metadata: {
    name: 'FXUniverse Protocol',
    description: 'Professional Forex Trading Platform',
    url: 'https://fxuniverse.live',
    icons: ['https://fxuniverse.live/logo-icon.png'],
  },
  features: {
    analytics: false,
    email: false,
    socials: false,
  },
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#3b82f6',
    '--w3m-border-radius-master': '12px',
    '--w3m-font-family': 'Inter, sans-serif',
  },
  defaultNetwork: bscMainnet,
})

// Get ethers provider from AppKit
export const getProvider = () => {
  const walletProvider = appKit.getWalletProvider()
  if (!walletProvider) throw new Error('No wallet connected')
  return new BrowserProvider(walletProvider)
}

// Get connected address
export const getAddress = () => appKit.getAddress()

// Check if connected
export const isConnected = () => !!appKit.getAddress()

// Get BNB balance
export const getBalance = async (address) => {
  try {
    const provider = getProvider()
    const balance = await provider.getBalance(address)
    return parseFloat(formatEther(balance)).toFixed(6)
  } catch {
    return '0'
  }
}

// Send BNB to receiver — returns tx hash after on-chain confirmation
export const sendBNB = async (toAddress, bnbAmount) => {
  const provider = getProvider()
  const signer = await provider.getSigner()

  // Ensure on BSC
  const network = await provider.getNetwork()
  if (Number(network.chainId) !== 56) {
    await appKit.switchNetwork(bscMainnet)
    await new Promise((r) => setTimeout(r, 1000))
  }

  const tx = await signer.sendTransaction({
    to: toAddress,
    value: parseEther(bnbAmount.toString()),
  })

  // Wait for blockchain confirmation
  const receipt = await tx.wait()
  if (!receipt || receipt.status !== 1) {
    throw new Error('Transaction failed on blockchain')
  }

  return tx.hash
}

// Get live BNB price in USD
export const getBNBPrice = async () => {
  try {
    const res = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BNBUSDT')
    const data = await res.json()
    return parseFloat(data.price)
  } catch {
    return 600
  }
}

// USDT BEP-20 Contract Address on BSC
const USDT_CONTRACT_ADDRESS = '0x55d398326f99059fF775485246999027B3197955'

// USDT Contract ABI (minimal - for approve and transfer)
const USDT_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)'
]

// Get USDT balance — uses public BSC RPC as fallback so it works on mobile wallets
export const getUSDTBalance = async (address) => {
  try {
    // First try via wallet provider
    const walletProvider = appKit.getWalletProvider()
    let provider
    if (walletProvider) {
      provider = new BrowserProvider(walletProvider)
    } else {
      // Fallback: use public BSC RPC directly (works on mobile/WalletConnect)
      const { JsonRpcProvider } = await import('ethers')
      provider = new JsonRpcProvider('https://bsc-dataseed1.binance.org/')
    }
    const { Contract } = await import('ethers')
    const usdtContract = new Contract(USDT_CONTRACT_ADDRESS, USDT_ABI, provider)
    const balance = await usdtContract.balanceOf(address)
    const decimals = await usdtContract.decimals()
    return parseFloat(balance) / Math.pow(10, Number(decimals))
  } catch (error) {
    console.error('Error getting USDT balance:', error)
    return 0
  }
}

// Send USDT to receiver — returns tx hash after on-chain confirmation
export const sendUSDT = async (toAddress, usdtAmount) => {
  const provider = getProvider()
  const signer = await provider.getSigner()

  // Ensure on BSC
  const network = await provider.getNetwork()
  if (Number(network.chainId) !== 56) {
    await appKit.switchNetwork(bscMainnet)
    await new Promise((r) => setTimeout(r, 1000))
  }

  const { Contract, parseUnits } = await import('ethers')
  const usdtContract = new Contract(USDT_CONTRACT_ADDRESS, USDT_ABI, signer)
  
  // Get decimals
  const decimals = await usdtContract.decimals()
  
  // Convert amount to proper units
  const amount = parseUnits(usdtAmount.toString(), decimals)
  
  // Send USDT
  const tx = await usdtContract.transfer(toAddress, amount)
  
  // Wait for blockchain confirmation
  const receipt = await tx.wait()
  if (!receipt || receipt.status !== 1) {
    throw new Error('Transaction failed on blockchain')
  }

  return tx.hash
}

import { useState, useEffect } from 'react'
import { useWeb3 } from '../contexts/Web3Context'
import { formatBWD } from '../contracts/ConnectShareMVP'
import { ethers } from 'ethers'

export default function Dashboard() {
  const { account, contract, isConnected } = useWeb3()
  const [userInfo, setUserInfo] = useState(null)
  const [balance, setBalance] = useState('0')
  const [loading, setLoading] = useState(true)

  // Fetch user data from contract
  useEffect(() => {
    const fetchUserData = async () => {
      if (!contract || !account) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)

        // Get user info
        const user = await contract.users(account)
        setUserInfo(user)

        // Get BWD balance
        const userBalance = await contract.balanceOf(account)
        setBalance(ethers.formatEther(userBalance))

      } catch (error) {
        console.error('Error fetching user data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [contract, account])

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <span className="text-6xl mb-4 block">🔗</span>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Connect Your Wallet
        </h2>
        <p className="text-lg text-gray-600">
          Please connect your wallet to access the ConnectShare dashboard.
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading your dashboard...</p>
      </div>
    )
  }

  const isRegistered = userInfo?.isRegistered || false
  const totalBandwidthShared = userInfo?.totalBandwidthShared || 0n
  const totalEarned = userInfo?.totalEarned || 0n

  const stats = [
    {
      title: 'BWD Balance',
      value: `${formatBWD(balance)} BWD`,
      icon: '💰',
      color: 'bg-green-100 text-green-800',
    },
    {
      title: 'Bandwidth Shared',
      value: `${(Number(totalBandwidthShared) / 1024).toFixed(2)} GB`,
      icon: '📡',
      color: 'bg-blue-100 text-blue-800',
    },
    {
      title: 'Total Earnings',
      value: `${formatBWD(ethers.formatEther(totalEarned))} BWD`,
      icon: '💎',
      color: 'bg-purple-100 text-purple-800',
    },
    {
      title: 'Region',
      value: userInfo?.region || 'Not Set',
      icon: '📍',
      color: 'bg-yellow-100 text-yellow-800',
    },
  ]

  if (!isRegistered) {
    return (
      <div className="text-center py-12">
        <div className="mb-6">
          <span className="text-6xl">👤</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Welcome to ConnectShare MVP!
        </h2>
        <p className="text-lg text-gray-600 mb-8">
          You need to register first to start earning BWD tokens by sharing your bandwidth.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-md mx-auto">
          <h3 className="font-semibold text-blue-900 mb-2">Getting Started:</h3>
          <ol className="text-left text-blue-800 space-y-2">
            <li>1. Click "Register" in the sidebar</li>
            <li>2. Enter your Ghana phone number</li>
            <li>3. Select your mobile money provider</li>
            <li>4. Start sharing bandwidth and earning BWD!</li>
          </ol>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's your ConnectShare activity.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${stat.color} mr-4`}>
                <span className="text-2xl">{stat.icon}</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
            <div className="text-center">
              <span className="text-3xl mb-2 block">📡</span>
              <h3 className="font-semibold text-gray-900">Share Bandwidth</h3>
              <p className="text-sm text-gray-600">Submit your bandwidth data and earn BWD tokens</p>
            </div>
          </div>
          <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
            <div className="text-center">
              <span className="text-3xl mb-2 block">📱</span>
              <h3 className="font-semibold text-gray-900">Buy Data</h3>
              <p className="text-sm text-gray-600">Purchase data bundles with your BWD tokens</p>
            </div>
          </div>
          <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
            <div className="text-center">
              <span className="text-3xl mb-2 block">💰</span>
              <h3 className="font-semibold text-gray-900">Withdraw</h3>
              <p className="text-sm text-gray-600">Convert BWD to mobile money</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div className="flex items-center">
              <span className="text-green-500 mr-3">✅</span>
              <div>
                <p className="font-medium text-gray-900">Registration Complete</p>
                <p className="text-sm text-gray-600">Welcome bonus: 10 BWD received</p>
              </div>
            </div>
            <span className="text-sm text-gray-500">Just now</span>
          </div>
        </div>
      </div>
    </div>
  )
}

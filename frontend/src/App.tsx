import { useState } from 'react'
import { Web3Provider, useWeb3 } from './contexts/Web3Context'
import UserRegistration from './components/UserRegistration'
import BandwidthRewards from './components/BandwidthRewards'
import TokenWithdrawal from './components/TokenWithdrawal'
import DataPurchase from './components/DataPurchase'
import AIAgentInterface from './components/AIAgentInterface'
import Dashboard from './components/Dashboard'
import './App.css'

// Connect Button Component
const ConnectButton = () => {
  const { account, isConnecting, error, connectWallet, disconnect, network } = useWeb3()

  if (account) {
    return (
      <div className="flex items-center space-x-4">
        <div className="text-sm">
          <div className="text-gray-600">Connected to {network}</div>
          <div className="font-mono text-xs">
            {account.slice(0, 6)}...{account.slice(-4)}
          </div>
        </div>
        <button
          onClick={disconnect}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          Disconnect
        </button>
      </div>
    )
  }

  return (
    <div className="text-center">
      <button
        onClick={connectWallet}
        disabled={isConnecting}
        className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
      >
        {isConnecting ? 'Connecting...' : 'Connect Wallet'}
      </button>
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}

function AppContent() {
  const { isConnected } = useWeb3()
  const [activeTab, setActiveTab] = useState('dashboard')

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'register', label: 'Register', icon: '👤' },
    { id: 'bandwidth', label: 'Share Bandwidth', icon: '📡' },
    { id: 'purchase', label: 'Buy Data', icon: '📱' },
    { id: 'withdraw', label: 'Withdraw', icon: '💰' },
    { id: 'ai', label: 'AI Assistant', icon: '🤖' },
  ]

  const renderActiveComponent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />
      case 'register':
        return <UserRegistration />
      case 'bandwidth':
        return <BandwidthRewards />
      case 'purchase':
        return <DataPurchase />
      case 'withdraw':
        return <TokenWithdrawal />
      case 'ai':
        return <AIAgentInterface />
      default:
        return <Dashboard />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                ConnectShare MVP
              </h1>
              <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                Ghana
              </span>
            </div>
            <ConnectButton />
          </div>
        </div>
      </header>

      {isConnected ? (
        <div className="flex">
          {/* Sidebar Navigation */}
          <nav className="w-64 bg-white shadow-sm min-h-screen">
            <div className="p-4">
              <ul className="space-y-2">
                {tabs.map((tab) => (
                  <li key={tab.id}>
                    <button
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors ${
                        activeTab === tab.id
                          ? 'bg-blue-100 text-blue-700 border-l-4 border-blue-500'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <span className="mr-3 text-lg">{tab.icon}</span>
                      {tab.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </nav>

          {/* Main Content */}
          <main className="flex-1 p-6">
            {renderActiveComponent()}
          </main>
        </div>
      ) : (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Welcome to ConnectShare MVP
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Share your bandwidth, earn BWD tokens, and purchase data bundles in Ghana
            </p>
            <ConnectButton />
          </div>
        </div>
      )}
    </div>
  )
}

// Main App Component with Web3Provider
function App() {
  return (
    <Web3Provider>
      <AppContent />
    </Web3Provider>
  )
}

export default App

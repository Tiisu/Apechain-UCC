import { useState, useEffect } from 'react'
import { useWeb3 } from '../contexts/Web3Context'
import { initializePerformanceOptimizations } from '../utils/performance'

interface MobileLayoutProps {
  children: React.ReactNode
}

export default function MobileLayout({ children }: MobileLayoutProps) {
  const { isConnected, account, network, error: web3Error } = useWeb3()
  const [isSlowConnection, setIsSlowConnection] = useState(false)
  const [isOffline, setIsOffline] = useState(!navigator.onLine)

  useEffect(() => {
    // Initialize performance optimizations
    const { isSlowConnection: slowConnection } = initializePerformanceOptimizations()
    setIsSlowConnection(slowConnection)

    // Listen for network changes
    const handleNetworkChange = (event: any) => {
      setIsSlowConnection(event.detail.isSlowConnection)
    }

    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    window.addEventListener('networkchange', handleNetworkChange)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('networkchange', handleNetworkChange)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Status Bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="text-lg font-bold text-blue-600">ConnectShare</div>
            {isSlowConnection && (
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                Slow Connection
              </span>
            )}
            {isOffline && (
              <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                Offline
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {isConnected ? (
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs text-gray-600">
                  {account?.slice(0, 6)}...{account?.slice(-4)}
                </span>
                {network && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {network}
                  </span>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-xs text-gray-600">Not Connected</span>
              </div>
            )}
          </div>
        </div>
        
        {web3Error && (
          <div className="mt-2 text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
            {web3Error}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="pb-20">
        {children}
      </div>

      {/* Mobile Bottom Navigation */}
      {isConnected && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
          <div className="grid grid-cols-5 gap-1">
            <MobileNavItem 
              icon="🏠" 
              label="Dashboard" 
              href="#dashboard"
              isActive={window.location.hash === '#dashboard' || window.location.hash === ''}
            />
            <MobileNavItem 
              icon="👤" 
              label="Register" 
              href="#register"
              isActive={window.location.hash === '#register'}
            />
            <MobileNavItem 
              icon="📡" 
              label="Bandwidth" 
              href="#bandwidth"
              isActive={window.location.hash === '#bandwidth'}
            />
            <MobileNavItem 
              icon="🛒" 
              label="Data" 
              href="#data"
              isActive={window.location.hash === '#data'}
            />
            <MobileNavItem 
              icon="💰" 
              label="Withdraw" 
              href="#withdraw"
              isActive={window.location.hash === '#withdraw'}
            />
          </div>
        </div>
      )}

      {/* PWA Install Prompt */}
      <PWAInstallPrompt />
    </div>
  )
}

interface MobileNavItemProps {
  icon: string
  label: string
  href: string
  isActive: boolean
}

function MobileNavItem({ icon, label, href, isActive }: MobileNavItemProps) {
  return (
    <a
      href={href}
      className={`flex flex-col items-center py-2 px-1 text-xs transition-colors ${
        isActive 
          ? 'text-blue-600 bg-blue-50' 
          : 'text-gray-600 hover:text-blue-600'
      }`}
    >
      <span className="text-lg mb-1">{icon}</span>
      <span className="truncate">{label}</span>
    </a>
  )
}

function PWAInstallPrompt() {
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowInstallPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        console.log('PWA installed')
      }
      
      setDeferredPrompt(null)
      setShowInstallPrompt(false)
    }
  }

  if (!showInstallPrompt) return null

  return (
    <div className="fixed bottom-20 left-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Install ConnectShare</h3>
          <p className="text-sm opacity-90">Add to home screen for better experience</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowInstallPrompt(false)}
            className="px-3 py-1 text-sm bg-blue-500 rounded"
          >
            Later
          </button>
          <button
            onClick={handleInstall}
            className="px-3 py-1 text-sm bg-white text-blue-600 rounded font-semibold"
          >
            Install
          </button>
        </div>
      </div>
    </div>
  )
}

// Mobile-specific utility components
export function MobileCard({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 m-4 ${className}`}>
      {children}
    </div>
  )
}

export function MobileButton({ 
  children, 
  onClick, 
  disabled = false, 
  variant = 'primary',
  className = ''
}: {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  variant?: 'primary' | 'secondary' | 'danger'
  className?: string
}) {
  const baseClasses = 'w-full py-3 px-4 rounded-lg font-medium text-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
    danger: 'bg-red-600 text-white hover:bg-red-700'
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
    >
      {children}
    </button>
  )
}

export function MobileInput({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  className = ''
}: {
  label: string
  type?: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  required?: boolean
  className?: string
}) {
  return (
    <div className={`mb-4 ${className}`}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
      />
    </div>
  )
}

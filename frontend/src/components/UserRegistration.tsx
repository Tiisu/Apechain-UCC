import { useState } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { CONNECTSHARE_MVP_ADDRESS, CONNECTSHARE_MVP_ABI } from '../config/wagmi'

export default function UserRegistration() {
  const { address } = useAccount()
  const [phoneNumber, setPhoneNumber] = useState('')
  const [mobileMoneyProvider, setMobileMoneyProvider] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const { writeContract, data: hash, error } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const mobileMoneyProviders = [
    { value: 'MTN', label: 'MTN Mobile Money' },
    { value: 'Vodafone', label: 'Vodafone Cash' },
    { value: 'AirtelTigo', label: 'AirtelTigo Money' },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phoneNumber || !mobileMoneyProvider) return

    setIsLoading(true)
    try {
      writeContract({
        address: CONNECTSHARE_MVP_ADDRESS,
        abi: CONNECTSHARE_MVP_ABI,
        functionName: 'registerUser',
        args: [phoneNumber, mobileMoneyProvider],
      })
    } catch (err) {
      console.error('Registration failed:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '')
    
    // Format as Ghana phone number
    if (digits.length <= 3) return digits
    if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`
    if (digits.length <= 9) return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 10)}`
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value)
    setPhoneNumber(formatted)
  }

  if (isSuccess) {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <span className="text-6xl">🎉</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Registration Successful!
          </h2>
          <p className="text-gray-600 mb-6">
            Welcome to ConnectShare! You've received 10 BWD tokens as a welcome bonus.
          </p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 mb-2">What's Next?</h3>
            <ul className="text-left text-green-800 space-y-1">
              <li>• Start sharing your bandwidth to earn more BWD</li>
              <li>• Purchase data bundles with your tokens</li>
              <li>• Withdraw earnings to your mobile money account</li>
            </ul>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <span className="text-6xl mb-4 block">👤</span>
          <h1 className="text-2xl font-bold text-gray-900">Register for ConnectShare</h1>
          <p className="text-gray-600 mt-2">
            Join the network and start earning BWD tokens by sharing your bandwidth
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
              Ghana Phone Number
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">+233</span>
              </div>
              <input
                type="tel"
                id="phone"
                value={phoneNumber}
                onChange={handlePhoneChange}
                placeholder="24 123 4567"
                className="block w-full pl-12 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
                maxLength={12}
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Enter your phone number without the country code
            </p>
          </div>

          <div>
            <label htmlFor="provider" className="block text-sm font-medium text-gray-700 mb-2">
              Mobile Money Provider
            </label>
            <select
              id="provider"
              value={mobileMoneyProvider}
              onChange={(e) => setMobileMoneyProvider(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select your provider</option>
              {mobileMoneyProviders.map((provider) => (
                <option key={provider.value} value={provider.value}>
                  {provider.label}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Registration Benefits:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Receive 10 BWD welcome bonus</li>
              <li>• Start earning BWD by sharing bandwidth</li>
              <li>• Purchase data bundles at discounted rates</li>
              <li>• Withdraw earnings to your mobile money account</li>
            </ul>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 text-sm">
                Registration failed. Please try again.
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || isConfirming || !phoneNumber || !mobileMoneyProvider}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading || isConfirming ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {isConfirming ? 'Confirming...' : 'Registering...'}
              </div>
            ) : (
              'Register Now'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            By registering, you agree to share bandwidth data and receive BWD tokens as rewards.
          </p>
        </div>
      </div>
    </div>
  )
}

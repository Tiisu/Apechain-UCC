import { useState, useEffect } from 'react'
import { useWeb3 } from '../contexts/Web3Context'
import { GHANA_REGIONS, MOBILE_MONEY_PROVIDERS, validateGhanaPhone, formatPhoneNumber } from '../contracts/ConnectShareMVP'

export default function UserRegistration() {
  const { account, contract, executeTransaction, readContract, isConnected } = useWeb3()
  const [phoneNumber, setPhoneNumber] = useState('')
  const [region, setRegion] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isRegistered, setIsRegistered] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [txHash, setTxHash] = useState('')

  // Check if user is already registered
  useEffect(() => {
    const checkRegistration = async () => {
      if (!contract || !account) return

      try {
        const userInfo = await readContract('users', account)
        setIsRegistered(userInfo.isRegistered)
      } catch (error) {
        console.error('Error checking registration:', error)
      }
    }

    checkRegistration()
  }, [contract, account, readContract])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!phoneNumber || !region) {
      setError('Please fill in all required fields')
      return
    }

    // Validate phone number
    const formattedPhone = formatPhoneNumber(phoneNumber)
    if (!validateGhanaPhone(formattedPhone)) {
      setError('Please enter a valid Ghana phone number')
      return
    }

    setIsLoading(true)
    try {
      console.log('Registering user:', { phone: formattedPhone, region })

      const receipt = await executeTransaction(
        contract.registerUser,
        formattedPhone,
        region
      )

      setTxHash(receipt.hash)
      setSuccess(true)
      setIsRegistered(true)

      console.log('Registration successful:', receipt)
    } catch (err) {
      console.error('Registration failed:', err)
      setError(err.message || 'Registration failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove all non-digits and format
    const digits = e.target.value.replace(/\D/g, '')

    // Format as Ghana phone number (without country code)
    let formatted = digits
    if (digits.length > 2) {
      formatted = `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 9)}`
    }

    setPhoneNumber(formatted.trim())
  }

  // Show success state
  if (success || isRegistered) {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <span className="text-6xl">🎉</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Registration Successful!
          </h2>
          <p className="text-gray-600 mb-4">
            Welcome to ConnectShare! You're now part of Ghana's bandwidth sharing network.
          </p>
          {txHash && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-800">
                Transaction: <span className="font-mono text-xs">{txHash.slice(0, 10)}...{txHash.slice(-8)}</span>
              </p>
            </div>
          )}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 mb-2">What's Next?</h3>
            <ul className="text-left text-green-800 space-y-1">
              <li>• Start sharing your bandwidth to earn BWD tokens</li>
              <li>• Purchase data bundles with your earned tokens</li>
              <li>• Withdraw earnings to your mobile money account</li>
              <li>• Earn bonus rewards based on your region</li>
            </ul>
          </div>
        </div>
      </div>
    )
  }

  // Show wallet connection prompt
  if (!isConnected) {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <span className="text-6xl mb-4 block">🔗</span>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Connect Your Wallet
          </h2>
          <p className="text-gray-600">
            Please connect your wallet to register for ConnectShare.
          </p>
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
            <label htmlFor="region" className="block text-sm font-medium text-gray-700 mb-2">
              Ghana Region
            </label>
            <select
              id="region"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select your region</option>
              {GHANA_REGIONS.map((regionOption) => (
                <option key={regionOption.name} value={regionOption.name}>
                  {regionOption.name} (+{regionOption.bonus}% bonus)
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Higher bonuses for underserved regions
            </p>
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
                {error}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !phoneNumber || !region}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Registering...
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

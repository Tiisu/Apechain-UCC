import { useState, useEffect } from 'react'
import { useWeb3 } from '../contexts/Web3Context'
import { MOBILE_MONEY_PROVIDERS, formatBWD, validateGhanaPhone, formatPhoneNumber } from '../contracts/ConnectShareMVP'
import { ethers } from 'ethers'

export default function TokenWithdrawal() {
  const { account, contract, executeTransaction, readContract, isConnected } = useWeb3()
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [provider, setProvider] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [txHash, setTxHash] = useState('')
  const [userBalance, setUserBalance] = useState('0')
  const [userInfo, setUserInfo] = useState(null)

  // Fetch user data
  useEffect(() => {
    const fetchData = async () => {
      if (!contract || !account) return

      try {
        // Get user balance
        const balance = await readContract('balanceOf', account)
        setUserBalance(ethers.formatEther(balance))

        // Get user info
        const user = await readContract('users', account)
        setUserInfo(user)

        // Pre-fill phone number if user is registered
        if (user.isRegistered && user.phoneNumber) {
          setPhoneNumber(user.phoneNumber)
        }

      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }

    fetchData()
  }, [contract, account, readContract])

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!withdrawAmount || !phoneNumber || !provider) {
      setError('Please fill in all required fields')
      return
    }

    const amount = parseFloat(withdrawAmount)
    const currentBalance = parseFloat(userBalance)

    if (amount <= 0) {
      setError('Withdrawal amount must be greater than 0')
      return
    }

    if (amount > currentBalance) {
      setError('Insufficient BWD balance')
      return
    }

    if (amount > 1000) {
      setError('Daily withdrawal limit is 1,000 BWD')
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
      console.log('Requesting withdrawal:', { amount, provider, phone: formattedPhone })

      const amountWei = ethers.parseEther(withdrawAmount)

      const receipt = await executeTransaction(
        contract.requestWithdrawal,
        amountWei,
        provider,
        formattedPhone
      )

      setTxHash(receipt.hash)
      setSuccess(true)

      // Update balance
      const newBalance = await readContract('balanceOf', account)
      setUserBalance(ethers.formatEther(newBalance))

      console.log('Withdrawal request successful:', receipt)
    } catch (err) {
      console.error('Withdrawal failed:', err)
      setError(err.message || 'Withdrawal request failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const calculateMobileMoneyAmount = (bwdAmount: number) => {
    // Conversion rate: 1 BWD = 0.5 GHS (example rate)
    return (bwdAmount * 0.5).toFixed(2)
  }

  const setMaxAmount = () => {
    const maxWithdrawal = Math.min(parseFloat(userBalance), 1000) // Daily limit
    setWithdrawAmount(maxWithdrawal.toString())
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
            Please connect your wallet to withdraw BWD tokens.
          </p>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <span className="text-6xl">✅</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Withdrawal Request Submitted!
          </h2>
          <p className="text-gray-600 mb-4">
            Your withdrawal request has been submitted successfully. The mobile money transfer will be processed within 24 hours.
          </p>
          {txHash && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-800">
                Transaction: <span className="font-mono text-xs">{txHash.slice(0, 10)}...{txHash.slice(-8)}</span>
              </p>
            </div>
          )}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-green-900 mb-2">Transfer Details:</h3>
            <div className="text-left text-green-800 space-y-1">
              <p>Amount: {withdrawAmount} BWD → GHS {calculateMobileMoneyAmount(parseFloat(withdrawAmount))}</p>
              <p>To: {phoneNumber} ({provider})</p>
              <p>Processing time: Up to 24 hours</p>
            </div>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-gray-700">
              Remaining Balance: <span className="font-semibold">{formatBWD(userBalance)} BWD</span>
            </p>
          </div>
          <button
            onClick={() => {
              setSuccess(false)
              setWithdrawAmount('')
              setPhoneNumber('')
              setProvider('')
              setError('')
            }}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Make Another Withdrawal
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <span className="text-6xl mb-4 block">💰</span>
          <h1 className="text-2xl font-bold text-gray-900">Withdraw BWD Tokens</h1>
          <p className="text-gray-600 mt-2">
            Convert your BWD tokens to Ghana Cedis via mobile money
          </p>
        </div>

        {/* Balance and Account Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Available Balance</h3>
            <p className="text-2xl font-bold text-blue-900">{formatBWD(userBalance)} BWD</p>
            <p className="text-sm text-blue-700">≈ GHS {calculateMobileMoneyAmount(parseFloat(userBalance))}</p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 mb-2">Withdrawal Status</h3>
            <p className="font-medium text-green-900">
              {userInfo?.isRegistered ? 'Ready to withdraw' : 'Registration required'}
            </p>
            <p className="text-sm text-green-700">Daily limit: 1,000 BWD</p>
          </div>
        </div>

        <form onSubmit={handleWithdraw} className="space-y-6">
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
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="50 123 4567"
                  className="block w-full pl-12 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                  maxLength={12}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Enter your mobile money phone number
              </p>
            </div>

            <div>
              <label htmlFor="provider" className="block text-sm font-medium text-gray-700 mb-2">
                Mobile Money Provider
              </label>
              <select
                id="provider"
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select your provider</option>
                {MOBILE_MONEY_PROVIDERS.map((providerOption) => (
                  <option key={providerOption.id} value={providerOption.name}>
                    {providerOption.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                Withdrawal Amount (BWD)
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="amount"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="Enter amount to withdraw"
                  min="1"
                  max={Math.min(parseFloat(userBalance), 1000)}
                  step="0.01"
                  className="block w-full px-3 py-2 pr-20 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <button
                  type="button"
                  onClick={setMaxAmount}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm text-blue-600 hover:text-blue-800"
                >
                  MAX
                </button>
              </div>
              {withdrawAmount && (
                <p className="mt-1 text-sm text-green-600">
                  You will receive: GHS {calculateMobileMoneyAmount(parseFloat(withdrawAmount))}
                </p>
              )}
            </div>

            {/* Conversion Rate Info */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Conversion Details:</h3>
              <div className="text-sm text-gray-700 space-y-1">
                <p>Exchange Rate: 1 BWD = 0.5 GHS</p>
                <p>Processing Fee: Free</p>
                <p>Processing Time: Up to 24 hours</p>
                <p>Minimum Withdrawal: 1 BWD</p>
              </div>
            </div>

            {/* Withdrawal Limits */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Withdrawal Limits:</h3>
              <div className="text-sm text-blue-800 space-y-1">
                <p>Daily Limit: 1,000 BWD</p>
                <p>Monthly Limit: 10,000 BWD</p>
                <p>Available Today: 1,000 BWD</p>
              </div>
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
              disabled={isLoading || !withdrawAmount || !phoneNumber || !provider || parseFloat(withdrawAmount) > parseFloat(userBalance)}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </div>
              ) : (
                'Request Withdrawal'
              )}
            </button>
          </form>

        {/* How it works */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">How Withdrawal Works:</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <span className="text-3xl mb-2 block">📝</span>
              <h4 className="font-medium text-gray-900">1. Request</h4>
              <p className="text-sm text-gray-600">Submit withdrawal amount</p>
            </div>
            <div className="text-center">
              <span className="text-3xl mb-2 block">⚡</span>
              <h4 className="font-medium text-gray-900">2. Process</h4>
              <p className="text-sm text-gray-600">Conversion to Ghana Cedis</p>
            </div>
            <div className="text-center">
              <span className="text-3xl mb-2 block">📱</span>
              <h4 className="font-medium text-gray-900">3. Receive</h4>
              <p className="text-sm text-gray-600">Money sent to your mobile wallet</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

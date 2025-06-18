import { useState } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi'
import { CONNECTSHARE_MVP_ADDRESS, CONNECTSHARE_MVP_ABI } from '../config/wagmi'
import { formatEther, parseEther } from 'viem'

export default function TokenWithdrawal() {
  const { address } = useAccount()
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const { writeContract, data: hash, error } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  // Read user's BWD balance
  const { data: balance } = useReadContract({
    address: CONNECTSHARE_MVP_ADDRESS,
    abi: CONNECTSHARE_MVP_ABI,
    functionName: 'balanceOf',
    args: [address!],
    query: {
      enabled: !!address,
    },
  })

  // Read user info to get mobile money provider
  const { data: userInfo } = useReadContract({
    address: CONNECTSHARE_MVP_ADDRESS,
    abi: CONNECTSHARE_MVP_ABI,
    functionName: 'getUserInfo',
    args: [address!],
    query: {
      enabled: !!address,
    },
  })

  const userBalance = balance ? parseFloat(formatEther(balance)) : 0
  const phoneNumber = userInfo?.[1] // phoneNumber field
  const mobileMoneyProvider = userInfo?.[5] // mobileMoneyProvider field

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!withdrawAmount) return

    setIsLoading(true)
    try {
      const amountWei = parseEther(withdrawAmount)
      
      writeContract({
        address: CONNECTSHARE_MVP_ADDRESS,
        abi: CONNECTSHARE_MVP_ABI,
        functionName: 'requestWithdrawal',
        args: [amountWei],
      })
    } catch (err) {
      console.error('Withdrawal failed:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const calculateMobileMoneyAmount = (bwdAmount: number) => {
    // Conversion rate: 1 BWD = 0.5 GHS (example rate)
    return (bwdAmount * 0.5).toFixed(2)
  }

  const setMaxAmount = () => {
    setWithdrawAmount(userBalance.toString())
  }

  if (isSuccess) {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <span className="text-6xl">✅</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Withdrawal Request Submitted!
          </h2>
          <p className="text-gray-600 mb-6">
            Your withdrawal request has been submitted successfully. The mobile money transfer will be processed within 24 hours.
          </p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 mb-2">Transfer Details:</h3>
            <div className="text-left text-green-800 space-y-1">
              <p>Amount: {withdrawAmount} BWD → GHS {calculateMobileMoneyAmount(parseFloat(withdrawAmount))}</p>
              <p>To: {phoneNumber} ({mobileMoneyProvider})</p>
              <p>Processing time: Up to 24 hours</p>
            </div>
          </div>
          <button
            onClick={() => window.location.reload()}
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
            <p className="text-2xl font-bold text-blue-900">{userBalance.toFixed(2)} BWD</p>
            <p className="text-sm text-blue-700">≈ GHS {calculateMobileMoneyAmount(userBalance)}</p>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 mb-2">Mobile Money Account</h3>
            <p className="font-medium text-green-900">{phoneNumber || 'Not set'}</p>
            <p className="text-sm text-green-700">{mobileMoneyProvider || 'No provider'}</p>
          </div>
        </div>

        {!phoneNumber || !mobileMoneyProvider ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <span className="text-4xl mb-4 block">⚠️</span>
            <h3 className="text-lg font-semibold text-yellow-900 mb-2">
              Mobile Money Account Required
            </h3>
            <p className="text-yellow-800 mb-4">
              You need to register with your mobile money details before you can withdraw tokens.
            </p>
            <button className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700">
              Go to Registration
            </button>
          </div>
        ) : (
          <form onSubmit={handleWithdraw} className="space-y-6">
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
                  max={userBalance}
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
                  Withdrawal failed. Please check your balance and try again.
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || isConfirming || !withdrawAmount || parseFloat(withdrawAmount) > userBalance}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading || isConfirming ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {isConfirming ? 'Confirming...' : 'Processing...'}
                </div>
              ) : (
                'Request Withdrawal'
              )}
            </button>
          </form>
        )}

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

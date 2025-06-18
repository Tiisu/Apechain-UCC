import { useState } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { CONNECTSHARE_MVP_ADDRESS, CONNECTSHARE_MVP_ABI } from '../config/wagmi'

export default function BandwidthRewards() {
  const { address } = useAccount()
  const [bandwidthAmount, setBandwidthAmount] = useState('')
  const [location, setLocation] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const { writeContract, data: hash, error } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const ghanaRegions = [
    'Greater Accra', 'Ashanti', 'Western', 'Central', 'Eastern',
    'Northern', 'Upper East', 'Upper West', 'Volta', 'Brong-Ahafo',
    'Western North', 'Ahafo', 'Bono East', 'Oti', 'North East', 'Savannah'
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!bandwidthAmount || !location) return

    setIsLoading(true)
    try {
      // Convert MB to the format expected by the contract
      const amountMB = parseInt(bandwidthAmount)
      
      writeContract({
        address: CONNECTSHARE_MVP_ADDRESS,
        abi: CONNECTSHARE_MVP_ABI,
        functionName: 'submitBandwidth',
        args: [BigInt(amountMB), location],
      })
    } catch (err) {
      console.error('Bandwidth submission failed:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const calculateReward = (mb: number) => {
    // Simple reward calculation: 1 BWD per 100 MB
    return (mb / 100).toFixed(2)
  }

  if (isSuccess) {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <span className="text-6xl">🎉</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Bandwidth Submitted Successfully!
          </h2>
          <p className="text-gray-600 mb-6">
            Your bandwidth data has been recorded and BWD tokens have been credited to your account.
          </p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 mb-2">Reward Details:</h3>
            <p className="text-green-800">
              {bandwidthAmount} MB shared = ~{calculateReward(parseInt(bandwidthAmount || '0'))} BWD earned
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Submit More Bandwidth
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <span className="text-6xl mb-4 block">📡</span>
          <h1 className="text-2xl font-bold text-gray-900">Share Your Bandwidth</h1>
          <p className="text-gray-600 mt-2">
            Submit your bandwidth usage data and earn BWD tokens as rewards
          </p>
        </div>

        {/* Reward Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-blue-900 mb-4">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <span className="text-3xl mb-2 block">📊</span>
              <h3 className="font-medium text-blue-900">1. Submit Data</h3>
              <p className="text-sm text-blue-700">Enter your bandwidth usage</p>
            </div>
            <div className="text-center">
              <span className="text-3xl mb-2 block">⚡</span>
              <h3 className="font-medium text-blue-900">2. Get Verified</h3>
              <p className="text-sm text-blue-700">Data is validated on-chain</p>
            </div>
            <div className="text-center">
              <span className="text-3xl mb-2 block">💰</span>
              <h3 className="font-medium text-blue-900">3. Earn BWD</h3>
              <p className="text-sm text-blue-700">Receive tokens instantly</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="bandwidth" className="block text-sm font-medium text-gray-700 mb-2">
              Bandwidth Amount (MB)
            </label>
            <div className="relative">
              <input
                type="number"
                id="bandwidth"
                value={bandwidthAmount}
                onChange={(e) => setBandwidthAmount(e.target.value)}
                placeholder="Enter amount in MB"
                min="1"
                max="10000"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">MB</span>
              </div>
            </div>
            {bandwidthAmount && (
              <p className="mt-1 text-sm text-green-600">
                Estimated reward: ~{calculateReward(parseInt(bandwidthAmount))} BWD
              </p>
            )}
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
              Location (Ghana Region)
            </label>
            <select
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select your region</option>
              {ghanaRegions.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
          </div>

          {/* Bandwidth Guidelines */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-900 mb-2">Bandwidth Guidelines:</h3>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• Minimum: 100 MB per submission</li>
              <li>• Maximum: 10,000 MB per submission</li>
              <li>• Reward rate: 1 BWD per 100 MB shared</li>
              <li>• Higher rewards for consistent sharing</li>
            </ul>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 text-sm">
                Submission failed. Please check your input and try again.
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || isConfirming || !bandwidthAmount || !location}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading || isConfirming ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {isConfirming ? 'Confirming...' : 'Submitting...'}
              </div>
            ) : (
              'Submit Bandwidth Data'
            )}
          </button>
        </form>

        {/* Recent Submissions */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Submissions</h3>
          <div className="text-center text-gray-500">
            <span className="text-4xl mb-2 block">📊</span>
            <p>Your bandwidth submissions will appear here</p>
          </div>
        </div>
      </div>
    </div>
  )
}

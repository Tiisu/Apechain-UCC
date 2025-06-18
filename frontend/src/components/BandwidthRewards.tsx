import { useState, useEffect } from 'react'
import { useWeb3 } from '../contexts/Web3Context'
import { GHANA_REGIONS } from '../contracts/ConnectShareMVP'
import { ethers } from 'ethers'

export default function BandwidthRewards() {
  const { account, contract, executeTransaction, readContract, isConnected } = useWeb3()
  const [bandwidthAmount, setBandwidthAmount] = useState('')
  const [region, setRegion] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [txHash, setTxHash] = useState('')
  const [userBalance, setUserBalance] = useState('0')
  const [regionBonus, setRegionBonus] = useState(0)

  // Fetch user balance and region bonus
  useEffect(() => {
    const fetchData = async () => {
      if (!contract || !account) return

      try {
        const balance = await readContract('balanceOf', account)
        setUserBalance(ethers.formatEther(balance))

        if (region) {
          const bonus = await readContract('regionBonuses', region)
          setRegionBonus(Number(bonus))
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }

    fetchData()
  }, [contract, account, region, readContract])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!bandwidthAmount || !region) {
      setError('Please fill in all required fields')
      return
    }

    const amountMB = parseInt(bandwidthAmount)
    if (amountMB < 100 || amountMB > 10000) {
      setError('Bandwidth amount must be between 100 MB and 10,000 MB')
      return
    }

    setIsLoading(true)
    try {
      console.log('Submitting bandwidth:', { amount: amountMB, region })

      const receipt = await executeTransaction(
        contract.submitBandwidth,
        amountMB,
        region
      )

      setTxHash(receipt.hash)
      setSuccess(true)

      // Update balance
      const newBalance = await readContract('balanceOf', account)
      setUserBalance(ethers.formatEther(newBalance))

      console.log('Bandwidth submission successful:', receipt)
    } catch (err) {
      console.error('Bandwidth submission failed:', err)
      setError(err.message || 'Submission failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const calculateReward = (mb: number) => {
    // Base reward: 1 BWD per 100 MB
    const baseReward = mb / 100
    // Apply region bonus
    const bonusMultiplier = 1 + (regionBonus / 100)
    return (baseReward * bonusMultiplier).toFixed(2)
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
            Please connect your wallet to submit bandwidth data.
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
            <span className="text-6xl">🎉</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Bandwidth Submitted Successfully!
          </h2>
          <p className="text-gray-600 mb-4">
            Your bandwidth data has been recorded and BWD tokens have been credited to your account.
          </p>
          {txHash && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-800">
                Transaction: <span className="font-mono text-xs">{txHash.slice(0, 10)}...{txHash.slice(-8)}</span>
              </p>
            </div>
          )}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-green-900 mb-2">Reward Details:</h3>
            <p className="text-green-800">
              {bandwidthAmount} MB shared = ~{calculateReward(parseInt(bandwidthAmount || '0'))} BWD earned
            </p>
            {regionBonus > 0 && (
              <p className="text-green-700 text-sm">
                Including {regionBonus}% regional bonus for {region}
              </p>
            )}
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-gray-700">
              Current Balance: <span className="font-semibold">{parseFloat(userBalance).toFixed(2)} BWD</span>
            </p>
          </div>
          <button
            onClick={() => {
              setSuccess(false)
              setBandwidthAmount('')
              setRegion('')
              setError('')
            }}
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
            {regionBonus > 0 && (
              <p className="text-xs text-green-600 mt-1">
                {regionBonus}% bonus will be applied to your rewards
              </p>
            )}
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
                {error}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !bandwidthAmount || !region}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Submitting...
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

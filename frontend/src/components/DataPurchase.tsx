import { useState, useEffect } from 'react'
import { useWeb3 } from '../contexts/Web3Context'
import { formatBWD, validateGhanaPhone, formatPhoneNumber } from '../contracts/ConnectShareMVP'
import { ethers } from 'ethers'

export default function DataPurchase() {
  const { account, contract, executeTransaction, readContract, isConnected } = useWeb3()
  const [selectedBundle, setSelectedBundle] = useState<number | null>(null)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [txHash, setTxHash] = useState('')
  const [dataBundles, setDataBundles] = useState<any[]>([])
  const [userBalance, setUserBalance] = useState('0')
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)

  // Fetch data bundles and user balance
  useEffect(() => {
    const fetchData = async () => {
      if (!contract || !account) return

      try {
        // Get data bundles
        const bundles = await readContract('getDataBundles')
        setDataBundles(bundles)

        // Get user balance
        const balance = await readContract('balanceOf', account)
        setUserBalance(ethers.formatEther(balance))

      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }

    fetchData()
  }, [contract, account, readContract])

  const handlePurchase = async (bundleId: number) => {
    setError('')

    if (!phoneNumber) {
      setError('Please enter your phone number')
      return
    }

    // Validate phone number
    const formattedPhone = formatPhoneNumber(phoneNumber)
    if (!validateGhanaPhone(formattedPhone)) {
      setError('Please enter a valid Ghana phone number')
      return
    }

    // Check if user has sufficient balance
    const bundle = dataBundles[bundleId]
    const bundlePrice = parseFloat(ethers.formatEther(bundle.priceInBWD))
    const currentBalance = parseFloat(userBalance)

    if (currentBalance < bundlePrice) {
      setError('Insufficient BWD balance for this purchase')
      return
    }

    setIsLoading(true)
    try {
      console.log('Purchasing data bundle:', { bundleId, phone: formattedPhone })

      // First approve the spending
      const approveTx = await executeTransaction(
        contract.approve,
        await contract.getAddress(),
        bundle.priceInBWD
      )
      console.log('Approval successful:', approveTx.hash)

      // Then purchase the bundle
      const purchaseTx = await executeTransaction(
        contract.purchaseDataBundle,
        bundleId,
        formattedPhone
      )

      setTxHash(purchaseTx.hash)
      setSuccess(true)
      setShowPurchaseModal(false)

      // Update balance
      const newBalance = await readContract('balanceOf', account)
      setUserBalance(ethers.formatEther(newBalance))

      console.log('Purchase successful:', purchaseTx)
    } catch (err) {
      console.error('Purchase failed:', err)
      setError(err.message || 'Purchase failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const formatDataSize = (mb: number) => {
    if (mb >= 1024) {
      return `${(mb / 1024).toFixed(1)} GB`
    }
    return `${mb} MB`
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
            Please connect your wallet to purchase data bundles.
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
            Purchase Successful!
          </h2>
          <p className="text-gray-600 mb-4">
            Your data bundle has been purchased successfully. You should receive the data credit shortly.
          </p>
          {txHash && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-800">
                Transaction: <span className="font-mono text-xs">{txHash.slice(0, 10)}...{txHash.slice(-8)}</span>
              </p>
            </div>
          )}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-green-900 mb-2">What's Next?</h3>
            <p className="text-green-800">
              Check your mobile phone for the data credit confirmation from your network provider.
            </p>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-gray-700">
              Current Balance: <span className="font-semibold">{formatBWD(userBalance)} BWD</span>
            </p>
          </div>
          <button
            onClick={() => {
              setSuccess(false)
              setPhoneNumber('')
              setSelectedBundle(null)
              setError('')
            }}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Purchase More Data
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <span className="text-6xl mb-4 block">📱</span>
          <h1 className="text-2xl font-bold text-gray-900">Purchase Data Bundles</h1>
          <p className="text-gray-600 mt-2">
            Use your BWD tokens to purchase data bundles for your mobile phone
          </p>
        </div>

        {/* Balance Display */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-blue-900">Your BWD Balance</h3>
              <p className="text-blue-700">Available for data purchases</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-blue-900">{formatBWD(userBalance)} BWD</p>
            </div>
          </div>
        </div>

        {/* Data Bundles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {dataBundles && dataBundles.length > 0 ? (
            dataBundles.map((bundle: any, index: number) => {
              const bundlePrice = parseFloat(ethers.formatEther(bundle.priceInBWD))
              const canAfford = parseFloat(userBalance) >= bundlePrice
              
              return (
                <div
                  key={index}
                  className={`border rounded-lg p-6 transition-all ${
                    canAfford
                      ? 'border-gray-200 hover:border-blue-300 hover:shadow-md cursor-pointer'
                      : 'border-gray-100 bg-gray-50 opacity-60'
                  }`}
                  onClick={() => canAfford && setSelectedBundle(index)}
                >
                  <div className="text-center">
                    <div className="mb-4">
                      <span className="text-4xl">📦</span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      {bundle.name}
                    </h3>
                    <div className="mb-4">
                      <p className="text-3xl font-bold text-blue-600">
                        {formatDataSize(Number(bundle.dataMB))}
                      </p>
                      <p className="text-sm text-gray-600">{bundle.provider}</p>
                    </div>
                    <div className="mb-4">
                      <p className="text-xl font-semibold text-gray-900">
                        {formatBWD(bundlePrice.toString())} BWD
                      </p>
                    </div>

                    {canAfford ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedBundle(index)
                          setShowPurchaseModal(true)
                        }}
                        disabled={isLoading}
                        className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      >
                        Purchase
                      </button>
                    ) : (
                      <button
                        disabled
                        className="w-full py-2 px-4 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed"
                      >
                        Insufficient BWD
                      </button>
                    )}
                  </div>
                </div>
              )
            })
          ) : (
            // Default bundles if none are loaded from contract
            [
              { id: 1, name: 'Basic', dataMB: 500, price: 5, provider: 'MTN' },
              { id: 2, name: 'Standard', dataMB: 1024, price: 9, provider: 'MTN' },
              { id: 3, name: 'Premium', dataMB: 2048, price: 17, provider: 'MTN' },
              { id: 4, name: 'Basic', dataMB: 500, price: 5, provider: 'Vodafone' },
              { id: 5, name: 'Standard', dataMB: 1024, price: 9, provider: 'Vodafone' },
              { id: 6, name: 'Premium', dataMB: 2048, price: 17, provider: 'AirtelTigo' },
            ].map((bundle) => {
              const canAfford = userBalance >= bundle.price
              
              return (
                <div
                  key={bundle.id}
                  className={`border rounded-lg p-6 transition-all ${
                    canAfford
                      ? 'border-gray-200 hover:border-blue-300 hover:shadow-md cursor-pointer'
                      : 'border-gray-100 bg-gray-50 opacity-60'
                  }`}
                >
                  <div className="text-center">
                    <div className="mb-4">
                      <span className="text-4xl">📦</span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      {bundle.name}
                    </h3>
                    <div className="mb-4">
                      <p className="text-3xl font-bold text-blue-600">
                        {formatDataSize(bundle.dataMB)}
                      </p>
                      <p className="text-sm text-gray-600">{bundle.provider}</p>
                    </div>
                    <div className="mb-4">
                      <p className="text-xl font-semibold text-gray-900">
                        {bundle.price} BWD
                      </p>
                    </div>
                    
                    {canAfford ? (
                      <button
                        onClick={() => handlePurchase(bundle.id)}
                        disabled={isLoading || isConfirming}
                        className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      >
                        Purchase
                      </button>
                    ) : (
                      <button
                        disabled
                        className="w-full py-2 px-4 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed"
                      >
                        Insufficient BWD
                      </button>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800 text-sm">
              Purchase failed. Please ensure you have sufficient BWD balance and try again.
            </p>
          </div>
        )}

        {/* How it works */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-4">How Data Purchase Works:</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <span className="text-3xl mb-2 block">🛒</span>
              <h4 className="font-medium text-gray-900">1. Select Bundle</h4>
              <p className="text-sm text-gray-600">Choose your preferred data package</p>
            </div>
            <div className="text-center">
              <span className="text-3xl mb-2 block">💳</span>
              <h4 className="font-medium text-gray-900">2. Pay with BWD</h4>
              <p className="text-sm text-gray-600">Use your earned BWD tokens</p>
            </div>
            <div className="text-center">
              <span className="text-3xl mb-2 block">📱</span>
              <h4 className="font-medium text-gray-900">3. Receive Data</h4>
              <p className="text-sm text-gray-600">Data credited to your phone</p>
            </div>
          </div>
        </div>
      </div>

      {/* Purchase Modal */}
      {showPurchaseModal && selectedBundle !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Confirm Purchase
            </h3>

            {dataBundles[selectedBundle] && (
              <div className="mb-4">
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold">{dataBundles[selectedBundle].name}</h4>
                  <p className="text-gray-600">{dataBundles[selectedBundle].provider}</p>
                  <p className="text-blue-600 font-bold">
                    {formatDataSize(Number(dataBundles[selectedBundle].dataMB))} - {formatBWD(ethers.formatEther(dataBundles[selectedBundle].priceInBWD))} BWD
                  </p>
                </div>

                <div className="mb-4">
                  <label htmlFor="purchasePhone" className="block text-sm font-medium text-gray-700 mb-2">
                    Ghana Phone Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">+233</span>
                    </div>
                    <input
                      type="tel"
                      id="purchasePhone"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="50 123 4567"
                      className="block w-full pl-12 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                      maxLength={12}
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Enter your phone number to receive the data bundle
                  </p>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowPurchaseModal(false)
                  setSelectedBundle(null)
                  setPhoneNumber('')
                  setError('')
                }}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={() => handlePurchase(selectedBundle)}
                disabled={isLoading || !phoneNumber}
                className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Purchasing...
                  </div>
                ) : (
                  'Confirm Purchase'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

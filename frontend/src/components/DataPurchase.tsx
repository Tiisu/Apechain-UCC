import { useState } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi'
import { CONNECTSHARE_MVP_ADDRESS, CONNECTSHARE_MVP_ABI } from '../config/wagmi'
import { formatEther } from 'viem'

export default function DataPurchase() {
  const { address } = useAccount()
  const [selectedBundle, setSelectedBundle] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const { writeContract, data: hash, error } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  // Read available data bundles
  const { data: dataBundles } = useReadContract({
    address: CONNECTSHARE_MVP_ADDRESS,
    abi: CONNECTSHARE_MVP_ABI,
    functionName: 'getDataBundles',
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

  const handlePurchase = async (bundleId: number) => {
    setIsLoading(true)
    try {
      writeContract({
        address: CONNECTSHARE_MVP_ADDRESS,
        abi: CONNECTSHARE_MVP_ABI,
        functionName: 'purchaseDataBundle',
        args: [BigInt(bundleId)],
      })
    } catch (err) {
      console.error('Purchase failed:', err)
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

  const userBalance = balance ? parseFloat(formatEther(balance)) : 0

  if (isSuccess) {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <span className="text-6xl">🎉</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Purchase Successful!
          </h2>
          <p className="text-gray-600 mb-6">
            Your data bundle has been purchased successfully. You should receive the data credit shortly.
          </p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 mb-2">What's Next?</h3>
            <p className="text-green-800">
              Check your mobile phone for the data credit confirmation from your network provider.
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
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
              <p className="text-2xl font-bold text-blue-900">{userBalance.toFixed(2)} BWD</p>
            </div>
          </div>
        </div>

        {/* Data Bundles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {dataBundles && dataBundles.length > 0 ? (
            dataBundles.map((bundle: any, index: number) => {
              const bundlePrice = parseFloat(formatEther(bundle.priceInBWD))
              const canAfford = userBalance >= bundlePrice
              
              return (
                <div
                  key={index}
                  className={`border rounded-lg p-6 transition-all ${
                    canAfford
                      ? 'border-gray-200 hover:border-blue-300 hover:shadow-md cursor-pointer'
                      : 'border-gray-100 bg-gray-50 opacity-60'
                  }`}
                  onClick={() => canAfford && setSelectedBundle(Number(bundle.id))}
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
                        {bundlePrice.toFixed(2)} BWD
                      </p>
                    </div>
                    
                    {canAfford ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handlePurchase(Number(bundle.id))
                        }}
                        disabled={isLoading || isConfirming}
                        className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      >
                        {isLoading || isConfirming ? (
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            {isConfirming ? 'Confirming...' : 'Purchasing...'}
                          </div>
                        ) : (
                          'Purchase'
                        )}
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
    </div>
  )
}

import { useState, useEffect } from 'react'
import { healthService } from '../services'

const BackendStatus = () => {
  const [status, setStatus] = useState({
    isConnected: false,
    isLoading: true,
  })

  useEffect(() => {
    checkBackendHealth()
  }, [])

  const checkBackendHealth = async () => {
    setStatus((prev) => ({ ...prev, isLoading: true }))

    const result = await healthService.checkHealth()
    
    setStatus({
      isConnected: result.success,
      isLoading: false,
    })
  }

  return (
    <div className="inline-flex items-center space-x-2 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200">
      <span className="text-sm font-medium text-gray-700">Backend Status:</span>
      
      {status.isLoading ? (
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-600">Checking...</span>
        </div>
      ) : status.isConnected ? (
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm font-semibold text-green-600">🟢 Connected</span>
        </div>
      ) : (
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
          <span className="text-sm font-semibold text-red-600">🔴 Offline</span>
        </div>
      )}

      <button
        onClick={checkBackendHealth}
        disabled={status.isLoading}
        className="ml-2 text-blue-600 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        title="Refresh status"
      >
        <svg
          className={`w-4 h-4 ${status.isLoading ? 'animate-spin' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
      </button>
    </div>
  )
}

export default BackendStatus
export { BackendStatus }

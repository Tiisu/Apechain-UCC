import { useState } from 'react'

interface Message {
  id: number
  text: string
  isUser: boolean
  timestamp: Date
}

export default function AIAgentInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hello! I'm your ConnectShare AI assistant. I can help you with bandwidth sharing, data purchases, withdrawals, and answer questions about the platform. How can I assist you today?",
      isUser: false,
      timestamp: new Date(),
    },
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)

  const predefinedResponses: { [key: string]: string } = {
    'bandwidth': "To share bandwidth: Go to 'Share Bandwidth' → Enter your data usage in MB → Select your Ghana region → Submit. You'll earn approximately 1 BWD per 100 MB shared!",
    'data': "To purchase data: Go to 'Buy Data' → Choose a bundle that fits your needs → Pay with BWD tokens → Data will be credited to your phone within minutes.",
    'withdraw': "To withdraw BWD: Go to 'Withdraw' → Enter amount → Confirm mobile money details → Submit request. Processing takes up to 24 hours. Rate: 1 BWD = 0.5 GHS",
    'register': "To register: Go to 'Register' → Enter your Ghana phone number → Select mobile money provider (MTN, Vodafone, or AirtelTigo) → Submit. You'll get 10 BWD welcome bonus!",
    'balance': "Check your BWD balance on the Dashboard. You earn BWD by sharing bandwidth and can spend it on data bundles or withdraw to mobile money.",
    'help': "I can help with: Registration, Bandwidth sharing, Data purchases, Token withdrawals, Account balance, Platform features. Just ask me anything!",
    'ghana': "ConnectShare is specifically designed for Ghana! We support MTN, Vodafone, and AirtelTigo mobile money for withdrawals and data purchases.",
  }

  const getAIResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase()
    
    for (const [keyword, response] of Object.entries(predefinedResponses)) {
      if (message.includes(keyword)) {
        return response
      }
    }

    // Default responses for common questions
    if (message.includes('how') || message.includes('what')) {
      return "I can help you with bandwidth sharing, data purchases, withdrawals, and registration. What specific topic would you like to know about?"
    }
    
    if (message.includes('earn') || message.includes('money')) {
      return "You earn BWD tokens by sharing your bandwidth data. The more you share, the more you earn! 1 BWD = 0.5 GHS when withdrawing to mobile money."
    }

    if (message.includes('problem') || message.includes('error') || message.includes('issue')) {
      return "If you're experiencing issues: 1) Check your wallet connection, 2) Ensure you have enough BWD balance, 3) Verify your registration details. Need more help? Contact support."
    }

    return "I understand you're asking about ConnectShare. Could you be more specific? I can help with registration, bandwidth sharing, data purchases, or withdrawals."
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputMessage.trim()) return

    const userMessage: Message = {
      id: messages.length + 1,
      text: inputMessage,
      isUser: true,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsTyping(true)

    // Simulate AI thinking time
    setTimeout(() => {
      const aiResponse: Message = {
        id: messages.length + 2,
        text: getAIResponse(inputMessage),
        isUser: false,
        timestamp: new Date(),
      }
      
      setMessages(prev => [...prev, aiResponse])
      setIsTyping(false)
    }, 1500)
  }

  const quickQuestions = [
    "How do I earn BWD tokens?",
    "How to purchase data bundles?",
    "How to withdraw to mobile money?",
    "What are the withdrawal rates?",
    "How to register my account?",
  ]

  const handleQuickQuestion = (question: string) => {
    setInputMessage(question)
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center">
            <span className="text-4xl mr-4">🤖</span>
            <div>
              <h1 className="text-2xl font-bold">ConnectShare AI Assistant</h1>
              <p className="text-blue-100">Your personal guide to earning and spending BWD tokens</p>
            </div>
          </div>
        </div>

        {/* Quick Questions */}
        <div className="p-4 bg-gray-50 border-b">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Quick Questions:</h3>
          <div className="flex flex-wrap gap-2">
            {quickQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => handleQuickQuestion(question)}
                className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
              >
                {question}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Messages */}
        <div className="h-96 overflow-y-auto p-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.isUser
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="text-sm">{message.text}</p>
                <p className={`text-xs mt-1 ${
                  message.isUser ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {message.timestamp.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSendMessage} className="p-4 border-t bg-gray-50">
          <div className="flex space-x-4">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask me anything about ConnectShare..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isTyping}
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isTyping}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
        </form>

        {/* Help Topics */}
        <div className="p-6 bg-gray-50 border-t">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">I can help you with:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">📡</span>
              <div>
                <h4 className="font-medium text-gray-900">Bandwidth Sharing</h4>
                <p className="text-sm text-gray-600">How to earn BWD tokens</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-2xl">📱</span>
              <div>
                <h4 className="font-medium text-gray-900">Data Purchases</h4>
                <p className="text-sm text-gray-600">Buy data with BWD tokens</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-2xl">💰</span>
              <div>
                <h4 className="font-medium text-gray-900">Token Withdrawals</h4>
                <p className="text-sm text-gray-600">Convert BWD to mobile money</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-2xl">👤</span>
              <div>
                <h4 className="font-medium text-gray-900">Account Setup</h4>
                <p className="text-sm text-gray-600">Registration and profile</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-2xl">📊</span>
              <div>
                <h4 className="font-medium text-gray-900">Balance & Stats</h4>
                <p className="text-sm text-gray-600">Track your earnings</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-2xl">🇬🇭</span>
              <div>
                <h4 className="font-medium text-gray-900">Ghana Features</h4>
                <p className="text-sm text-gray-600">Mobile money integration</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

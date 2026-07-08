const Footer = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-900 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Logo and Description */}
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-lg">
                <span className="text-white font-bold text-xl">R</span>
              </div>
              <span className="text-2xl font-bold">
                Resume<span className="text-blue-400">AI</span>
              </span>
            </div>
            <p className="text-gray-400 text-sm">
              AI-Powered Resume Analysis Platform for career success
            </p>
          </div>

          {/* Quick Links */}
          <div className="col-span-1 md:col-span-1">
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="/"
                  className="text-gray-400 hover:text-blue-400 transition duration-200"
                >
                  Home
                </a>
              </li>
              <li>
                <a
                  href="/dashboard"
                  className="text-gray-400 hover:text-blue-400 transition duration-200"
                >
                  Dashboard
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="col-span-1 md:col-span-1">
            <h3 className="text-lg font-semibold mb-4">Connect</h3>
            <p className="text-gray-400 text-sm mb-2">
              Built with ❤️ using MERN Stack
            </p>
            <p className="text-gray-400 text-sm">
              AI • React • Node.js • MongoDB
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-8 pt-6 text-center">
          <p className="text-gray-400 text-sm">
            © {currentYear} <span className="font-semibold">ResumeAI</span>. All rights reserved.
          </p>
          <p className="text-gray-500 text-xs mt-2">
            Developed by <span className="text-blue-400">Skan</span>
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer

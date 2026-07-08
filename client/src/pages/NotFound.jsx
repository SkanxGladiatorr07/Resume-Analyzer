import { Link } from 'react-router-dom'

const NotFound = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-blue-600 mb-4">404</h1>
        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Page Not Found
        </h2>
        <p className="text-xl text-gray-600 mb-8 max-w-xl mx-auto">
          Oops! The page you're looking for doesn't exist. 
          It might have been moved or deleted.
        </p>
        <Link
          to="/"
          className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold text-lg hover:bg-blue-700 transition duration-200"
        >
          Back to Home
        </Link>
      </div>
    </div>
  )
}

export default NotFound

const Card = ({ 
  children, 
  title, 
  className = '',
  padding = 'p-6',
}) => {
  return (
    <div className={`bg-white rounded-lg shadow-md ${padding} ${className}`}>
      {title && (
        <h3 className="text-xl font-semibold text-gray-900 mb-4">{title}</h3>
      )}
      {children}
    </div>
  )
}

export default Card

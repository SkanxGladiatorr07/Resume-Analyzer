import Card from './ui/Card'

const FeatureSection = ({ icon, title, description }) => {
  return (
    <Card className="hover:shadow-lg">
      <div className="flex items-start space-x-4">
        <div className="text-4xl flex-shrink-0">{icon}</div>
        <div className="flex-grow">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
            <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full">
              Coming Soon
            </span>
          </div>
          <p className="text-gray-600">{description}</p>
        </div>
      </div>
    </Card>
  )
}

export default FeatureSection
export { FeatureSection }

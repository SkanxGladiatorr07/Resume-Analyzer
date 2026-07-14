/**
 * ChartCard Component
 * Reusable card container for charts
 * 
 * @param {string} title - Chart title
 * @param {JSX.Element} children - Chart component
 * @param {string} description - Optional description
 */
const ChartCard = ({ title, children, description }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {description && <p className="text-sm text-gray-600 mt-1">{description}</p>}
      </div>
      <div className="w-full">{children}</div>
    </div>
  );
};

export default ChartCard;

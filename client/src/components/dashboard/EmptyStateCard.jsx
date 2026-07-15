/**
 * EmptyStateCard Component
 * Display empty state with icon, message, and optional action
 * 
 * @param {string} icon - Emoji or icon to display
 * @param {string} title - Main title
 * @param {string} description - Description text
 * @param {JSX.Element} action - Optional action button
 */
const EmptyStateCard = ({ icon = '📊', title, description, action }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-12 text-center">
      <div className="text-6xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6">{description}</p>
      {action && <div className="flex justify-center">{action}</div>}
    </div>
  );
};

export default EmptyStateCard;

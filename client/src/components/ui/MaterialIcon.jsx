/**
 * Material Symbols Icon Component
 * 
 * Usage:
 * <MaterialIcon>upload</MaterialIcon>
 * <MaterialIcon className="text-primary">settings</MaterialIcon>
 */

const MaterialIcon = ({ children, className = '', size = 24 }) => {
  return (
    <span 
      className={`material-symbols-outlined ${className}`}
      style={{ fontSize: `${size}px` }}
    >
      {children}
    </span>
  );
};

export default MaterialIcon;

/**
 * Card Component
 * Standardized card container with variants
 * 
 * @component
 */
import React from 'react';
import PropTypes from 'prop-types';

const Card = ({ 
  children, 
  title,
  subtitle,
  actions,
  variant = 'default',
  hover = false,
  className = '',
  padding = 'normal',
  noPadding = false,
}) => {
  const variants = {
    default: 'bg-white shadow-md',
    soft: 'bg-white shadow-soft',
    bordered: 'bg-white border border-gray-200',
    elevated: 'bg-white shadow-hard',
    flat: 'bg-white',
  };
  
  const paddings = {
    none: '',
    sm: 'p-4',
    normal: 'p-6',
    lg: 'p-8',
  };
  
  const hoverEffect = hover ? 'transition-all duration-200 hover:shadow-lg hover:-translate-y-1' : '';
  
  const paddingClass = noPadding ? '' : paddings[padding];
  
  return (
    <div 
      className={`
        rounded-lg
        ${variants[variant]}
        ${hoverEffect}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
    >
      {(title || actions) && (
        <div className={`flex items-start justify-between ${paddingClass} ${!noPadding && children ? 'pb-4 border-b border-gray-100' : ''}`}>
          <div className="flex-1">
            {title && (
              <h3 className="text-xl font-bold text-gray-900">{title}</h3>
            )}
            {subtitle && (
              <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-2 ml-4">
              {actions}
            </div>
          )}
        </div>
      )}
      
      {children && (
        <div className={title || actions ? (noPadding ? '' : paddingClass) : paddingClass}>
          {children}
        </div>
      )}
    </div>
  );
};

Card.propTypes = {
  children: PropTypes.node,
  title: PropTypes.string,
  subtitle: PropTypes.string,
  actions: PropTypes.node,
  variant: PropTypes.oneOf(['default', 'soft', 'bordered', 'elevated', 'flat']),
  hover: PropTypes.bool,
  className: PropTypes.string,
  padding: PropTypes.oneOf(['none', 'sm', 'normal', 'lg']),
  noPadding: PropTypes.bool,
};

export default Card;


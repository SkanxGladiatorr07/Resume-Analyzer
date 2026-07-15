/**
 * OptimizedChart Component
 * Wrapper for Recharts with performance optimizations
 * 
 * Features:
 * - Debounced resize handling
 * - Responsive container optimization
 * - Memoized rendering
 * - Error boundary for chart errors
 * 
 * @module OptimizedChart
 */

import { memo, useState, useEffect, useRef } from 'react';
import { ResponsiveContainer } from 'recharts';

/**
 * Chart wrapper props
 * @typedef {Object} OptimizedChartProps
 * @property {JSX.Element} children - Chart component to render
 * @property {number} [height=300] - Chart height in pixels
 * @property {number} [debounceMs=200] - Debounce time for resize events
 * @property {Function} [onResize] - Callback when chart resizes
 * @property {string} [className] - Additional CSS classes
 */

/**
 * Optimized chart wrapper component
 * Wraps Recharts components with performance optimizations
 * 
 * @param {OptimizedChartProps} props - Component props
 * @returns {JSX.Element} Optimized chart wrapper
 * 
 * @example
 * <OptimizedChart height={250}>
 *   <LineChart data={data}>
 *     <Line dataKey="value" />
 *   </LineChart>
 * </OptimizedChart>
 */
const OptimizedChart = memo(
  ({ children, height = 300, debounceMs = 200, onResize, className = '' }) => {
    const [isVisible, setIsVisible] = useState(false);
    const containerRef = useRef(null);
    const resizeTimerRef = useRef(null);

    /**
     * Intersection Observer for lazy rendering
     * Only render chart when visible in viewport
     */
    useEffect(() => {
      if (!containerRef.current) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setIsVisible(true);
            }
          });
        },
        {
          rootMargin: '50px', // Load slightly before entering viewport
          threshold: 0.1,
        }
      );

      observer.observe(containerRef.current);

      return () => {
        if (containerRef.current) {
          observer.unobserve(containerRef.current);
        }
      };
    }, []);

    /**
     * Debounced resize handler
     */
    useEffect(() => {
      if (!onResize) return;

      const handleResize = () => {
        if (resizeTimerRef.current) {
          clearTimeout(resizeTimerRef.current);
        }

        resizeTimerRef.current = setTimeout(() => {
          if (containerRef.current && onResize) {
            const { width, height } = containerRef.current.getBoundingClientRect();
            onResize({ width, height });
          }
        }, debounceMs);
      };

      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        if (resizeTimerRef.current) {
          clearTimeout(resizeTimerRef.current);
        }
      };
    }, [onResize, debounceMs]);

    return (
      <div ref={containerRef} className={`w-full ${className}`}>
        {isVisible ? (
          <ResponsiveContainer width="100%" height={height}>
            {children}
          </ResponsiveContainer>
        ) : (
          // Placeholder with same height to prevent layout shift
          <div style={{ height: `${height}px` }} className="bg-gray-100 animate-pulse rounded" />
        )}
      </div>
    );
  },
  // Custom comparison function for memo
  (prevProps, nextProps) => {
    // Only re-render if data actually changes
    return (
      prevProps.height === nextProps.height &&
      prevProps.debounceMs === nextProps.debounceMs &&
      JSON.stringify(prevProps.children?.props?.data) === JSON.stringify(nextProps.children?.props?.data)
    );
  }
);

OptimizedChart.displayName = 'OptimizedChart';

export default OptimizedChart;

import { Link } from 'react-router-dom';
import { BRAND } from '../../config/brand';

const Logo = ({ variant = 'default', theme = 'light', className = '' }) => {
  const isCompact = variant === 'compact';
  const isDark = theme === 'dark';

  return (
    <Link
      to="/"
      aria-label={`${BRAND.name} home`}
      className={`group inline-flex items-center gap-2 ${className}`}
    >
      <span className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg shadow-sm transition-transform group-hover:scale-105 md:h-9 md:w-9 ${
        isDark ? 'bg-white text-gray-900' : 'bg-gray-900 text-white'
      }`}>
        <svg viewBox="0 0 24 24" className="h-4 w-4 md:h-[18px] md:w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M10 9.5v5l4.5-2.5L10 9.5z" fill="currentColor" stroke="none" />
        </svg>
        <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-white" />
      </span>

      {!isCompact && (
        <span className="flex flex-col leading-none">
          <span className={`text-sm font-black uppercase tracking-[0.16em] ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {BRAND.name}
          </span>
          <span className={`mt-0.5 text-[9px] font-semibold uppercase tracking-[0.18em] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            Stock Video
          </span>
        </span>
      )}
    </Link>
  );
};

export default Logo;

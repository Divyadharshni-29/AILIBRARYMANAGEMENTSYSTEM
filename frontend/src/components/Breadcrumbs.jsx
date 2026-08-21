import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ROUTE_LABELS = {
  dashboard: 'Dashboard',
  books: 'Books Catalog',
  scanner: 'QR Scanner',
  recommendations: 'AI Recommendations',
  borrowed: 'Borrowed Books',
  history: 'Borrowing History',
  profile: 'My Profile',
  notifications: 'Notifications & Alerts',
  fines: 'Fine Payments & Receipts',
  pay: 'Pay Fine',
  transactions: 'All Transactions',
  overdue: 'Overdue & Fines',
  analytics: 'Library Analytics',
  'ai-insights': 'AI Demand Insights',
  users: 'User Management',
  librarians: 'Librarians Management',
  categories: 'Book Categories',
  'ai-evaluation': 'AI Model Studio',
  borrowers: 'Borrowers List',
};

export default function Breadcrumbs() {
  const location = useLocation();
  const { user } = useAuth();
  const pathnames = location.pathname.split('/').filter((x) => x);

  // If at root or clean dashboard, minimal display
  const role = user?.role || 'student';
  const dashboardPath = `/${role}/dashboard`;

  // Build crumbs array
  const crumbs = [];

  // Home / Dashboard root crumb
  crumbs.push({
    name: 'Dashboard',
    path: dashboardPath,
    isHome: true,
  });

  // Skip role segment in crumb trail if first segment is role
  let currentPath = '';
  const filteredSegments = pathnames.filter((segment, idx) => {
    if (idx === 0 && ['student', 'librarian', 'admin'].includes(segment)) {
      return false;
    }
    if (segment === 'dashboard') {
      return false;
    }
    return true;
  });

  filteredSegments.forEach((segment, index) => {
    // Check if segment is numeric ID
    const isId = !isNaN(segment);
    const isLast = index === filteredSegments.length - 1;

    let segmentLabel = ROUTE_LABELS[segment] || segment.replace(/-/g, ' ');
    if (isId) {
      segmentLabel = 'Book Details';
    } else {
      // Capitalize
      segmentLabel = segmentLabel.charAt(0).toUpperCase() + segmentLabel.slice(1);
    }

    // Reconstruct valid absolute path
    const pathUpToSegment = '/' + pathnames.slice(0, pathnames.indexOf(segment) + 1).join('/');

    crumbs.push({
      name: segmentLabel,
      path: pathUpToSegment,
      isLast,
    });
  });

  // If only Dashboard crumb, return compact indicator
  if (crumbs.length <= 1) {
    return (
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-400 py-1">
        <span className="flex items-center gap-1.5 font-semibold text-slate-300">
          <Home className="w-3.5 h-3.5 text-brand-400" />
          <span>Dashboard</span>
        </span>
      </nav>
    );
  }

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-400 py-1 flex-wrap">
      {crumbs.map((crumb, index) => {
        const isLast = index === crumbs.length - 1;

        return (
          <React.Fragment key={crumb.path || index}>
            {index > 0 && <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />}

            {isLast ? (
              <span className="font-bold text-brand-300 truncate max-w-[220px]">
                {crumb.name}
              </span>
            ) : (
              <Link
                to={crumb.path}
                className="hover:text-slate-200 transition-colors font-medium flex items-center gap-1 shrink-0"
              >
                {crumb.isHome && <Home className="w-3.5 h-3.5 text-brand-400" />}
                <span>{crumb.name}</span>
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

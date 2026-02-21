import Sidebar from './Sidebar';

/**
 * Shared layout wrapper — renders the Sidebar alongside page content.
 * Use this in pages instead of individually importing <Sidebar />.
 *
 * Usage:
 *   <AppLayout className="home-container">
 *     <div className="home-content">...</div>
 *   </AppLayout>
 */
const AppLayout = ({ children, className = '' }) => {
  return (
    <div className={className}>
      <Sidebar />
      {children}
    </div>
  );
};

export default AppLayout;

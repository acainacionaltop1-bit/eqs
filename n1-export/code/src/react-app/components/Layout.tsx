import { ReactNode, useState, useEffect } from 'react';
import { useAuth } from '@/react-app/hooks/useAuth';
import { Link, useLocation } from 'react-router';
import { NotificationCenter } from '@/react-app/components/NotificationCenter';
import { VipGroupsButton } from '@/react-app/components/VipGroupsButton';

import { 
  Home, 
  Play, 
  Users, 
  Trophy, 
  User, 
  LogOut,
  Menu,
  X,
  Settings,
  Crown
} from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  

  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const response = await fetch('/api/admin/stats', { credentials: 'include' });
        setIsAdmin(response.ok);
      } catch {
        setIsAdmin(false);
      }
    };
    checkAdminStatus();
  }, []);

  const navigation = [
    { name: 'Home', href: '/home', icon: Home },
    { name: 'Missões', href: '/missions', icon: Play },
    { name: 'Afiliados', href: '/affiliates', icon: Users },
    { name: 'Ranking', href: '/ranking', icon: Trophy },
    { name: 'Carreira', href: '/carreira', icon: Crown },
    { name: 'Perfil', href: '/profile', icon: User },
    ...(isAdmin ? [{ name: 'Admin', href: '/admin', icon: Settings }] : []),
  ];

  const isActive = (href: string) => location.pathname === href;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Background Elements */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-green-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl animate-pulse" style={{
          animationDelay: '1s'
        }}></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,197,94,0.05),transparent_50%)]"></div>
      </div>

      {/* Mobile-first layout */}
      <div className="pb-20 lg:pb-0 lg:pl-72 relative z-10">
        {/* Sidebar - Desktop only */}
        <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col">
          <div className="flex min-h-0 flex-1 flex-col border-r border-gray-800" style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(20px)'
          }}>
            {/* Logo */}
            <div className="flex items-center h-20 flex-shrink-0 px-4 border-b border-gray-800">
              <img 
                src="https://mocha-cdn.com/01999c98-c3d7-7a52-aad8-d779286efadd/1000808270-removebg-preview-(2).png" 
                alt="Logo" 
                className="h-40" 
              />
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-300 ${
                      isActive(item.href)
                        ? 'bg-gradient-to-r from-green-500/20 to-emerald-600/20 text-green-400 border border-green-500/30'
                        : 'text-gray-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Icon className={`mr-3 h-5 w-5 ${isActive(item.href) ? 'text-green-400' : ''}`} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            {/* User info */}
            <div className="flex-shrink-0 px-4 py-4 border-t border-gray-800">
              <div className="flex items-center">
                <img
                  className="h-10 w-10 rounded-full border-2 border-green-400/30"
                  src={user?.google_user_data?.picture || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user?.google_user_data?.name || user?.email || 'User')}
                  alt="Profile"
                />
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-white truncate">
                    {user?.google_user_data?.name || user?.email}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {user?.email}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <VipGroupsButton />
                  <NotificationCenter />
                  <button
                    onClick={logout}
                    className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    title="Sair"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile header */}
        <div className="lg:hidden sticky top-0 z-30">
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-800" style={{
            background: 'rgba(0, 0, 0, 0.95)',
            backdropFilter: 'blur(20px)'
          }}>
            <div className="flex items-center">
              <img 
                src="https://mocha-cdn.com/01999c98-c3d7-7a52-aad8-d779286efadd/1000808270-removebg-preview-(2).png" 
                alt="Logo" 
                className="h-40" 
              />
            </div>
            
            <div className="flex items-center gap-3">
              <VipGroupsButton />
              <NotificationCenter />
              <img
                className="h-8 w-8 rounded-full border border-green-400/30"
                src={user?.google_user_data?.picture || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user?.google_user_data?.name || user?.email || 'User')}
                alt="Profile"
              />
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-gray-400 hover:text-white rounded-lg transition-colors"
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Mobile menu dropdown */}
          {isMobileMenuOpen && (
            <div className="absolute top-16 left-0 right-0 z-20 border-b border-gray-800" style={{
              background: 'rgba(0, 0, 0, 0.95)',
              backdropFilter: 'blur(20px)'
            }}>
              <nav className="px-4 py-3 space-y-1">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                        isActive(item.href)
                          ? 'bg-gradient-to-r from-green-500/20 to-emerald-600/20 text-green-400'
                          : 'text-gray-300 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <Icon className={`mr-3 h-4 w-4 ${isActive(item.href) ? 'text-green-400' : ''}`} />
                      {item.name}
                    </Link>
                  );
                })}
                <button
                  onClick={() => {
                    logout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <LogOut className="mr-3 h-4 w-4" />
                  Sair
                </button>
              </nav>
            </div>
          )}
        </div>

        {/* Main content */}
        <main className="px-4 py-4 lg:py-8 lg:px-8">
          {children}
        </main>

        

        {/* Mobile bottom navigation */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 border-t border-gray-800" style={{
          background: 'rgba(0, 0, 0, 0.95)',
          backdropFilter: 'blur(20px)'
        }}>
          <nav className="flex items-center justify-around py-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex flex-col items-center py-2 px-3 rounded-lg transition-all ${
                    isActive(item.href)
                      ? 'text-green-400'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Icon className={`h-5 w-5 mb-1 ${isActive(item.href) ? 'text-green-400' : ''}`} />
                  <span className="text-xs font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
      
      
    </div>
  );
}

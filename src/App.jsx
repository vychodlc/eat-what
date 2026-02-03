import React, { useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Home, History, Heart, Settings, LayoutGrid, Share2, UtensilsCrossed } from 'lucide-react';
import useAuthStore from '@/stores/useAuthStore.js';
import useFoodStore from '@/stores/useFoodStore.js';
import HomePage from '@/pages/Home/index.jsx';
import HistoryPage from '@/pages/History/index.jsx';
import FavoritesPage from '@/pages/Favorites/index.jsx';
import AdminFoods from '@/pages/Admin/Foods.jsx';
import AdminCategories from '@/pages/Admin/Categories.jsx';
import SharePage from '@/pages/Share/index.jsx';

const App = () => {
  const { init, userInfo, isAdmin, loading: authLoading } = useAuthStore();
  const { fetchCategories, fetchRestaurants } = useFoodStore();
  const location = useLocation();

  useEffect(() => {
    init();
    fetchCategories();
    fetchRestaurants();
  }, []);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <UtensilsCrossed className="w-12 h-12 text-primary animate-bounce" />
      </div>
    );
  }

  const navItems = [
    { path: '/', icon: Home, label: '美食抽取' },
    { path: '/history', icon: History, label: '抽取历史' },
    { path: '/favorites', icon: Heart, label: '我的收藏' },
  ];

  const adminItems = [
    { path: '/admin/foods', icon: Settings, label: '美食管理' },
    { path: '/admin/categories', icon: LayoutGrid, label: '分类管理' },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Sidebar / Mobile Nav */}
      <aside className="w-full md:w-64 bg-secondary text-secondary-foreground flex flex-col shrink-0">
        <div className="p-6 flex items-center gap-3">
          <div className="bg-primary p-2 rounded-xl">
            <UtensilsCrossed className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-display font-black tracking-tight">午饭抽抽乐</h1>
        </div>

        <nav className="flex-1 px-4 space-y-2 py-4">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                location.pathname === item.path 
                  ? 'bg-primary text-white shadow-lg shadow-primary/30' 
                  : 'hover:bg-white/10'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}

          {isAdmin && (
            <>
              <div className="pt-6 pb-2 px-4 text-xs font-bold text-white/40 uppercase tracking-widest">管理后台</div>
              {adminItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    location.pathname === item.path 
                      ? 'bg-primary text-white shadow-lg shadow-primary/30' 
                      : 'hover:bg-white/10'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              ))}
            </>
          )}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl">
            <img 
              src={`https://work.alibaba-inc.com/photo/${userInfo?.workNo}.200x200.jpg`} 
              className="w-10 h-10 rounded-full object-cover ring-2 ring-primary/50"
              alt="avatar"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{userInfo?.nickName || userInfo?.name}</p>
              <p className="text-xs text-white/50 truncate">{userInfo?.workNo}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-background p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/favorites" element={<FavoritesPage />} />
            <Route path="/admin/foods" element={<AdminFoods />} />
            <Route path="/admin/categories" element={<AdminCategories />} />
            <Route path="/share/:id" element={<SharePage />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

export default App;
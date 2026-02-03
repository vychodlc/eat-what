import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Utensils, Star, MapPin, DollarSign, RefreshCw, Heart, Share2, Filter, Check, X, ChevronDown } from 'lucide-react';
import useFoodStore from '@/stores/useFoodStore.js';
import { toast } from 'react-hot-toast';
import { Dialog, Select } from 'radix-ui';
import L7Map from './components/L7Map.jsx';

const HomePage = () => {
  const { restaurants, categories, fetchRestaurants, toggleFavorite, addHistory, favorites, userLocation, setUserLocation, initNearbyRestaurants } = useFoodStore();
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedResult, setSelectedResult] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [filters, setFilters] = useState({ categoryId: 'all', minRating: '0' });
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  // Get user location
  useEffect(() => {
    if (!navigator.geolocation) {
      toast.error('您的浏览器不支持地理定位');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const { longitude: lng, latitude: lat } = position.coords;
        const isFirstLocation = !userLocation;
        setUserLocation({ lng, lat });
        
        // If it's the first time getting location, initialize and fetch nearby restaurants
        if (isFirstLocation) {
          setIsInitializing(true);
          try {
            await initNearbyRestaurants({ lng, lat });
            await fetchRestaurants({ lng, lat, radius: 3 });
          } catch (err) {
            console.error('Init error:', err);
          } finally {
            setIsInitializing(false);
          }
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast.error('无法获取位置，请检查权限设置');
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [userLocation]);

  // Initial fetch for metadata
  useEffect(() => {
    useFoodStore.getState().fetchCategories();
    useFoodStore.getState().fetchFavorites();
    // Fetch restaurants once initially (without location if not yet available)
    if (!userLocation) {
      fetchRestaurants();
    }
  }, []);

  // Filtered restaurants based on user selection
  const filteredRestaurants = useMemo(() => {
    let list = restaurants.filter(r => {
      const matchCategory = filters.categoryId === 'all' || r.f_category_id === parseInt(filters.categoryId);
      const matchRating = r.f_rating >= parseFloat(filters.minRating);
      return matchCategory && matchRating;
    });

    // Smart logic: if user is searching with location, prioritize nearby
    // But if no nearby ones match the criteria, show a warning but allow others
    const nearbyCount = list.filter(r => r.is_nearby).length;
    
    // If we have location but no nearby matches, we might want to inform the user
    return list;
  }, [restaurants, filters]);

  const nearbyRestaurants = useMemo(() => {
    return filteredRestaurants.filter(r => r.is_nearby);
  }, [filteredRestaurants]);

  const startSpin = () => {
    // Decide which pool to spin from: nearby if available, else all filtered
    const pool = nearbyRestaurants.length > 0 ? nearbyRestaurants : filteredRestaurants;

    if (pool.length === 0) {
      toast.error('没有符合条件的餐厅，请尝试清除筛选条件');
      return;
    }
    setIsSpinning(true);
    setSelectedResult(null);
    
    let duration = 3000;
    let startTime = Date.now();
    
    const spin = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed < duration) {
        setCurrentIndex(Math.floor(Math.random() * pool.length));
        requestAnimationFrame(spin);
      } else {
        const finalIndex = Math.floor(Math.random() * pool.length);
        const result = pool[finalIndex];
        setCurrentIndex(finalIndex);
        setSelectedResult(result);
        setIsSpinning(false);
        addHistory(result.f_id);
        
        if (!result.is_nearby && userLocation) {
          toast('附近 3km 暂无符合条件的餐厅，已为您从全部餐厅中抽取', { icon: 'ℹ️' });
        }
        toast.success(`抽中啦！今天就吃 ${result.f_name}！`, { icon: '🎉' });
      }
    };
    spin();
  };

  const isFavorite = (id) => favorites.some(f => f.f_restaurant_id === id);

  const handleToggleFavorite = async (id) => {
    const action = await toggleFavorite(id);
    toast.success(action === 'added' ? '已收藏' : '已取消收藏');
  };

  const pool = nearbyRestaurants.length > 0 ? nearbyRestaurants : filteredRestaurants;
  const currentDisplay = isSpinning ? pool[currentIndex] : selectedResult;

  return (
    <div className="space-y-8 pb-12">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-4xl font-display font-black text-secondary leading-tight">
            中午吃什么？<span className="text-primary">抽一下</span>就知道！
          </h2>
          <p className="text-foreground/60 mt-2 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            {userLocation 
              ? (nearbyRestaurants.length > 0 ? `已发现周边 3km 内 ${nearbyRestaurants.length} 家餐厅` : '附近 3km 暂无餐厅，已为您展示全部')
              : '正在获取位置，为您推荐周边美食...'}
          </p>
        </div>
        
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl shadow-sm border border-border">
          <div className="flex items-center gap-1 px-2 py-1 text-foreground/40 border-r border-border">
            <Filter className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">筛选</span>
          </div>
          
          {/* Category Select */}
          <Select.Root 
            value={filters.categoryId} 
            onValueChange={(val) => setFilters({ ...filters, categoryId: val })}
          >
            <Select.Trigger className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl hover:bg-muted/50 transition-colors text-sm font-medium outline-none min-w-[120px]">
              <Select.Value placeholder="选择品类" />
              <Select.Icon>
                <ChevronDown className="w-4 h-4 opacity-50" />
              </Select.Icon>
            </Select.Trigger>
            <Select.Portal>
              <Select.Content className="bg-white rounded-xl shadow-xl border border-border overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                <Select.Viewport className="p-1">
                  <Select.Item value="all" className="flex items-center px-8 py-2 text-sm rounded-lg outline-none cursor-pointer hover:bg-primary/5 focus:bg-primary/5 relative">
                    <Select.ItemText>全部品类</Select.ItemText>
                    <Select.ItemIndicator className="absolute left-2 inline-flex items-center justify-center">
                      <Check className="w-4 h-4 text-primary" />
                    </Select.ItemIndicator>
                  </Select.Item>
                  <Select.Separator className="h-px bg-border my-1" />
                  {categories.map(c => (
                    <Select.Item key={c.f_id} value={c.f_id.toString()} className="flex items-center px-8 py-2 text-sm rounded-lg outline-none cursor-pointer hover:bg-primary/5 focus:bg-primary/5 relative">
                      <Select.ItemText>{c.f_name}</Select.ItemText>
                      <Select.ItemIndicator className="absolute left-2 inline-flex items-center justify-center">
                        <Check className="w-4 h-4 text-primary" />
                      </Select.ItemIndicator>
                    </Select.Item>
                  ))}
                </Select.Viewport>
              </Select.Content>
            </Select.Portal>
          </Select.Root>

          <div className="w-px h-4 bg-border" />

          {/* Rating Select */}
          <Select.Root 
            value={filters.minRating} 
            onValueChange={(val) => setFilters({ ...filters, minRating: val })}
          >
            <Select.Trigger className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl hover:bg-muted/50 transition-colors text-sm font-medium outline-none min-w-[120px]">
              <Select.Value placeholder="选择评分" />
              <Select.Icon>
                <ChevronDown className="w-4 h-4 opacity-50" />
              </Select.Icon>
            </Select.Trigger>
            <Select.Portal>
              <Select.Content className="bg-white rounded-xl shadow-xl border border-border overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                <Select.Viewport className="p-1">
                  {[
                    { label: '评分不限', value: '0' },
                    { label: '4.0分以上', value: '4' },
                    { label: '4.5分以上', value: '4.5' }
                  ].map(item => (
                    <Select.Item key={item.value} value={item.value} className="flex items-center px-8 py-2 text-sm rounded-lg outline-none cursor-pointer hover:bg-primary/5 focus:bg-primary/5 relative">
                      <Select.ItemText>{item.label}</Select.ItemText>
                      <Select.ItemIndicator className="absolute left-2 inline-flex items-center justify-center">
                        <Check className="w-4 h-4 text-primary" />
                      </Select.ItemIndicator>
                    </Select.Item>
                  ))}
                </Select.Viewport>
              </Select.Content>
            </Select.Portal>
          </Select.Root>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Slot Area */}
        <div className="lg:col-span-7 space-y-6">
          <div className="relative aspect-[4/3] bg-white rounded-[2.5rem] shadow-2xl shadow-primary/10 border-8 border-white overflow-hidden flex flex-col items-center justify-center group">
            <AnimatePresence mode="wait">
              {currentDisplay ? (
                <motion.div 
                  key={currentDisplay.f_id}
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 1.1, y: -20 }}
                  className="absolute inset-0"
                >
                  <img 
                    src={currentDisplay.f_image_url || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80'} 
                    className="w-full h-full object-cover"
                    alt={currentDisplay.f_name}
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />
                  
                  <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                        {currentDisplay.f_category_name}
                      </span>
                      <div className="flex items-center gap-1 bg-accent text-accent-foreground px-3 py-1 rounded-full text-xs font-bold">
                        <Star className="w-3 h-3 fill-current" />
                        {currentDisplay.f_rating}
                      </div>
                    </div>
                    <h3 className="text-4xl font-display font-black mb-2">{currentDisplay.f_name}</h3>
                    <div className="flex items-center gap-4 text-white/80 text-sm">
                      <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {currentDisplay.f_address}</span>
                      <span className="flex items-center gap-1"><DollarSign className="w-4 h-4" /> {currentDisplay.f_price_range}</span>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="text-center p-12 space-y-4">
                  <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Utensils className="w-12 h-12 text-primary" />
                  </div>
                  <p className="text-xl font-display font-bold text-secondary">准备好了吗？</p>
                  <p className="text-foreground/40">点击下方按钮开始随机抽取午餐</p>
                </div>
              )}
            </AnimatePresence>

            {/* Controls Overlay */}
            {!isSpinning && selectedResult && (
              <div className="absolute top-6 right-6 flex gap-2">
                <button 
                  onClick={() => handleToggleFavorite(selectedResult.f_id)}
                  className={`p-3 rounded-full transition-all ${isFavorite(selectedResult.f_id) ? 'bg-primary text-white' : 'bg-white/90 text-secondary hover:bg-white'}`}
                >
                  <Heart className={`w-5 h-5 ${isFavorite(selectedResult.f_id) ? 'fill-current' : ''}`} />
                </button>
                <button 
                  onClick={() => setShowShareDialog(true)}
                  className="p-3 bg-white/90 text-secondary rounded-full hover:bg-white transition-all"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          <button
            onClick={startSpin}
            disabled={isSpinning}
            className={`w-full py-6 rounded-3xl text-2xl font-display font-black transition-all flex items-center justify-center gap-4 shadow-xl shadow-primary/20 transform active:scale-95 ${
              isSpinning 
                ? 'bg-muted text-foreground/40 cursor-not-allowed' 
                : 'bg-primary text-white hover:bg-primary/90 hover:-translate-y-1'
            }`}
          >
            {isSpinning ? (
              <>
                <RefreshCw className="w-8 h-8 animate-spin" />
                正在为你挑选美味...
              </>
            ) : (
              <>
                <Utensils className="w-8 h-8" />
                {selectedResult ? '再抽一次' : '开启今日美味之旅'}
              </>
            )}
          </button>
        </div>

        {/* Map Area */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-[2rem] shadow-xl border border-border overflow-hidden flex flex-col h-full min-h-[500px]">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h4 className="font-bold flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                美食地图分布
              </h4>
              <span className="text-xs text-foreground/40">3km 范围搜索</span>
            </div>
            <div className="flex-1 relative">
              <L7Map restaurants={filteredRestaurants} selectedId={selectedResult?.f_id} />
            </div>
          </div>
        </div>
      </div>

      {/* Share Dialog */}
      <Dialog.Root open={showShareDialog} onOpenChange={setShowShareDialog}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-3xl p-8 w-[400px] shadow-2xl z-50 border border-border">
            <Dialog.Title className="text-2xl font-display font-black mb-4">分享给小伙伴</Dialog.Title>
            <div className="space-y-6">
              <div className="p-4 bg-muted/30 rounded-2xl border border-dashed border-border text-center">
                <p className="text-sm text-foreground/60 mb-2">长按复制链接或直接发送</p>
                <div className="bg-white p-3 rounded-xl border border-border font-mono text-xs truncate">
                  {window.location.origin}/#/share/{selectedResult?.f_id}
                </div>
              </div>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/#/share/${selectedResult?.f_id}`);
                  toast.success('链接已复制到剪贴板');
                  setShowShareDialog(false);
                }}
                className="w-full py-4 bg-secondary text-white rounded-2xl font-bold hover:bg-secondary/90 transition-all"
              >
                复制链接
              </button>
            </div>
            <Dialog.Close asChild>
              <button className="absolute top-4 right-4 p-2 hover:bg-muted rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
};

export default HomePage;
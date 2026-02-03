import React, { useEffect } from 'react';
import useFoodStore from '@/stores/useFoodStore.js';
import { Heart, Star, MapPin, Trash2, Utensils, Play } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const FavoritesPage = () => {
  const { favorites, fetchFavorites, toggleFavorite } = useFoodStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchFavorites();
  }, []);

  const handleRemove = async (e, id) => {
    e.stopPropagation();
    await toggleFavorite(id);
    toast.success('已从收藏夹移除');
  };

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-display font-black text-secondary">我的收藏</h2>
          <p className="text-foreground/60">这些是你心心念念的美味</p>
        </div>
      </header>

      {favorites.length === 0 ? (
        <div className="bg-white rounded-[2rem] p-16 text-center border border-dashed border-border">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="w-10 h-10 text-foreground/20" />
          </div>
          <p className="text-lg font-bold text-secondary">收藏夹空空如也</p>
          <p className="text-foreground/40">看到心仪的餐厅记得点个爱心哦</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map((item, index) => (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              key={item.f_id}
              className="bg-white rounded-[2rem] border border-border overflow-hidden hover:shadow-2xl transition-all group relative"
            >
              <div className="aspect-[16/10] overflow-hidden relative">
                <img 
                  src={item.f_image_url || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80'} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  alt={item.f_name}
                />
                <div className="absolute top-4 right-4 flex gap-2">
                  <button 
                    onClick={(e) => handleRemove(e, item.f_restaurant_id)}
                    className="p-2 bg-white/90 text-red-500 rounded-full hover:bg-white shadow-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-secondary mb-2">{item.f_name}</h3>
                <div className="flex items-center gap-4 text-sm text-foreground/60 mb-4">
                  <span className="flex items-center gap-1 text-accent font-bold">
                    <Star className="w-4 h-4 fill-current" /> {item.f_rating}
                  </span>
                  <span className="flex items-center gap-1">
                    <Utensils className="w-4 h-4" /> {item.f_price_range}
                  </span>
                </div>
                <button 
                  onClick={() => navigate('/')}
                  className="w-full py-3 bg-secondary/5 text-secondary rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary hover:text-white transition-all"
                >
                  <Play className="w-4 h-4" /> 立即抽取
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FavoritesPage;
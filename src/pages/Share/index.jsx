import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import vibeSdk from "@alipay/weavefox-vibe-web";
import { Star, MapPin, DollarSign, Utensils, ArrowLeft, Heart } from 'lucide-react';
import useFoodStore from '@/stores/useFoodStore.js';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';

const SharePage = () => {
  const { id } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toggleFavorite, favorites } = useFoodStore();

  useEffect(() => {
    const fetchDetail = async () => {
      const res = await vibeSdk.functions.get(`restaurant/detail/${id}`);
      if (res.success) setRestaurant(res.data);
      setLoading(false);
    };
    fetchDetail();
  }, [id]);

  const isFavorite = favorites.some(f => f.f_restaurant_id === parseInt(id));

  const handleToggleFavorite = async () => {
    const action = await toggleFavorite(id);
    toast.success(action === 'added' ? '已收藏' : '已取消收藏');
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );

  if (!restaurant) return (
    <div className="text-center py-20">
      <h2 className="text-2xl font-bold">未找到该餐厅信息</h2>
      <Link to="/" className="text-primary mt-4 inline-block">返回首页</Link>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <Link to="/" className="inline-flex items-center gap-2 text-foreground/40 hover:text-primary transition-colors mb-8">
        <ArrowLeft className="w-4 h-4" /> 返回首页
      </Link>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-border"
      >
        <div className="aspect-video relative">
          <img 
            src={restaurant.f_image_url || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80'} 
            className="w-full h-full object-cover"
            alt={restaurant.f_name}
          />
          <div className="absolute top-6 right-6">
            <button 
              onClick={handleToggleFavorite}
              className={`p-4 rounded-full shadow-lg transition-all ${isFavorite ? 'bg-primary text-white' : 'bg-white/90 text-secondary hover:bg-white'}`}
            >
              <Heart className={`w-6 h-6 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>

        <div className="p-10 space-y-6">
          <div className="flex items-center gap-2">
            <span className="bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-bold">
              {restaurant.f_category_name}
            </span>
            <div className="flex items-center gap-1 bg-accent text-accent-foreground px-4 py-1.5 rounded-full text-sm font-bold">
              <Star className="w-4 h-4 fill-current" />
              {restaurant.f_rating}
            </div>
          </div>

          <h1 className="text-4xl font-display font-black text-secondary">{restaurant.f_name}</h1>
          
          <div className="space-y-4 pt-4 border-t border-border">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-primary shrink-0 mt-1" />
              <div>
                <p className="font-bold text-secondary">商家地址</p>
                <p className="text-foreground/60">{restaurant.f_address}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <DollarSign className="w-5 h-5 text-primary shrink-0 mt-1" />
              <div>
                <p className="font-bold text-secondary">人均消费</p>
                <p className="text-foreground/60">¥ {restaurant.f_price_range}</p>
              </div>
            </div>
          </div>

          <div className="pt-8">
            <Link to="/" className="w-full py-5 bg-secondary text-white rounded-[1.5rem] font-bold text-lg flex items-center justify-center gap-3 hover:bg-secondary/90 transition-all shadow-xl shadow-secondary/20">
              <Utensils className="w-6 h-6" /> 我也要抽一个！
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SharePage;
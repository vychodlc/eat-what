import React, { useEffect } from 'react';
import useFoodStore from '@/stores/useFoodStore.js';
import { Clock, Star, MapPin, ChevronRight, Utensils } from 'lucide-react';
import dayjs from 'dayjs';
import { motion } from 'framer-motion';

const HistoryPage = () => {
  const { history, fetchHistory } = useFoodStore();

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-3xl font-display font-black text-secondary">抽取历史</h2>
        <p className="text-foreground/60">回顾你那些“艰难”的午餐选择瞬间</p>
      </header>

      {history.length === 0 ? (
        <div className="bg-white rounded-[2rem] p-16 text-center border border-dashed border-border">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-10 h-10 text-foreground/20" />
          </div>
          <p className="text-lg font-bold text-secondary">还没有抽取记录</p>
          <p className="text-foreground/40">去首页抽一个试试吧！</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {history.map((item, index) => (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              key={item.f_id}
              className="bg-white p-4 rounded-3xl border border-border hover:shadow-lg transition-all flex items-center gap-6 group"
            >
              <img 
                src={item.f_image_url || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=200&q=80'} 
                className="w-24 h-24 rounded-2xl object-cover"
                alt={item.f_name}
              />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-xl font-bold text-secondary">{item.f_name}</h3>
                  <span className="text-xs text-foreground/40 font-mono">
                    {dayjs(item.f_create_time).format('YYYY-MM-DD HH:mm')}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-foreground/60">
                  <span className="flex items-center gap-1 text-accent font-bold">
                    <Star className="w-4 h-4 fill-current" /> {item.f_rating}
                  </span>
                  <span className="flex items-center gap-1">
                    <Utensils className="w-4 h-4" /> {item.f_price_range}
                  </span>
                </div>
              </div>
              <ChevronRight className="w-6 h-6 text-muted group-hover:text-primary transition-colors" />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HistoryPage;
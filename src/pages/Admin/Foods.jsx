import React, { useState, useEffect } from 'react';
import useFoodStore from '@/stores/useFoodStore.js';
import { Plus, Search, Edit2, Trash2, X, Upload, Star } from 'lucide-react';
import { Dialog } from 'radix-ui';
import { toast } from 'react-hot-toast';
import vibeSdk from "@alipay/weavefox-vibe-web";

const AdminFoods = () => {
  const { restaurants, categories, fetchRestaurants, saveRestaurant, deleteRestaurant } = useFoodStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [editingFood, setEditingFood] = useState(null);

  useEffect(() => {
    fetchRestaurants({ search });
  }, [search]);

  const handleSave = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    
    if (editingFood) data.f_id = editingFood.f_id;
    
    try {
      await saveRestaurant(data);
      toast.success(editingFood ? '修改成功' : '添加成功');
      setIsDialogOpen(false);
      setEditingFood(null);
    } catch (err) {
      toast.error('保存失败');
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onloadend = async () => {
      const res = await vibeSdk.uploadImage(reader.result);
      if (res.success) {
        setEditingFood(prev => ({ ...prev, f_image_url: res.data.url }));
        toast.success('图片上传成功');
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-display font-black text-secondary">美食管理</h2>
          <p className="text-foreground/60">维护您的美食数据库</p>
        </div>
        <button 
          onClick={() => { setEditingFood(null); setIsDialogOpen(true); }}
          className="bg-primary text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-primary/20"
        >
          <Plus className="w-5 h-5" /> 添加餐厅
        </button>
      </header>

      <div className="bg-white rounded-[2rem] border border-border overflow-hidden">
        <div className="p-6 border-b border-border bg-muted/10">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
            <input 
              type="text" 
              placeholder="搜索餐厅名称..." 
              className="w-full pl-12 pr-4 py-3 bg-white border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-muted/5 text-foreground/40 text-xs uppercase tracking-wider font-bold">
                <th className="px-6 py-4">餐厅</th>
                <th className="px-6 py-4">分类</th>
                <th className="px-6 py-4">评分</th>
                <th className="px-6 py-4">价格</th>
                <th className="px-6 py-4 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {restaurants.map(food => (
                <tr key={food.f_id} className="hover:bg-muted/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img src={food.f_image_url} className="w-10 h-10 rounded-lg object-cover" />
                      <span className="font-bold text-secondary">{food.f_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-secondary/10 text-secondary px-2 py-1 rounded-md text-xs font-medium">
                      {food.f_category_name}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-accent font-bold">
                      <Star className="w-3 h-3 fill-current" /> {food.f_rating}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-foreground/60">{food.f_price_range}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => { setEditingFood(food); setIsDialogOpen(true); }}
                        className="p-2 hover:bg-primary/10 text-primary rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={async () => {
                          if (confirm('确定要删除吗？')) {
                            await deleteRestaurant(food.f_id);
                            toast.success('已删除');
                          }
                        }}
                        className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog.Root open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-3xl p-8 w-[600px] max-h-[90vh] overflow-y-auto shadow-2xl z-50 border border-border">
            <Dialog.Title className="text-2xl font-display font-black mb-6">
              {editingFood ? '编辑餐厅' : '添加餐厅'}
            </Dialog.Title>
            
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold">名称</label>
                  <input name="f_name" defaultValue={editingFood?.f_name} required className="w-full p-3 bg-muted/30 border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold">分类</label>
                  <select name="f_category_id" defaultValue={editingFood?.f_category_id} className="w-full p-3 bg-muted/30 border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary">
                    {categories.map(c => <option key={c.f_id} value={c.f_id}>{c.f_name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold">评分</label>
                  <input name="f_rating" type="number" step="0.1" max="5" defaultValue={editingFood?.f_rating} className="w-full p-3 bg-muted/30 border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold">价格区间</label>
                  <input name="f_price_range" placeholder="如: 50-100" defaultValue={editingFood?.f_price_range} className="w-full p-3 bg-muted/30 border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold">地址</label>
                <input name="f_address" defaultValue={editingFood?.f_address} className="w-full p-3 bg-muted/30 border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary" />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold">经度</label>
                  <input name="f_lng" type="number" step="0.000001" defaultValue={editingFood?.f_lng || 120.15} className="w-full p-3 bg-muted/30 border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold">纬度</label>
                  <input name="f_lat" type="number" step="0.000001" defaultValue={editingFood?.f_lat || 30.26} className="w-full p-3 bg-muted/30 border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold">图片 URL</label>
                <div className="flex gap-4">
                  <input name="f_image_url" value={editingFood?.f_image_url || ''} onChange={e => setEditingFood({...editingFood, f_image_url: e.target.value})} className="flex-1 p-3 bg-muted/30 border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary" />
                  <label className="bg-secondary text-white px-4 py-3 rounded-xl cursor-pointer hover:bg-secondary/90 flex items-center gap-2">
                    <Upload className="w-4 h-4" /> 上传
                    <input type="file" className="hidden" onChange={handleImageUpload} accept="image/*" />
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <Dialog.Close asChild>
                  <button type="button" className="px-6 py-3 border border-border rounded-xl font-bold hover:bg-muted transition-colors">取消</button>
                </Dialog.Close>
                <button type="submit" className="px-8 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 shadow-lg shadow-primary/20">保存</button>
              </div>
            </form>

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

export default AdminFoods;
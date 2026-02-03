import React, { useState } from 'react';
import useFoodStore from '@/stores/useFoodStore.js';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import { Dialog } from 'radix-ui';
import { toast } from 'react-hot-toast';

const AdminCategories = () => {
  const { categories, saveCategory, deleteCategory } = useFoodStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const handleSave = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    
    if (editingCategory) data.f_id = editingCategory.f_id;
    
    try {
      await saveCategory(data);
      toast.success('保存成功');
      setIsDialogOpen(false);
      setEditingCategory(null);
    } catch (err) {
      toast.error('保存失败');
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-display font-black text-secondary">分类管理</h2>
          <p className="text-foreground/60">管理美食的类别和标签</p>
        </div>
        <button 
          onClick={() => { setEditingCategory(null); setIsDialogOpen(true); }}
          className="bg-primary text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-primary/20"
        >
          <Plus className="w-5 h-5" /> 添加分类
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map(cat => (
          <div key={cat.f_id} className="bg-white p-6 rounded-3xl border border-border flex items-start justify-between group hover:shadow-xl transition-all">
            <div>
              <div className="w-12 h-12 bg-secondary/5 rounded-2xl flex items-center justify-center mb-4 text-secondary">
                <Plus className="w-6 h-6" /> {/* Placeholder for actual icon */}
              </div>
              <h3 className="text-xl font-bold text-secondary mb-1">{cat.f_name}</h3>
              <p className="text-sm text-foreground/40 line-clamp-2">{cat.f_description || '暂无描述'}</p>
            </div>
            <div className="flex flex-col gap-2">
              <button 
                onClick={() => { setEditingCategory(cat); setIsDialogOpen(true); }}
                className="p-2 hover:bg-primary/10 text-primary rounded-lg transition-colors"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button 
                onClick={async () => {
                  if (confirm('确定要删除吗？')) {
                    await deleteCategory(cat.f_id);
                    toast.success('已删除');
                  }
                }}
                className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <Dialog.Root open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-3xl p-8 w-[450px] shadow-2xl z-50 border border-border">
            <Dialog.Title className="text-2xl font-display font-black mb-6">
              {editingCategory ? '编辑分类' : '添加分类'}
            </Dialog.Title>
            
            <form onSubmit={handleSave} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold">分类名称</label>
                <input name="f_name" defaultValue={editingCategory?.f_name} required className="w-full p-3 bg-muted/30 border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold">描述</label>
                <textarea name="f_description" defaultValue={editingCategory?.f_description} rows={3} className="w-full p-3 bg-muted/30 border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold">图标代码 (Lucide)</label>
                <input name="f_icon" defaultValue={editingCategory?.f_icon} placeholder="如: Utensils" className="w-full p-3 bg-muted/30 border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary" />
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

export default AdminCategories;
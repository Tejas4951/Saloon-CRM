import React, { useState } from 'react';
import { 
  Sparkles, 
  Plus, 
  Pencil, 
  Trash2, 
  Upload, 
  Search, 
  Tag, 
  DollarSign, 
  FileText, 
  Image as ImageIcon,
  Check,
  Layers,
  Camera
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useStyles, StyleItem } from '@/contexts/StylesContext';
import { useServices } from '@/contexts/ServicesContext';
import { toast } from 'sonner';

const DEFAULT_CATEGORIES = ['Haircuts', 'Colour', 'Beard', 'Skin', 'Styling', 'Nail Care', 'Spa'];

export default function StylesManagement() {
  const { styles, addStyle, updateStyle, deleteStyle } = useStyles();
  const { services } = useServices();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');
  
  // Custom categories list
  const [customCategoryList, setCustomCategoryList] = useState<string[]>(() => {
    const saved = localStorage.getItem('saloniq_custom_categories');
    return saved ? JSON.parse(saved) : [];
  });

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStyle, setEditingStyle] = useState<StyleItem | null>(null);

  // Form state
  const [imageMode, setImageMode] = useState<'single' | 'before_after'>('before_after');
  const [isCustomCategoryMode, setIsCustomCategoryMode] = useState(false);
  const [customCategoryInput, setCustomCategoryInput] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    category: 'Colour',
    price: 499,
    serviceId: '1',
    beforeImage: '',
    afterImage: '',
    description: ''
  });

  const allCategories = Array.from(new Set([...DEFAULT_CATEGORIES, ...customCategoryList, ...styles.map(s => s.category).filter(Boolean)]));

  const resetForm = () => {
    setEditingStyle(null);
    setImageMode('before_after');
    setIsCustomCategoryMode(false);
    setCustomCategoryInput('');
    setFormData({
      title: '',
      category: allCategories[0] || 'Colour',
      price: 499,
      serviceId: services[0]?.id || '1',
      beforeImage: '',
      afterImage: '',
      description: ''
    });
  };

  const handleOpenAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (style: StyleItem) => {
    setEditingStyle(style);
    setImageMode(style.imageMode || (style.beforeImage ? 'before_after' : 'single'));
    setIsCustomCategoryMode(!allCategories.includes(style.category));
    setCustomCategoryInput(!allCategories.includes(style.category) ? style.category : '');
    setFormData({
      title: style.title,
      category: style.category,
      price: style.price,
      serviceId: style.serviceId || '1',
      beforeImage: style.beforeImage || '',
      afterImage: style.afterImage || style.beforeImage || '',
      description: style.description
    });
    setIsModalOpen(true);
  };

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>, targetField: 'beforeImage' | 'afterImage') => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image file must be smaller than 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const resultStr = event.target?.result as string;
          setFormData(prev => ({
            ...prev,
            [targetField]: resultStr,
            // If single mode, keep both synced for fallback
            ...(imageMode === 'single' ? { beforeImage: resultStr, afterImage: resultStr } : {})
          }));
          toast.success(`Photo uploaded!`);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Please enter a style title.');
      return;
    }

    const finalCategory = isCustomCategoryMode
      ? customCategoryInput.trim()
      : formData.category;

    if (!finalCategory) {
      toast.error('Please select or enter a category.');
      return;
    }

    if (imageMode === 'single') {
      const singleImg = formData.afterImage || formData.beforeImage;
      if (!singleImg) {
        toast.error('Please upload or provide a photo for the style.');
        return;
      }
    } else {
      if (!formData.beforeImage || !formData.afterImage) {
        toast.error('Please upload both Before and After photos for the transformation.');
        return;
      }
    }

    // Save custom category if new
    if (isCustomCategoryMode && customCategoryInput.trim()) {
      const newCat = customCategoryInput.trim();
      if (!customCategoryList.includes(newCat)) {
        const updatedList = [...customCategoryList, newCat];
        setCustomCategoryList(updatedList);
        localStorage.setItem('saloniq_custom_categories', JSON.stringify(updatedList));
      }
    }

    const payload = {
      ...formData,
      category: finalCategory,
      imageMode,
      beforeImage: imageMode === 'single' ? (formData.afterImage || formData.beforeImage) : formData.beforeImage,
      afterImage: imageMode === 'single' ? (formData.afterImage || formData.beforeImage) : formData.afterImage,
    };

    if (editingStyle) {
      updateStyle(editingStyle.id, payload);
      toast.success('Style showcase item updated successfully!');
    } else {
      addStyle(payload);
      toast.success('New style showcase item published to public portal!');
    }

    setIsModalOpen(false);
    resetForm();
  };

  const handleDelete = (style: StyleItem) => {
    if (window.confirm(`Are you sure you want to delete "${style.title}" from public showcase?`)) {
      deleteStyle(style.id);
      toast.success(`Deleted "${style.title}"`);
    }
  };

  const filteredStyles = styles.filter(s => {
    const matchesSearch = s.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategoryFilter === 'All' || s.category === selectedCategoryFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2.5">
            <Sparkles className="h-7 w-7 text-primary" />
            Public Styles Showcase
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Upload and publish hairstyle photos and Before & After transformations to the public customer portal.
          </p>
        </div>

        <Button 
          onClick={handleOpenAddModal}
          className="bg-primary text-primary-foreground font-bold shadow-md hover:opacity-95"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add New Style
        </Button>
      </div>

      {/* Filters Bar */}
      <Card className="bg-card/50 dark:bg-card border-2 border-slate-300 dark:border-slate-700 shadow-sm">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search style title or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1">
              {['All', ...allCategories].map((cat) => (
                <Badge
                  key={cat}
                  variant={selectedCategoryFilter === cat ? "default" : "outline"}
                  className="cursor-pointer px-3 py-1 text-xs font-semibold whitespace-nowrap"
                  onClick={() => setSelectedCategoryFilter(cat)}
                >
                  {cat}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Styles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {filteredStyles.map((style) => {
          const isSingle = style.imageMode === 'single' || !style.beforeImage || style.beforeImage === style.afterImage;

          return (
            <Card key={style.id} className="bg-card/50 dark:bg-card border-2 border-slate-300 dark:border-slate-700 shadow-md hover:shadow-lg transition-all overflow-hidden flex flex-col justify-between">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-bold">{style.title}</CardTitle>
                    <CardDescription className="text-xs">
                      Category: <span className="font-semibold text-foreground">{style.category}</span>
                    </CardDescription>
                  </div>
                  <Badge className="bg-primary text-white font-bold">
                    ₹{style.price}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 flex-1 flex flex-col justify-between">
                {/* Image Display */}
                {isSingle ? (
                  <div className="relative rounded-2xl overflow-hidden bg-black/5 aspect-[16/10] border border-border/50">
                    <img src={style.afterImage || style.beforeImage} alt={style.title} className="w-full h-full object-cover" />
                    <span className="absolute top-2 right-2 px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-xs text-[10px] font-semibold text-white">
                      Style Photo
                    </span>
                  </div>
                ) : (
                  <div className="relative rounded-2xl overflow-hidden bg-black/5 aspect-[16/10] grid grid-cols-2 gap-1 p-1 border border-border/50">
                    <div className="relative h-full w-full overflow-hidden rounded-l-xl">
                      <img src={style.beforeImage} alt={`${style.title} before`} className="w-full h-full object-cover" />
                      <span className="absolute bottom-2 left-2 px-2.5 py-0.5 rounded bg-black/60 backdrop-blur-xs text-[10px] font-semibold text-white">
                        Before
                      </span>
                    </div>
                    <div className="relative h-full w-full overflow-hidden rounded-r-xl">
                      <img src={style.afterImage} alt={`${style.title} after`} className="w-full h-full object-cover" />
                      <span className="absolute bottom-2 left-2 px-2.5 py-0.5 rounded bg-primary text-[10px] font-semibold text-white shadow-xs">
                        After
                      </span>
                    </div>
                  </div>
                )}

                {style.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 italic">
                    "{style.description}"
                  </p>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-300 dark:border-slate-700 mt-auto">
                  <span className="text-xs text-muted-foreground font-semibold">
                    ❤️ {style.likes} Likes on Public Portal
                  </span>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenEditModal(style)}
                      className="h-8 text-xs font-semibold"
                    >
                      <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(style)}
                      className="h-8 text-xs font-semibold text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredStyles.length === 0 && (
        <Card className="bg-muted/20 border-2 border-dashed border-slate-300 dark:border-slate-700 text-center py-12">
          <CardContent>
            <Sparkles className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-3" />
            <p className="text-base font-bold">No style items found</p>
            <p className="text-xs text-muted-foreground mt-1">Click "Add New Style" above to publish your first hairstyle photo.</p>
          </CardContent>
        </Card>
      )}

      {/* Add / Edit Style Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              {editingStyle ? 'Edit Style Showcase' : 'Add New Style Showcase'}
            </DialogTitle>
            <DialogDescription>
              Upload hair style images or Before & After transformations to feature on the public customer portal.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="styleTitle">Style Title</Label>
              <Input
                id="styleTitle"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Caramel Balayage / Layered Haircut"
                required
              />
            </div>

            {/* Category Section with Custom Category Option */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                {isCustomCategoryMode ? (
                  <div className="space-y-1.5">
                    <Input
                      placeholder="Enter custom category name..."
                      value={customCategoryInput}
                      onChange={(e) => setCustomCategoryInput(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setIsCustomCategoryMode(false)}
                      className="text-[11px] text-primary hover:underline font-semibold"
                    >
                      ← Select existing category
                    </button>
                  </div>
                ) : (
                  <Select
                    value={formData.category}
                    onValueChange={(val) => {
                      if (val === '__custom__') {
                        setIsCustomCategoryMode(true);
                      } else {
                        setFormData({ ...formData, category: val });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {allCategories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                      <SelectItem value="__custom__" className="font-bold text-primary">
                        + Add Custom Category...
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Service Price (₹)</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) || 0 })}
                  placeholder="1299"
                  required
                />
              </div>
            </div>

            {/* Image Mode Switcher: Single Style Photo vs Before & After */}
            <div className="space-y-3 pt-2 border-t">
              <Label className="font-bold block">Upload Format</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setImageMode('single')}
                  className={`p-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 transition-all ${
                    imageMode === 'single'
                      ? 'bg-primary/10 border-primary text-primary shadow-xs'
                      : 'bg-muted/30 border-border text-muted-foreground hover:bg-muted/50'
                  }`}
                >
                  <Camera className="h-4 w-4" />
                  Single Style Photo
                </button>
                <button
                  type="button"
                  onClick={() => setImageMode('before_after')}
                  className={`p-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 transition-all ${
                    imageMode === 'before_after'
                      ? 'bg-primary/10 border-primary text-primary shadow-xs'
                      : 'bg-muted/30 border-border text-muted-foreground hover:bg-muted/50'
                  }`}
                >
                  <Layers className="h-4 w-4" />
                  Before & After Transformation
                </button>
              </div>
            </div>

            {/* Image Upload Area based on Selected Mode */}
            {imageMode === 'single' ? (
              <div className="space-y-2">
                <Label className="font-bold flex items-center justify-between">
                  <span>Style Photo</span>
                  <span className="text-[11px] font-normal text-muted-foreground">Upload or Paste URL</span>
                </Label>

                <div className="relative aspect-[16/9] rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-muted/20 flex flex-col items-center justify-center overflow-hidden p-2 text-center">
                  {(formData.afterImage || formData.beforeImage) ? (
                    <div className="relative w-full h-full">
                      <img src={formData.afterImage || formData.beforeImage} alt="Style preview" className="w-full h-full object-cover rounded-xl" />
                      <Button
                        type="button"
                        size="icon"
                        variant="destructive"
                        className="absolute top-2 right-2 h-7 w-7 rounded-full"
                        onClick={() => setFormData(prev => ({ ...prev, beforeImage: '', afterImage: '' }))}
                      >
                        ×
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2 p-4">
                      <Camera className="h-10 w-10 mx-auto text-muted-foreground opacity-60" />
                      <p className="text-xs font-medium text-muted-foreground">Click to upload hairstyle photo</p>
                      <input
                        type="file"
                        accept="image/*"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={(e) => handleImageFileUpload(e, 'afterImage')}
                      />
                    </div>
                  )}
                </div>

                <Input
                  placeholder="Or paste image URL..."
                  value={formData.afterImage || formData.beforeImage}
                  onChange={(e) => setFormData({ ...formData, beforeImage: e.target.value, afterImage: e.target.value })}
                  className="text-xs h-9"
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {/* BEFORE Image Upload */}
                <div className="space-y-2">
                  <Label className="font-bold flex items-center justify-between">
                    <span>1. Before Photo</span>
                    <span className="text-[11px] font-normal text-muted-foreground">Upload or Paste URL</span>
                  </Label>
                  
                  <div className="relative aspect-square rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-muted/20 flex flex-col items-center justify-center overflow-hidden p-2 text-center">
                    {formData.beforeImage ? (
                      <div className="relative w-full h-full">
                        <img src={formData.beforeImage} alt="Before preview" className="w-full h-full object-cover rounded-xl" />
                        <Button
                          type="button"
                          size="icon"
                          variant="destructive"
                          className="absolute top-1 right-1 h-6 w-6 rounded-full"
                          onClick={() => setFormData(prev => ({ ...prev, beforeImage: '' }))}
                        >
                          ×
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2 p-2">
                        <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground opacity-60" />
                        <p className="text-[11px] text-muted-foreground">Click to upload photo</p>
                        <input
                          type="file"
                          accept="image/*"
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          onChange={(e) => handleImageFileUpload(e, 'beforeImage')}
                        />
                      </div>
                    )}
                  </div>

                  <Input
                    placeholder="Or paste image URL..."
                    value={formData.beforeImage}
                    onChange={(e) => setFormData({ ...formData, beforeImage: e.target.value })}
                    className="text-xs h-8"
                  />
                </div>

                {/* AFTER Image Upload */}
                <div className="space-y-2">
                  <Label className="font-bold flex items-center justify-between">
                    <span>2. After Photo</span>
                    <span className="text-[11px] font-normal text-muted-foreground">Upload or Paste URL</span>
                  </Label>

                  <div className="relative aspect-square rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-muted/20 flex flex-col items-center justify-center overflow-hidden p-2 text-center">
                    {formData.afterImage ? (
                      <div className="relative w-full h-full">
                        <img src={formData.afterImage} alt="After preview" className="w-full h-full object-cover rounded-xl" />
                        <Button
                          type="button"
                          size="icon"
                          variant="destructive"
                          className="absolute top-1 right-1 h-6 w-6 rounded-full"
                          onClick={() => setFormData(prev => ({ ...prev, afterImage: '' }))}
                        >
                          ×
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2 p-2">
                        <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground opacity-60" />
                        <p className="text-[11px] text-muted-foreground">Click to upload photo</p>
                        <input
                          type="file"
                          accept="image/*"
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          onChange={(e) => handleImageFileUpload(e, 'afterImage')}
                        />
                      </div>
                    )}
                  </div>

                  <Input
                    placeholder="Or paste image URL..."
                    value={formData.afterImage}
                    onChange={(e) => setFormData({ ...formData, afterImage: e.target.value })}
                    className="text-xs h-8"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="description">Style Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the haircut, coloring, or styling details..."
                rows={3}
              />
            </div>

            <DialogFooter className="pt-4 border-t flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-primary text-primary-foreground font-bold">
                {editingStyle ? 'Save Changes' : 'Publish Style'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

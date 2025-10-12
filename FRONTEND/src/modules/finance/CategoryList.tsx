// CategoryList.tsx - Fixed version
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import api from '../../lib/axios';
import { Category, CategoryType } from '@/types/finance';

type NewCategory = Omit<Category, 'id'>;

const CategoryList: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newCategory, setNewCategory] = useState<NewCategory>({
    name: '',
    type: 'EXPENSE',
  });

  useEffect(() => {
    let mounted = true;
    const fetchCategories = async () => {
      try {
        const response = await api.get<Category[]>('/api/finance/categories/');
        if (mounted) setCategories(response.data);
      } catch (error: any) {
        console.error('Failed to fetch categories', error);
        toast.error('Failed to load categories');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    
    fetchCategories();
    return () => { mounted = false; };
  }, []);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (creating) return;
    
    const trimmedName = newCategory.name.trim();
    if (!trimmedName) {
      toast.error('Category name is required');
      return;
    }

    setCreating(true);
    try {
      const response = await api.post<Category>('/api/finance/categories/', {
        name: trimmedName,
        type: newCategory.type,
      });
      setCategories(prev => [...prev, response.data]);
      setNewCategory({ name: '', type: 'EXPENSE' });
      toast.success('Category created successfully');
    } catch (error: any) {
      console.error('Failed to create category', error);
      if (error.response?.status === 400) {
        toast.error('Category name already exists');
      } else {
        toast.error('Failed to create category');
      }
    } finally {
      setCreating(false);
    }
  };

  const deleteCategory = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    try {
      await api.delete(`/api/finance/categories/${id}/`);
      setCategories(prev => prev.filter(c => c.id !== id));
      toast.success('Category deleted successfully');
    } catch (error: any) {
      console.error('Failed to delete category', error);
      if (error.response?.status === 400) {
        toast.error('Cannot delete category. It may be in use by transactions.');
      } else {
        toast.error('Failed to delete category');
      }
    }
  };

  if (loading) {
    return (
      <div>
        <h1 className="mb-6">Categories</h1>
        <Card className="mb-6">
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-32" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6">Categories</h1>

      {/* Add Category Form */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Add New Category</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateCategory} className="max-w-md space-y-4">
            <div className="space-y-2">
              <Label htmlFor="categoryName">Category Name</Label>
              <Input
                type="text"
                id="categoryName"
                value={newCategory.name}
                onChange={e => setNewCategory({ ...newCategory, name: e.target.value })}
                placeholder="Enter category name"
                required
                disabled={creating}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoryType">Type</Label>
              <Select 
                value={newCategory.type} 
                onValueChange={(value: CategoryType) => setNewCategory({ ...newCategory, type: value })}
                disabled={creating}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EXPENSE">Expense</SelectItem>
                  <SelectItem value="INCOME">Income</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button 
              type="submit" 
              disabled={creating || !newCategory.name.trim()}
            >
              {creating ? 'Adding...' : 'Add Category'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Categories List */}
      <Card>
        <CardHeader>
          <CardTitle>All Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground italic">
                    No categories yet
                  </TableCell>
                </TableRow>
              ) : (
                categories.map(category => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          category.type === 'INCOME' ? 'default' :
                          category.type === 'EXPENSE' ? 'destructive' : 'secondary'
                        }
                      >
                        {category.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteCategory(category.id)}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default CategoryList;
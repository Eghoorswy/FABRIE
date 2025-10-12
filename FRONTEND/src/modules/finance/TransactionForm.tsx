// TransactionForm.tsx (Fixed version)
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import api from '../../lib/axios';
import { Category, Transaction } from '@/types/finance';

const TransactionForm: React.FC = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [categoriesLoading, setCategoriesLoading] = useState(false);
    const [categoriesError, setCategoriesError] = useState<string | null>(null);
    const [transactionLoading, setTransactionLoading] = useState(false);
    const [transactionError, setTransactionError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        category: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        description: ''
    });
    const navigate = useNavigate();
    const { id } = useParams();

    useEffect(() => {
        fetchCategories();
        if (id) fetchTransaction();
    }, [id]);

    const fetchCategories = async () => {
        setCategoriesLoading(true);
        setCategoriesError(null);
        try {
            const response = await api.get<Category[]>('/api/finance/categories/');
            setCategories(response.data);
        } catch (error: any) {
            console.error('Failed to fetch categories:', error);
            setCategoriesError('Failed to load categories');
        } finally {
            setCategoriesLoading(false);
        }
    };

    const fetchTransaction = async () => {
        setTransactionLoading(true);
        setTransactionError(null);
        try {
            const response = await api.get<Transaction>(`/api/finance/transactions/${id}/`);
            const tx = response.data;
            setFormData({
                category: tx.category.toString(),
                amount: tx.amount,
                date: tx.date,
                description: tx.description
            });
        } catch (error: any) {
            console.error('Failed to fetch transaction:', error);
            setTransactionError('Failed to load transaction');
        } finally {
            setTransactionLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setTransactionError(null);
        
        if (!formData.category || !formData.amount) {
            setTransactionError('Category and amount are required');
            return;
        }

        try {
            const data = {
                ...formData,
                amount: formData.amount, // Keep as string - backend expects decimal string
                category: parseInt(formData.category)
            };
            
            if (id) {
                await api.put(`/api/finance/transactions/${id}/`, data);
                toast.success('Transaction updated successfully');
            } else {
                await api.post('/api/finance/transactions/', data);
                toast.success('Transaction created successfully');
            }
            navigate('/finance/transactions');
        } catch (error: any) {
            console.error('Failed to save transaction', error);
            const errorMsg = error.response?.data?.message || 
                           error.response?.data?.detail || 
                           'Failed to save transaction. Please try again.';
            setTransactionError(errorMsg);
            toast.error(errorMsg);
        }
    };

    return (
        <div>
            <h1 className="mb-6">{id ? 'Edit' : 'Add'} Transaction</h1>
            
            {(categoriesError || transactionError) && (
                <Alert variant="destructive" className="mb-6">
                    <AlertDescription>
                        {categoriesError || transactionError}
                    </AlertDescription>
                </Alert>
            )}
            
            <Card className="max-w-2xl">
                <CardHeader>
                    <CardTitle>{id ? 'Edit' : 'Add'} Transaction</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="category">Category *</Label>
                            <Select 
                                value={formData.category} 
                                onValueChange={(value) => setFormData({...formData, category: value})}
                                disabled={categoriesLoading || !!categoriesError}
                                required
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map(cat => (
                                        <SelectItem key={cat.id} value={cat.id.toString()}>
                                            {cat.name} ({cat.type})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="amount">Amount (NPR) *</Label>
                            <Input
                                id="amount"
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData.amount}
                                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                                placeholder="0.00"
                                required
                                disabled={transactionLoading}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="date">Date *</Label>
                            <Input
                                id="date"
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData({...formData, date: e.target.value})}
                                required
                                disabled={transactionLoading}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                                className="min-h-[100px]"
                                placeholder="Optional description"
                                disabled={transactionLoading}
                            />
                        </div>

                        <div className="flex gap-4">
                            <Button 
                                type="submit" 
                                disabled={categoriesLoading || !!categoriesError || transactionLoading || !formData.category || !formData.amount}
                            >
                                {transactionLoading ? 'Saving...' : (id ? 'Update' : 'Create')} Transaction
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => navigate('/finance/transactions')}
                                disabled={transactionLoading}
                            >
                                Cancel
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default TransactionForm;
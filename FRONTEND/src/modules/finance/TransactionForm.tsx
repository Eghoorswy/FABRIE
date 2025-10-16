import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Save, Plus } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/axios';
import { Category, Transaction, CreateTransactionData, UpdateTransactionData } from '@/types/finance';

const TransactionForm: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    category: '',
    amount: '',
    date: '',
    description: ''
  });

  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  // Format date for input (YYYY-MM-DD)
  const formatDateForInput = (dateString: string): string => {
    if (!dateString) return new Date().toISOString().split('T')[0];
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime())
        ? new Date().toISOString().split('T')[0]
        : date.toISOString().split('T')[0];
    } catch {
      return new Date().toISOString().split('T')[0];
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const categoriesResponse = await api.get<Category[]>('/api/finance/categories/');
        setCategories(categoriesResponse.data);

        if (id) {
          const transactionResponse = await api.get<Transaction>(`/api/finance/transactions/${id}/`);
          const tx = transactionResponse.data;

          setFormData({
            category: tx.category.toString(),
            amount: tx.amount.toString(),
            date: formatDateForInput(tx.date),
            description: tx.description || ''
          });
        } else {
          setFormData(prev => ({
            ...prev,
            date: new Date().toISOString().split('T')[0]
          }));
        }
      } catch (error: any) {
        console.error('Failed to fetch data:', error);
        const errorMsg = error.response?.data?.message || 'Failed to load form data';
        setError(errorMsg);
        toast.error(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.category || !formData.amount || !formData.date) {
      setError('Please fill in all required fields');
      return;
    }

    const amountValue = parseFloat(formData.amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      setError('Amount must be a valid number greater than 0');
      return;
    }

    setSubmitting(true);
    try {
      // ✅ Unified payload type for both create & update
      const payload: CreateTransactionData | UpdateTransactionData = {
        category: parseInt(formData.category),
        amount: amountValue.toFixed(2),
        date: formData.date,
        description: formData.description.trim() || ''
      };

      console.log('Submitting payload:', payload);

      if (isEditing) {
        await api.put(`/api/finance/transactions/${id}/`, payload);
        toast.success('Transaction updated successfully');
      } else {
        await api.post('/api/finance/transactions/', payload);
        toast.success('Transaction created successfully');
      }

      navigate('/finance/transactions');
    } catch (error: any) {
      console.error('Failed to save transaction:', error);
      const errorMsg =
        error.response?.data?.message ||
        error.response?.data?.detail ||
        error.response?.data?.error ||
        'Failed to save transaction. Please try again.';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const selectedCategoryType = categories.find(
    cat => cat.id.toString() === formData.category
  )?.type;

  if (loading) {
    return <TransactionFormSkeleton isEditing={isEditing} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/finance/transactions')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Transactions
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isEditing ? 'Edit Transaction' : 'Add New Transaction'}
          </h1>
          <p className="text-muted-foreground">
            {isEditing ? 'Update transaction details' : 'Record a new income or expense'}
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Transaction Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">
                      Category *
                      {selectedCategoryType && (
                        <span
                          className={`ml-2 text-xs ${
                            selectedCategoryType === 'INCOME'
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}
                        >
                          ({selectedCategoryType})
                        </span>
                      )}
                    </Label>
                    <Select
                      value={formData.category}
                      onValueChange={value => handleInputChange('category', value)}
                      disabled={submitting}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat.id} value={cat.id.toString()}>
                            <div className="flex items-center gap-2">
                              <span>{cat.name}</span>
                              <span
                                className={`text-xs px-2 py-1 rounded ${
                                  cat.type === 'INCOME'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {cat.type}
                              </span>
                            </div>
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
                      min="0.01"
                      value={formData.amount}
                      onChange={e => handleInputChange('amount', e.target.value)}
                      placeholder="0.00"
                      required
                      disabled={submitting}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={e => handleInputChange('date', e.target.value)}
                    required
                    disabled={submitting}
                  />
                  {formData.date && (
                    <p className="text-xs text-muted-foreground">
                      Selected: {new Date(formData.date).toLocaleDateString()}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={e => handleInputChange('description', e.target.value)}
                    className="min-h-[100px]"
                    placeholder="Enter transaction description (optional)"
                    disabled={submitting}
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <Button
                    type="submit"
                    disabled={
                      submitting ||
                      !formData.category ||
                      !formData.amount ||
                      !formData.date
                    }
                    className="min-w-32"
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        {isEditing ? 'Updating...' : 'Creating...'}
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        {isEditing ? 'Update Transaction' : 'Create Transaction'}
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/finance/transactions')}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" asChild className="w-full justify-start">
                <Link to="/finance/categories">
                  <Plus className="mr-2 h-4 w-4" />
                  Manage Categories
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full justify-start">
                <Link to="/finance/transactions">View All Transactions</Link>
              </Button>
            </CardContent>
          </Card>

          {selectedCategoryType && (
            <Card>
              <CardHeader>
                <CardTitle>Transaction Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className={`p-3 rounded-lg text-center ${
                    selectedCategoryType === 'INCOME'
                      ? 'bg-green-50 text-green-800 border border-green-200'
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}
                >
                  <div className="font-semibold">{selectedCategoryType}</div>
                  <div className="text-sm mt-1">
                    {selectedCategoryType === 'INCOME'
                      ? 'This transaction will increase your total income'
                      : 'This transaction will increase your total expenses'}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

// ✅ Skeleton Loader Component
const TransactionFormSkeleton: React.FC<{ isEditing: boolean }> = ({ isEditing }) => (
  <div className="space-y-6">
    <div className="flex items-center gap-4">
      <Skeleton className="h-10 w-32" />
      <div>
        <Skeleton className="h-8 w-40 mb-2" />
        <Skeleton className="h-4 w-60" />
      </div>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-10 w-32" />
          </CardContent>
        </Card>
      </div>
      <div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-10 w-full mb-2" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
);

export default TransactionForm;

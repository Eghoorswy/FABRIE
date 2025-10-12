// TransactionList.tsx - Fixed version
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import api from '../../lib/axios';
import { Transaction, Category, CategoryType } from '@/types/finance';
import { formatCurrency, formatDate } from '@/lib/utils';

const TransactionList: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch both categories and transactions in parallel
        const [categoriesResponse, transactionsResponse] = await Promise.all([
          api.get<Category[]>('/api/finance/categories/', { signal: controller.signal }),
          api.get<Transaction[]>('/api/finance/transactions/', { signal: controller.signal })
        ]);
        
        if (!mounted) return;
        
        setCategories(categoriesResponse.data);
        setTransactions(transactionsResponse.data);
      } catch (error: any) {
        if (mounted && error.name !== 'CanceledError' && error.code !== 'ERR_CANCELED') {
          console.error('Failed to fetch data', error);
          toast.error('Failed to load transactions');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchData();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, []);

  const filteredTransactions = selectedCategory
    ? transactions.filter(tx => tx.category.toString() === selectedCategory)
    : transactions;

  const deleteTransaction = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) return;
    try {
      await api.delete(`/api/finance/transactions/${id}/`);
      setTransactions(prev => prev.filter(t => t.id !== id));
      toast.success('Transaction deleted successfully');
    } catch (error: any) {
      console.error('Failed to delete transaction', error);
      toast.error('Failed to delete transaction. Please try again.');
    }
  };

  // Loading skeleton
  if (loading) {
    return <TransactionListSkeleton />;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="mb-0">Transactions</h1>
        <Button asChild>
          <Link to="/finance/transactions/new">Add Transaction</Link>
        </Button>
      </div>

      <CategoryFilter 
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />

      <TransactionsTable
        transactions={filteredTransactions}
        onDelete={deleteTransaction}
      />
    </div>
  );
};

// Sub-components for better organization
const TransactionListSkeleton: React.FC = () => (
  <div>
    <div className="flex justify-between items-center mb-6">
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-10 w-36" />
    </div>
    <Card className="mb-6">
      <CardHeader>
        <Skeleton className="h-6 w-40" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-4 w-32 mb-2" />
        <Skeleton className="h-10 w-64" />
      </CardContent>
    </Card>
    <Card>
      <CardContent className="p-0">
        <div className="space-y-4 p-6">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  </div>
);

interface CategoryFilterProps {
  categories: Category[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({ 
  categories, 
  selectedCategory, 
  onCategoryChange 
}) => (
  <Card className="mb-6">
    <CardHeader>
      <CardTitle>Filter Transactions</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="max-w-sm space-y-2">
        <Label htmlFor="categoryFilter">Filter by Category</Label>
        <Select 
          value={selectedCategory || "all"} 
          onValueChange={(value) => onCategoryChange(value === "all" ? "" : value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(category => (
              <SelectItem key={category.id} value={category.id.toString()}>
                {category.name} ({category.type})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </CardContent>
  </Card>
);

interface TransactionsTableProps {
  transactions: Transaction[];
  onDelete: (id: number) => void;
}

const TransactionsTable: React.FC<TransactionsTableProps> = ({ 
  transactions, 
  onDelete 
}) => (
  <Card>
    <CardContent className="p-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground italic">
                No transactions found
              </TableCell>
            </TableRow>
          ) : (
            transactions.map(tx => (
              <TableRow key={tx.id}>
                <TableCell>{formatDate(tx.date)}</TableCell>
                <TableCell>{tx.category_name}</TableCell>
                <TableCell>{tx.description || '-'}</TableCell>
                <TableCell className={`font-medium ${
                  tx.category_type === 'INCOME' ? 'text-green-600' :
                  tx.category_type === 'EXPENSE' ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {formatCurrency(tx.amount)}
                </TableCell>
                <TableCell>
                  <Badge variant={
                    tx.category_type === 'INCOME' ? 'default' :
                    tx.category_type === 'EXPENSE' ? 'destructive' : 'secondary'
                  }>
                    {tx.category_type}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/finance/transactions/${tx.id}/edit`}>
                        Edit
                      </Link>
                    </Button>
                    <Button 
                      variant="destructive"
                      size="sm"
                      onClick={() => onDelete(tx.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </CardContent>
  </Card>
);

export default TransactionList;
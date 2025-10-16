import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, DollarSign, Calendar, RefreshCw } from 'lucide-react';
import api from '@/lib/axios';
import { FinanceReport, Transaction } from '@/types/finance';
import { formatCurrency, formatDate } from '@/lib/utils';

const FinanceHome: React.FC = () => {
  const [report, setReport] = useState<FinanceReport | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    let mounted = true;
    const controller = new AbortController();

    try {
      setLoading(true);
      setError(null);
      
      const [reportResponse, transactionsResponse] = await Promise.all([
        api.get<FinanceReport>('/api/finance/report/', { 
          signal: controller.signal 
        }),
        api.get<Transaction[]>('/api/finance/transactions/', { 
          signal: controller.signal,
          params: { limit: 5 }
        })
      ]);
      
      if (!mounted) return;
      
      setReport(reportResponse.data);
      setRecentTransactions(transactionsResponse.data.slice(0, 5));
    } catch (error: any) {
      if (mounted && error.name !== 'CanceledError' && error.code !== 'ERR_CANCELED') {
        console.error('Failed to fetch finance data', error);
        setError('Failed to load financial data. Please try again.');
      }
    } finally {
      if (mounted) setLoading(false);
    }

    return () => {
      mounted = false;
      controller.abort();
    };
  }, []);

  const handleRetry = useCallback(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return <FinanceHomeSkeleton />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Financial Overview</h1>
            <p className="text-muted-foreground">Manage your income and expenses</p>
          </div>
        </div>

        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        
        <div className="flex gap-4">
          <Button onClick={handleRetry}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
          <Button variant="outline" asChild>
            <Link to="/finance/transactions">
              Go to Transactions
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const netProfit = parseFloat(report?.net_profit || '0');
  const isProfitPositive = netProfit >= 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financial Overview</h1>
          <p className="text-muted-foreground">Manage your income and expenses</p>
        </div>
        <Button asChild>
          <Link to="/finance/transactions/new">
            Add Transaction
          </Link>
        </Button>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Income"
          value={formatCurrency(report?.total_income || '0')}
          description="All incoming funds"
          icon={TrendingUp}
          className="text-green-600"
        />
        <StatCard
          title="Total Expenses"
          value={formatCurrency(report?.total_expenses || '0')}
          description="All outgoing funds"
          icon={TrendingDown}
          className="text-red-600"
        />
        <StatCard
          title="Net Profit"
          value={formatCurrency(report?.net_profit || '0')}
          description={isProfitPositive ? 'Profit' : 'Loss'}
          icon={DollarSign}
          className={isProfitPositive ? 'text-green-600' : 'text-red-600'}
        />
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Transactions</CardTitle>
          <Button variant="outline" size="sm" asChild>
            <Link to="/finance/transactions">
              View All
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <TransactionList transactions={recentTransactions} />
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <QuickActionsCard />
        <CategoriesCard />
      </div>
    </div>
  );
};

// Sub-components
interface StatCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  className = "" 
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className={`text-2xl font-bold ${className}`}>{value}</div>
      <p className="text-xs text-muted-foreground mt-1">{description}</p>
    </CardContent>
  </Card>
);

interface TransactionListProps {
  transactions: Transaction[];
}

const TransactionList: React.FC<TransactionListProps> = ({ transactions }) => {
  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="font-medium">No transactions yet</p>
        <p className="text-sm mt-1">Get started by adding your first transaction</p>
        <Button asChild className="mt-4">
          <Link to="/finance/transactions/new">
            Add Transaction
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {transactions.map((transaction) => (
        <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center space-x-4">
            <div className={`p-2 rounded-full ${
              transaction.category_type === 'INCOME' 
                ? 'bg-green-100 text-green-600' 
                : 'bg-red-100 text-red-600'
            }`}>
              {transaction.category_type === 'INCOME' ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
            </div>
            <div>
              <p className="font-medium">{transaction.category_name}</p>
              <p className="text-sm text-muted-foreground">
                {transaction.description || 'No description'}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDate(transaction.date)}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className={`font-semibold ${
              transaction.category_type === 'INCOME' 
                ? 'text-green-600' 
                : 'text-red-600'
            }`}>
              {formatCurrency(transaction.amount)}
            </p>
            <Badge 
              variant={transaction.category_type === 'INCOME' ? 'default' : 'destructive'}
              className="mt-1"
            >
              {transaction.category_type}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  );
};

const QuickActionsCard: React.FC = () => (
  <Card>
    <CardHeader>
      <CardTitle>Quick Actions</CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      <Button asChild className="w-full justify-start">
        <Link to="/finance/transactions/new">
          Add New Transaction
        </Link>
      </Button>
      <Button variant="outline" asChild className="w-full justify-start">
        <Link to="/finance/transactions">
          View All Transactions
        </Link>
      </Button>
    </CardContent>
  </Card>
);

const CategoriesCard: React.FC = () => (
  <Card>
    <CardHeader>
      <CardTitle>Categories</CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      <Button variant="outline" asChild className="w-full justify-start">
        <Link to="/finance/categories">
          Manage Categories
        </Link>
      </Button>
      <p className="text-sm text-muted-foreground">
        Organize your transactions with custom categories
      </p>
    </CardContent>
  </Card>
);

const FinanceHomeSkeleton: React.FC = () => (
  <div className="space-y-6">
    <div className="flex justify-between items-center">
      <div>
        <Skeleton className="h-8 w-40 mb-2" />
        <Skeleton className="h-4 w-60" />
      </div>
      <Skeleton className="h-10 w-32" />
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[1, 2, 3].map(i => (
        <Card key={i}>
          <CardContent className="p-6">
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-8 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>

    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-40" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  </div>
);

export default FinanceHome;
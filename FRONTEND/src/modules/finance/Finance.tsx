import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { FinanceSkeleton } from './components/FinanceSkeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import api from '@/lib/axios';
import { FinanceReport, Transaction } from '@/types/finance';
import { formatCurrency, formatDate } from '@/lib/utils';

const Finance: React.FC = () => {
  const [report, setReport] = useState<FinanceReport | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCounter, setRetryCounter] = useState(0);

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch both report and recent transactions in parallel
        const [reportResponse, transactionsResponse] = await Promise.all([
          api.get<FinanceReport>('/finance/report/', { signal: controller.signal }),
          api.get<Transaction[]>('/finance/transactions/', { 
            signal: controller.signal,
            params: { limit: 5 } // Get only 5 most recent transactions
          })
        ]);
        
        if (!mounted) return;
        
        setReport(reportResponse.data);
        // Take only the first 5 transactions (most recent due to backend ordering)
        setRecentTransactions(transactionsResponse.data.slice(0, 5));
      } catch (error: any) {
        if (mounted && error.name !== 'CanceledError' && error.code !== 'ERR_CANCELED') {
          console.error('Failed to fetch finance data', error);
          setError('Failed to load financial data');
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
  }, [retryCounter]);

  const handleRetry = () => {
    setRetryCounter((prev) => prev + 1);
  };

  if (loading) {
    return <FinanceSkeleton />;
  }

  if (error) {
    return (
      <div>
        <h1 className="mb-6">Finance Dashboard</h1>
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={handleRetry} disabled={loading}>
          {loading ? 'Retrying...' : 'Retry'}
        </Button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6">Finance Dashboard</h1>
      
      {/* Financial summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm text-muted-foreground mb-2">Total Income</h3>
            <p className="text-green-600 text-2xl font-semibold">
              {formatCurrency(report?.total_income || '0')}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm text-muted-foreground mb-2">Total Expenses</h3>
            <p className="text-red-600 text-2xl font-semibold">
              {formatCurrency(report?.total_expenses || '0')}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm text-muted-foreground mb-2">Net Profit</h3>
            <p className={`text-2xl font-semibold ${
              parseFloat(report?.net_profit || '0') >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatCurrency(report?.net_profit || '0')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent transactions table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Transactions</CardTitle>
          <Button asChild variant="outline" size="sm">
            <Link to="/finance/transactions">View All</Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Type</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground italic py-8">
                    No transactions found
                  </TableCell>
                </TableRow>
              ) : (
                recentTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{formatDate(transaction.date)}</TableCell>
                    <TableCell>{transaction.category_name}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {transaction.description || '-'}
                    </TableCell>
                    <TableCell className={
                      transaction.category_type === 'INCOME' 
                        ? 'text-green-600 font-medium' 
                        : 'text-red-600 font-medium'
                    }>
                      {formatCurrency(transaction.amount)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        transaction.category_type === 'INCOME' 
                          ? 'default' 
                          : 'destructive'
                      }>
                        {transaction.category_type}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button asChild>
              <Link to="/finance/transactions/new">
                Add New Transaction
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/finance/categories">
                Manage Categories
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/finance/transactions">
                View All Transactions
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Finance;
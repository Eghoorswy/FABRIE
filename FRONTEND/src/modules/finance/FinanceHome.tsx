// FinanceHome.tsx - Fixed version
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import api from '../../lib/axios';
import { FinanceReport } from '@/types/finance';
import { formatCurrency } from '@/lib/utils';

const FinanceHome: React.FC = () => {
  const [report, setReport] = useState<FinanceReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let controller: AbortController | null = null;
    
    const fetchReport = async () => {
      try {
        controller = new AbortController();
        const response = await api.get<FinanceReport>('/api/finance/report/', {
          signal: controller.signal
        });
        if (mounted) {
          setReport(response.data);
        }
      } catch (error: any) {
        if (mounted && error.name !== 'CanceledError' && error.code !== 'ERR_CANCELED') {
          console.error('Failed to fetch finance report', error);
          setError('Failed to load financial report');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchReport();
    
    return () => {
      mounted = false;
      if (controller) {
        controller.abort();
      }
    };
  }, []);

  if (loading) {
    return (
      <div>
        <h1 className="mb-6">Financial Overview</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
          <CardContent className="p-6">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="flex gap-4">
              <Skeleton className="h-10 w-40" />
              <Skeleton className="h-10 w-36" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1 className="mb-6">Financial Overview</h1>
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Card>
          <CardContent className="p-6">
            <div className="flex gap-4">
              <Button asChild>
                <Link to="/finance/transactions">
                  Manage Transactions
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/finance/categories">
                  Manage Categories
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6">Financial Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground mb-2">Total Income</div>
            <div className="text-2xl font-semibold text-green-600">
              {formatCurrency(report?.total_income || '0')}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground mb-2">Total Expenses</div>
            <div className="text-2xl font-semibold text-red-600">
              {formatCurrency(report?.total_expenses || '0')}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground mb-2">Net Profit</div>
            <div className={`text-2xl font-semibold ${parseFloat(report?.net_profit || '0') >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(report?.net_profit || '0')}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button asChild>
              <Link to="/finance/transactions">
                Manage Transactions
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/finance/categories">
                Manage Categories
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinanceHome;
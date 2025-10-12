from django.test import TestCase
from django.utils import timezone
from .models import Category, Transaction

class FinanceReportTests(TestCase):
    def setUp(self):
        self.income_category = Category.objects.create(
            name="Sales", type="INCOME"
        )
        self.expense_category = Category.objects.create(
            name="Supplies", type="EXPENSE"
        )

    def test_finance_report(self):
        # Create test transactions
        Transaction.objects.create(
            category=self.income_category,
            amount=1000,
            description="Test sale"
        )
        Transaction.objects.create(
            category=self.expense_category,
            amount=200,
            description="Test purchase"
        )
        
        response = self.client.get('/api/finance/report/')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['total_income'], 1000)
        self.assertEqual(data['total_expenses'], 200)
        self.assertEqual(data['net_profit'], 800)        

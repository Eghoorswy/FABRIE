# finance/views.py (updated permissions)
from decimal import Decimal, ROUND_HALF_UP

from django.db.models import Sum, Q, F
from django.utils.dateparse import parse_date

from rest_framework import viewsets
from rest_framework.decorators import api_view
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response

from finance.models import Category, Transaction
from finance.serializers import CategorySerializer, TransactionSerializer


def quantize_2(x: Decimal) -> Decimal:
    """Ensure decimals are consistently two places for JSON responses."""
    return (x or Decimal("0")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def parse_date_range(start_str: str, end_str: str):
    """Parse and validate date range from query params."""
    start_str = start_str if start_str and start_str.strip() else None
    end_str = end_str if end_str and end_str.strip() else None

    start = parse_date(start_str) if start_str else None
    end = parse_date(end_str) if end_str else None

    if start_str and not start:
        raise ValidationError({"start_date": "Invalid date format. Use YYYY-MM-DD."})
    if end_str and not end:
        raise ValidationError({"end_date": "Invalid date format. Use YYYY-MM-DD."})
    if start and end and start > end:
        raise ValidationError({"detail": "start_date must be <= end_date."})

    return start, end


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]


class TransactionViewSet(viewsets.ModelViewSet):
    queryset = Transaction.objects.select_related("category").all().order_by("-date")
    serializer_class = TransactionSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        qs = super().get_queryset()

        if getattr(self, "action", None) != "list":
            return qs

        start_str = self.request.query_params.get("start_date")
        end_str = self.request.query_params.get("end_date")
        start, end = parse_date_range(start_str, end_str)

        if start:
            qs = qs.filter(date__gte=start)
        if end:
            qs = qs.filter(date__lte=end)

        return qs


@api_view(["GET"])
def finance_report(request):
    start_str = request.GET.get("start_date")
    end_str = request.GET.get("end_date")
    start, end = parse_date_range(start_str, end_str)

    transactions = Transaction.objects.all()
    if start:
        transactions = transactions.filter(date__gte=start)
    if end:
        transactions = transactions.filter(date__lte=end)

    agg = transactions.aggregate(
        income=Sum("amount", filter=Q(category__type="INCOME")),
        expenses=Sum("amount", filter=Q(category__type="EXPENSE")),
    )
    income = quantize_2(agg["income"])
    expenses = quantize_2(agg["expenses"])
    profit = quantize_2(income - expenses)

    category_breakdown_qs = (
        transactions
        .annotate(
            category_name=F("category__name"),
            category_type=F("category__type"),
        )
        .values("category_name", "category_type")
        .annotate(total_amount=Sum("amount"))
        .order_by("-category_type", "-total_amount")
    )

    category_breakdown = [
        {
            "category_name": c["category_name"],
            "category_type": c["category_type"],
            "total_amount": quantize_2(c["total_amount"]),
        }
        for c in category_breakdown_qs
    ]

    return Response({
        "total_income": income,
        "total_expenses": expenses,
        "net_profit": profit,
        "category_breakdown": category_breakdown,
        "time_period": {
            "start_date": start.isoformat() if start else None,
            "end_date": end.isoformat() if end else None,
        },
    })
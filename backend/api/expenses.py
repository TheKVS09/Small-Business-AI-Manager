from datetime import datetime, timedelta

from fastapi import APIRouter, Query

from .database import db


router = APIRouter(prefix="/api/expenses", tags=["Expenses"])

expenses = db["expenses"]


def get_date_range(period: str):
    end_date = datetime.now()

    if period == "7":
        start_date = end_date - timedelta(days=7)

    elif period == "30":
        start_date = end_date - timedelta(days=30)

    elif period == "6months":
        start_date = end_date - timedelta(days=180)

    elif period == "year":
        start_date = end_date - timedelta(days=365)

    else:
        start_date = end_date - timedelta(days=7)

    return start_date, end_date


def serialize_expense(expense):
    return {
        "expense_id": expense.get("expense_id"),
        "date": (
            expense["date"].isoformat()
            if isinstance(expense.get("date"), datetime)
            else expense.get("date")
        ),
        "description": expense.get("description"),
        "category": expense.get("category"),
        "recurring": expense.get("recurring", False),
        "amount": float(expense.get("amount", 0)),
    }


# ============================================================
# GET EXPENSES
# ============================================================

@router.get("")
def get_expenses(
    limit: int = Query(100, ge=1, le=500)
):
    recent_expenses = list(
        expenses.find(
            {},
            {"_id": 0}
        )
        .sort("date", -1)
        .limit(limit)
    )

    return [
        serialize_expense(expense)
        for expense in recent_expenses
    ]


# ============================================================
# EXPENSE SUMMARY
# ============================================================

@router.get("/summary")
def expense_summary():
    all_expenses = list(
        expenses.find(
            {},
            {"_id": 0}
        )
    )

    total_expenses = sum(
        float(expense.get("amount", 0))
        for expense in all_expenses
    )

    total_transactions = len(all_expenses)

    average_expense = (
        total_expenses / total_transactions
        if total_transactions
        else 0
    )

    # Current month
    now = datetime.now()

    this_month_expenses = 0

    for expense in all_expenses:

        expense_date = expense.get("date")

        if not isinstance(expense_date, datetime):
            continue

        if (
            expense_date.month == now.month
            and expense_date.year == now.year
        ):
            this_month_expenses += float(
                expense.get("amount", 0)
            )

    return {
        "total_expenses": round(total_expenses, 2),
        "this_month": round(this_month_expenses, 2),
        "total_transactions": total_transactions,
        "average_expense": round(average_expense, 2),
    }
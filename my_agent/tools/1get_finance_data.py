from ..database import db
from datetime import datetime, timedelta


def get_finance_data(days: int = 30) -> dict:
    """Retrieve financial performance for the specified number of days."""

    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)

    # -----------------------------
    # ORDERS / REVENUE
    # -----------------------------

    orders = list(
        db["orders"].find(
            {
                "order_date": {
                    "$gte": start_date,
                    "$lte": end_date
                }
            },
            {"_id": 0}
        )
    )

    completed_orders = [
        order
        for order in orders
        if order["status"] == "Completed"
    ]

    refunded_orders = [
        order
        for order in orders
        if order["status"] == "Refunded"
    ]

    cancelled_orders = [
        order
        for order in orders
        if order["status"] == "Cancelled"
    ]

    revenue = sum(
        order["total_amount"]
        for order in completed_orders
    )

    refunded_amount = sum(
        order["total_amount"]
        for order in refunded_orders
    )

    # -----------------------------
    # EXPENSES
    # -----------------------------

    expenses = list(
        db["expenses"].find(
            {
                "date": {
                    "$gte": start_date,
                    "$lte": end_date
                }
            },
            {"_id": 0}
        )
    )

    total_expenses = sum(
        expense["amount"]
        for expense in expenses
    )

    # -----------------------------
    # EXPENSE BY CATEGORY
    # -----------------------------

    expenses_by_category = {}

    for expense in expenses:
        category = expense["category"]

        expenses_by_category[category] = (
            expenses_by_category.get(category, 0)
            + expense["amount"]
        )

    expenses_by_category = {
        category: round(amount, 2)
        for category, amount in expenses_by_category.items()
    }

    # -----------------------------
    # NET RESULT
    # -----------------------------

    net_result = revenue - total_expenses

    # -----------------------------
    # AVERAGE ORDER VALUE
    # -----------------------------

    average_order_value = (
        revenue / len(completed_orders)
        if completed_orders
        else 0
    )

    # -----------------------------
    # RETURN
    # -----------------------------

    return {
        "success": True,

        "period": {
            "days": days,
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
        },

        "revenue": {
            "total_revenue": round(revenue, 2),
            "completed_orders": len(completed_orders),
            "average_order_value": round(
                average_order_value, 2
            ),
        },

        "expenses": {
            "total_expenses": round(
                total_expenses, 2
            ),
            "by_category": expenses_by_category,
        },

        "other_orders": {
            "cancelled_orders": len(cancelled_orders),
            "refunded_orders": len(refunded_orders),
            "refunded_amount": round(
                refunded_amount, 2
            ),
        },

        "net_result": round(net_result, 2),
    }
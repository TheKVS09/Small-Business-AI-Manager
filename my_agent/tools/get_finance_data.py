from ..database import db
from datetime import datetime, timedelta


def get_finance_data(days: int = 30) -> dict:
    """Retrieve financial performance and compare it with the previous period."""

    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)

    # Previous period of equal length
    previous_end_date = start_date
    previous_start_date = previous_end_date - timedelta(days=days)

    # -----------------------------
    # CURRENT PERIOD ORDERS
    # -----------------------------

    current_orders = list(
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

    # -----------------------------
    # PREVIOUS PERIOD ORDERS
    # -----------------------------

    previous_orders = list(
        db["orders"].find(
            {
                "order_date": {
                    "$gte": previous_start_date,
                    "$lt": previous_end_date
                }
            },
            {"_id": 0}
        )
    )

    # -----------------------------
    # CURRENT PERIOD REVENUE
    # -----------------------------

    current_completed = [
        order
        for order in current_orders
        if order["status"] == "Completed"
    ]

    current_refunded = [
        order
        for order in current_orders
        if order["status"] == "Refunded"
    ]

    current_cancelled = [
        order
        for order in current_orders
        if order["status"] == "Cancelled"
    ]

    current_revenue = sum(
        order["total_amount"]
        for order in current_completed
    )

    current_refunded_amount = sum(
        order["total_amount"]
        for order in current_refunded
    )

    # -----------------------------
    # PREVIOUS PERIOD REVENUE
    # -----------------------------

    previous_completed = [
        order
        for order in previous_orders
        if order["status"] == "Completed"
    ]

    previous_refunded = [
        order
        for order in previous_orders
        if order["status"] == "Refunded"
    ]

    previous_revenue = sum(
        order["total_amount"]
        for order in previous_completed
    )

    previous_refunded_amount = sum(
        order["total_amount"]
        for order in previous_refunded
    )

    # -----------------------------
    # EXPENSES
    # -----------------------------

    current_expenses = list(
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

    previous_expenses = list(
        db["expenses"].find(
            {
                "date": {
                    "$gte": previous_start_date,
                    "$lt": previous_end_date
                }
            },
            {"_id": 0}
        )
    )

    current_total_expenses = sum(
        expense["amount"]
        for expense in current_expenses
    )

    previous_total_expenses = sum(
        expense["amount"]
        for expense in previous_expenses
    )

    # -----------------------------
    # EXPENSE BY CATEGORY
    # -----------------------------

    current_expenses_by_category = {}

    for expense in current_expenses:
        category = expense["category"]

        current_expenses_by_category[category] = (
            current_expenses_by_category.get(category, 0)
            + expense["amount"]
        )

    current_expenses_by_category = {
        category: round(amount, 2)
        for category, amount in current_expenses_by_category.items()
    }

    # -----------------------------
    # FINANCIAL METRICS
    # -----------------------------

    current_net_result = (
        current_revenue - current_total_expenses
    )

    previous_net_result = (
        previous_revenue - previous_total_expenses
    )

    current_aov = (
        current_revenue / len(current_completed)
        if current_completed
        else 0
    )

    previous_aov = (
        previous_revenue / len(previous_completed)
        if previous_completed
        else 0
    )

    current_margin = (
        (current_net_result / current_revenue) * 100
        if current_revenue
        else 0
    )

    previous_margin = (
        (previous_net_result / previous_revenue) * 100
        if previous_revenue
        else 0
    )

    # -----------------------------
    # PERCENTAGE CHANGE HELPER
    # -----------------------------

    def percentage_change(current, previous):
        if previous == 0:
            return None

        return round(
            ((current - previous) / previous) * 100,
            2
        )

    # -----------------------------
    # RETURN
    # -----------------------------

    return {
        "success": True,

        "period": {
            "days": days,
            "current_start": start_date.isoformat(),
            "current_end": end_date.isoformat(),
            "previous_start": previous_start_date.isoformat(),
            "previous_end": previous_end_date.isoformat(),
        },

        "current_period": {
            "revenue": round(current_revenue, 2),
            "completed_orders": len(current_completed),
            "average_order_value": round(current_aov, 2),

            "expenses": round(
                current_total_expenses,
                2
            ),

            "net_result": round(
                current_net_result,
                2
            ),

            "net_margin": round(
                current_margin,
                2
            ),

            "refunded_orders": len(current_refunded),
            "refunded_amount": round(
                current_refunded_amount,
                2
            ),

            "cancelled_orders": len(
                current_cancelled
            ),

            "expenses_by_category":
                current_expenses_by_category,
        },

        "previous_period": {
            "revenue": round(previous_revenue, 2),
            "completed_orders": len(previous_completed),
            "average_order_value": round(
                previous_aov,
                2
            ),

            "expenses": round(
                previous_total_expenses,
                2
            ),

            "net_result": round(
                previous_net_result,
                2
            ),

            "net_margin": round(
                previous_margin,
                2
            ),

            "refunded_orders": len(previous_refunded),
            "refunded_amount": round(
                previous_refunded_amount,
                2
            ),
        },

        "changes": {
            "revenue_change_percent":
                percentage_change(
                    current_revenue,
                    previous_revenue
                ),

            "completed_orders_change_percent":
                percentage_change(
                    len(current_completed),
                    len(previous_completed)
                ),

            "aov_change_percent":
                percentage_change(
                    current_aov,
                    previous_aov
                ),

            "expense_change_percent":
                percentage_change(
                    current_total_expenses,
                    previous_total_expenses
                ),

            "net_result_change_percent":
                percentage_change(
                    current_net_result,
                    previous_net_result
                ),

            "refund_amount_change_percent":
                percentage_change(
                    current_refunded_amount,
                    previous_refunded_amount
                ),
        },
    }
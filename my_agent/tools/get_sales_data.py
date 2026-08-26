from ..database import db
from datetime import datetime, timedelta


def get_sales_data(
    days: int = 30,
    limit: int = 20
) -> dict:
    """
    Analyze sales performance for the current period
    compared with the previous period.
    """

    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)

    previous_end_date = start_date
    previous_start_date = previous_end_date - timedelta(days=days)

    orders = db["orders"]

    # ---------------------------------
    # CURRENT PERIOD
    # ---------------------------------

    current_orders = list(
        orders.find(
            {
                "order_date": {
                    "$gte": start_date,
                    "$lte": end_date
                }
            },
            {"_id": 0}
        )
    )

    # ---------------------------------
    # PREVIOUS PERIOD
    # ---------------------------------

    previous_orders = list(
        orders.find(
            {
                "order_date": {
                    "$gte": previous_start_date,
                    "$lt": previous_end_date
                }
            },
            {"_id": 0}
        )
    )

    # ---------------------------------
    # COMPLETED ORDERS
    # ---------------------------------

    current_completed = [
        order
        for order in current_orders
        if order["status"] == "Completed"
    ]

    previous_completed = [
        order
        for order in previous_orders
        if order["status"] == "Completed"
    ]

    # ---------------------------------
    # REVENUE
    # ---------------------------------

    current_revenue = sum(
        order["total_amount"]
        for order in current_completed
    )

    previous_revenue = sum(
        order["total_amount"]
        for order in previous_completed
    )

    # ---------------------------------
    # ORDER COUNT
    # ---------------------------------

    current_order_count = len(current_completed)
    previous_order_count = len(previous_completed)

    # ---------------------------------
    # AOV
    # ---------------------------------

    current_aov = (
        current_revenue / current_order_count
        if current_order_count
        else 0
    )

    previous_aov = (
        previous_revenue / previous_order_count
        if previous_order_count
        else 0
    )

    # ---------------------------------
    # UNIQUE CUSTOMERS
    # ---------------------------------

    current_customers = len({
        order["customer_id"]
        for order in current_completed
    })

    previous_customers = len({
        order["customer_id"]
        for order in previous_completed
    })

    # ---------------------------------
    # SALES BY CHANNEL
    # ---------------------------------

    current_channel_sales = {}

    for order in current_completed:
        channel = order["channel"]

        current_channel_sales[channel] = (
            current_channel_sales.get(channel, 0)
            + order["total_amount"]
        )

    previous_channel_sales = {}

    for order in previous_completed:
        channel = order["channel"]

        previous_channel_sales[channel] = (
            previous_channel_sales.get(channel, 0)
            + order["total_amount"]
        )

    current_channel_sales = {
        channel: round(amount, 2)
        for channel, amount in current_channel_sales.items()
    }

    previous_channel_sales = {
        channel: round(amount, 2)
        for channel, amount in previous_channel_sales.items()
    }

    # ---------------------------------
    # PERCENTAGE CHANGE
    # ---------------------------------

    def percentage_change(current, previous):
        if previous == 0:
            return None

        return round(
            ((current - previous) / previous) * 100,
            2
        )

    # ---------------------------------
    # RECENT ORDERS
    # ---------------------------------

    recent_orders = list(
        orders.find(
            {},
            {"_id": 0}
        )
        .sort("order_date", -1)
        .limit(limit)
    )

    # Convert dates to strings
    for order in recent_orders:
        if isinstance(order.get("order_date"), datetime):
            order["order_date"] = (
                order["order_date"].isoformat()
            )

    # ---------------------------------
    # RETURN
    # ---------------------------------

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
            "completed_orders": current_order_count,
            "unique_customers": current_customers,
            "average_order_value": round(
                current_aov,
                2
            ),
            "sales_by_channel": current_channel_sales,
        },

        "previous_period": {
            "revenue": round(previous_revenue, 2),
            "completed_orders": previous_order_count,
            "unique_customers": previous_customers,
            "average_order_value": round(
                previous_aov,
                2
            ),
            "sales_by_channel": previous_channel_sales,
        },

        "changes": {
            "revenue_change_percent":
                percentage_change(
                    current_revenue,
                    previous_revenue
                ),

            "completed_orders_change_percent":
                percentage_change(
                    current_order_count,
                    previous_order_count
                ),

            "unique_customers_change_percent":
                percentage_change(
                    current_customers,
                    previous_customers
                ),

            "aov_change_percent":
                percentage_change(
                    current_aov,
                    previous_aov
                ),
        },

        "recent_orders": recent_orders,
    }
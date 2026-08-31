from datetime import datetime, timedelta

from fastapi import APIRouter, Query

from .database import db


# ============================================================
# ROUTER
# ============================================================

router = APIRouter(
    prefix="/api/reports",
    tags=["Reports"],
)


# ============================================================
# COLLECTIONS
# ============================================================

orders = db["orders"]
expenses = db["expenses"]
customers = db["customers"]


# ============================================================
# DATE HELPERS
# ============================================================

def parse_date(value):
    """
    Convert MongoDB datetime or ISO string into
    a timezone-naive datetime.

    This keeps all report comparisons consistent.
    """

    if isinstance(value, datetime):
        if value.tzinfo is not None:
            return value.astimezone().replace(tzinfo=None)

        return value

    if isinstance(value, str):
        try:
            parsed = datetime.fromisoformat(
                value.replace("Z", "+00:00")
            )

            if parsed.tzinfo is not None:
                parsed = parsed.astimezone().replace(
                    tzinfo=None
                )

            return parsed

        except (ValueError, TypeError):
            return None

    return None


def get_date_range(days):
    """
    Return the start and end of the requested period.

    End = current server time
    Start = end - requested number of days
    """

    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)

    return start_date, end_date


# ============================================================
# PERIOD TYPE
# ============================================================

def get_period_type(days):
    """
    Decide how the trend should be grouped.

    1 - 30 days     -> daily
    31 - 180 days   -> weekly
    181+ days       -> monthly
    """

    if days <= 30:
        return "daily"

    if days <= 180:
        return "weekly"

    return "monthly"


# ============================================================
# PERIOD KEY
# ============================================================

def get_period_key(date_value, period_type):
    """
    Convert a datetime into the key used by the trend dictionary.
    """

    if period_type == "daily":
        return date_value.strftime("%Y-%m-%d")

    if period_type == "weekly":
        week_start = (
            date_value
            - timedelta(days=date_value.weekday())
        )

        return week_start.strftime("%Y-%m-%d")

    return date_value.strftime("%Y-%m")


# ============================================================
# PERIOD LABEL
# ============================================================

def get_period_label(key, period_type):
    """
    Generate a frontend-friendly label.
    """

    if period_type == "daily":

        date_value = datetime.strptime(
            key,
            "%Y-%m-%d",
        )

        return date_value.strftime("%d %b")

    if period_type == "weekly":

        start_date = datetime.strptime(
            key,
            "%Y-%m-%d",
        )

        end_date = start_date + timedelta(days=6)

        return (
            f"{start_date.strftime('%d %b')}"
            f" - "
            f"{end_date.strftime('%d %b')}"
        )

    date_value = datetime.strptime(
        key,
        "%Y-%m",
    )

    return date_value.strftime("%b %Y")


# ============================================================
# CREATE PERIODS
# ============================================================

def create_periods(
    start_date,
    end_date,
    period_type,
):
    """
    Create every expected reporting period.

    Empty periods are included so the frontend
    always receives a continuous timeline.
    """

    periods = {}

    # --------------------------------------------------------
    # DAILY
    # --------------------------------------------------------

    if period_type == "daily":

        current = start_date.date()
        final_date = end_date.date()

        while current <= final_date:

            key = current.isoformat()

            periods[key] = {
                "date": key,
                "label": current.strftime("%d %b"),
                "revenue": 0.0,
                "expenses": 0.0,
                "profit": 0.0,
            }

            current += timedelta(days=1)

    # --------------------------------------------------------
    # WEEKLY
    # --------------------------------------------------------

    elif period_type == "weekly":

        current = (
            start_date
            - timedelta(days=start_date.weekday())
        ).replace(
            hour=0,
            minute=0,
            second=0,
            microsecond=0,
        )

        while current <= end_date:

            key = current.strftime("%Y-%m-%d")

            week_end = current + timedelta(days=6)

            periods[key] = {
                "date": key,
                "label": (
                    f"{current.strftime('%d %b')}"
                    f" - "
                    f"{week_end.strftime('%d %b')}"
                ),
                "revenue": 0.0,
                "expenses": 0.0,
                "profit": 0.0,
            }

            current += timedelta(days=7)

    # --------------------------------------------------------
    # MONTHLY
    # --------------------------------------------------------

    else:

        current = start_date.replace(
            day=1,
            hour=0,
            minute=0,
            second=0,
            microsecond=0,
        )

        final_month = end_date.replace(
            day=1,
            hour=0,
            minute=0,
            second=0,
            microsecond=0,
        )

        while current <= final_month:

            key = current.strftime("%Y-%m")

            periods[key] = {
                "date": key,
                "label": current.strftime("%b %Y"),
                "revenue": 0.0,
                "expenses": 0.0,
                "profit": 0.0,
            }

            if current.month == 12:

                current = current.replace(
                    year=current.year + 1,
                    month=1,
                )

            else:

                current = current.replace(
                    month=current.month + 1,
                )

    return periods


# ============================================================
# SUMMARY
# ============================================================

@router.get("/summary")
def get_report_summary(
    days: int = Query(
        30,
        ge=1,
        le=3650,
    )
):

    start_date, end_date = get_date_range(days)

    # ========================================================
    # ORDERS
    # ========================================================

    period_orders = []

    for order in orders.find(
        {},
        {
            "_id": 0,
            "order_date": 1,
            "total_amount": 1,
            "status": 1,
            "channel": 1,
        },
    ):

        order_date = parse_date(
            order.get("order_date")
        )

        if order_date is None:
            continue

        if order_date < start_date:
            continue

        if order_date > end_date:
            continue

        period_orders.append(order)

    # ========================================================
    # ORDER STATUS
    # ========================================================

    completed_orders = [
        order
        for order in period_orders
        if str(order.get("status", "")).strip().lower()
        == "completed"
    ]

    pending_orders = [
        order
        for order in period_orders
        if str(order.get("status", "")).strip().lower()
        == "pending"
    ]

    cancelled_orders = [
        order
        for order in period_orders
        if str(order.get("status", "")).strip().lower()
        == "cancelled"
    ]

    # ========================================================
    # REVENUE
    # ========================================================

    total_revenue = sum(
        float(
            order.get("total_amount", 0) or 0
        )
        for order in completed_orders
    )

    total_orders = len(completed_orders)

    average_order_value = (
        total_revenue / total_orders
        if total_orders
        else 0
    )

    # ========================================================
    # EXPENSES
    # ========================================================

    period_expenses = []

    for expense in expenses.find(
        {},
        {
            "_id": 0,
            "date": 1,
            "amount": 1,
            "category": 1,
        },
    ):

        expense_date = parse_date(
            expense.get("date")
        )

        if expense_date is None:
            continue

        if expense_date < start_date:
            continue

        if expense_date > end_date:
            continue

        period_expenses.append(expense)

    total_expenses = sum(
        float(
            expense.get("amount", 0) or 0
        )
        for expense in period_expenses
    )

    # ========================================================
    # PROFIT
    # ========================================================

    net_profit = (
        total_revenue
        - total_expenses
    )

    expense_ratio = (
        total_expenses / total_revenue * 100
        if total_revenue > 0
        else 0
    )

    profit_margin = (
        net_profit / total_revenue * 100
        if total_revenue > 0
        else 0
    )

    # ========================================================
    # SALES BY CHANNEL
    # ========================================================

    sales_by_channel_map = {}

    for order in completed_orders:

        channel = (
            str(order.get("channel") or "Other").strip()
            or "Other"
        )

        amount = float(
            order.get("total_amount", 0) or 0
        )

        sales_by_channel_map[channel] = (
            sales_by_channel_map.get(channel, 0)
            + amount
        )

    sales_by_channel = [
        {
            "channel": channel,
            "amount": round(amount, 2),
        }
        for channel, amount in sorted(
            sales_by_channel_map.items(),
            key=lambda item: item[1],
            reverse=True,
        )
    ]

    # ========================================================
    # EXPENSES BY CATEGORY
    # ========================================================

    expenses_by_category_map = {}

    for expense in period_expenses:

        category = (
            str(expense.get("category") or "Other").strip()
            or "Other"
        )

        amount = float(
            expense.get("amount", 0) or 0
        )

        expenses_by_category_map[category] = (
            expenses_by_category_map.get(category, 0)
            + amount
        )

    expenses_by_category = [
        {
            "category": category,
            "amount": round(amount, 2),
        }
        for category, amount in sorted(
            expenses_by_category_map.items(),
            key=lambda item: item[1],
            reverse=True,
        )
    ]

    # ========================================================
    # CUSTOMERS
    # ========================================================

    all_customers = list(
        customers.find(
            {},
            {
                "_id": 0,
                "signup_date": 1,
                "customer_segment": 1,
            },
        )
    )

    total_customers = len(all_customers)

    # ========================================================
    # NEW CUSTOMERS
    # ========================================================

    new_customers = 0

    for customer in all_customers:

        signup_date = parse_date(
            customer.get("signup_date")
        )

        if signup_date is None:
            continue

        if signup_date < start_date:
            continue

        if signup_date > end_date:
            continue

        new_customers += 1

    # ========================================================
    # CUSTOMER SEGMENTS
    # ========================================================

    customer_segments_map = {}

    for customer in all_customers:

        segment = (
            str(
                customer.get(
                    "customer_segment"
                )
                or "Other"
            ).strip()
            or "Other"
        )

        customer_segments_map[segment] = (
            customer_segments_map.get(segment, 0)
            + 1
        )

    customer_segments = [
        {
            "segment": segment,
            "count": count,
        }
        for segment, count in sorted(
            customer_segments_map.items(),
            key=lambda item: item[1],
            reverse=True,
        )
    ]

    # ========================================================
    # RETURN
    # ========================================================

    return {
        "period_days": days,
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),

        "summary": {
            "total_revenue": round(
                total_revenue,
                2,
            ),

            "total_expenses": round(
                total_expenses,
                2,
            ),

            "net_profit": round(
                net_profit,
                2,
            ),

            "total_orders": total_orders,

            "average_order_value": round(
                average_order_value,
                2,
            ),

            "customers": {
                "total": total_customers,
                "new": new_customers,
            },

            "pending_orders": len(
                pending_orders
            ),

            "cancelled_orders": len(
                cancelled_orders
            ),

            "expense_ratio": round(
                expense_ratio,
                2,
            ),

            "profit_margin": round(
                profit_margin,
                2,
            ),
        },

        "sales_by_channel": sales_by_channel,

        "expenses_by_category": expenses_by_category,

        "customer_segments": customer_segments,
    }


# ============================================================
# TREND
# ============================================================

@router.get("/trend")
def get_report_trend(
    days: int = Query(
        30,
        ge=1,
        le=3650,
    )
):

    start_date, end_date = get_date_range(days)

    period_type = get_period_type(days)

    trend = create_periods(
        start_date,
        end_date,
        period_type,
    )

    # ========================================================
    # REVENUE
    # ========================================================

    for order in orders.find(
        {
            "status": {
                "$regex": "^completed$",
                "$options": "i",
            },
        },
        {
            "_id": 0,
            "order_date": 1,
            "total_amount": 1,
        },
    ):

        order_date = parse_date(
            order.get("order_date")
        )

        if order_date is None:
            continue

        if order_date < start_date:
            continue

        if order_date > end_date:
            continue

        key = get_period_key(
            order_date,
            period_type,
        )

        if key not in trend:
            continue

        amount = float(
            order.get("total_amount", 0) or 0
        )

        trend[key]["revenue"] += amount

    # ========================================================
    # EXPENSES
    # ========================================================

    for expense in expenses.find(
        {},
        {
            "_id": 0,
            "date": 1,
            "amount": 1,
        },
    ):

        expense_date = parse_date(
            expense.get("date")
        )

        if expense_date is None:
            continue

        if expense_date < start_date:
            continue

        if expense_date > end_date:
            continue

        key = get_period_key(
            expense_date,
            period_type,
        )

        if key not in trend:
            continue

        amount = float(
            expense.get("amount", 0) or 0
        )

        trend[key]["expenses"] += amount

    # ========================================================
    # BUILD RESULT
    # ========================================================

    result = []

    for key in sorted(trend.keys()):

        revenue = trend[key]["revenue"]

        expense_value = trend[key]["expenses"]

        profit = revenue - expense_value

        result.append(
            {
                "date": trend[key]["date"],
                "label": trend[key]["label"],
                "revenue": round(revenue, 2),
                "expenses": round(expense_value, 2),
                "profit": round(profit, 2),
            }
        )

    # ========================================================
    # RETURN
    # ========================================================

    return {
        "period_days": days,
        "period_type": period_type,
        "data": result,
    }
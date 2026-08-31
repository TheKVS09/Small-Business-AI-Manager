
from datetime import datetime, timedelta

from fastapi import APIRouter, Query

from .database import db


router = APIRouter(
    prefix="/api/marketing",
    tags=["Marketing"]
)


# ============================================================
# COLLECTIONS
# ============================================================

orders = db["orders"]
order_items = db["order_items"]
products = db["products"]
expenses = db["expenses"]
website_visits = db["website_visits"]


# ============================================================
# HELPERS
# ============================================================

def get_period_start(period: str):
    now = datetime.utcnow()

    if period == "7days":
        return now - timedelta(days=7)

    if period == "1month":
        return now - timedelta(days=30)

    if period == "6months":
        return now - timedelta(days=180)

    if period == "1year":
        return now - timedelta(days=365)

    return now - timedelta(days=7)


def safe_number(value):
    try:
        return float(value or 0)
    except (TypeError, ValueError):
        return 0.0


def calculate_roas(revenue, spend):
    if spend <= 0:
        return 0.0

    return revenue / spend


def calculate_roi(revenue, spend):
    if spend <= 0:
        return 0.0

    return ((revenue - spend) / spend) * 100


# ============================================================
# MARKETING ENDPOINT
# ============================================================

@router.get("")
def get_marketing(
    period: str = Query(
        "7days",
        enum=["7days", "1month", "6months", "1year"]
    )
):

    start_date = get_period_start(period)
    end_date = datetime.utcnow()


    # ========================================================
    # COMPLETED ORDERS
    # ========================================================

    order_records = list(
        orders.find(
            {
                "order_date": {
                    "$gte": start_date,
                    "$lte": end_date
                },
                "status": "Completed"
            },
            {
                "_id": 0
            }
        )
    )


    # ========================================================
    # MARKETING EXPENSES
    # ========================================================

    marketing_records = list(
        expenses.find(
            {
                "category": "Marketing",
                "date": {
                    "$gte": start_date,
                    "$lte": end_date
                }
            },
            {
                "_id": 0
            }
        )
    )


    total_spend = sum(
        safe_number(record.get("amount"))
        for record in marketing_records
    )


    # ========================================================
    # REVENUE
    # ========================================================

    total_revenue = sum(
        safe_number(order.get("total_amount"))
        for order in order_records
    )

    total_orders = len(order_records)


    overall_roas = calculate_roas(
        total_revenue,
        total_spend
    )

    overall_roi = calculate_roi(
        total_revenue,
        total_spend
    )


    # ========================================================
    # CHANNEL PERFORMANCE
    # ========================================================

    channel_data = {}

    for order in order_records:

        channel = order.get(
            "channel",
            "Unknown"
        )

        if channel not in channel_data:
            channel_data[channel] = {
                "revenue": 0.0,
                "orders": 0
            }

        channel_data[channel]["revenue"] += safe_number(
            order.get("total_amount")
        )

        channel_data[channel]["orders"] += 1


    channels = []

    for channel, values in channel_data.items():

        revenue = values["revenue"]
        channel_orders = values["orders"]

        if total_revenue > 0:
            spend = (
                total_spend
                * revenue
                / total_revenue
            )
        else:
            spend = 0.0

        roas = calculate_roas(
            revenue,
            spend
        )

        roi = calculate_roi(
            revenue,
            spend
        )

        channels.append({
            "channel": channel,
            "spend": round(spend, 2),
            "revenue": round(revenue, 2),
            "orders": channel_orders,
            "roas": round(roas, 2),
            "roi": round(roi, 1)
        })


    # ========================================================
    # CATEGORY PERFORMANCE
    # ========================================================

    category_data = {}

    order_ids = [
        order.get("order_id")
        for order in order_records
    ]


    if order_ids:

        item_records = list(
            order_items.find(
                {
                    "order_id": {
                        "$in": order_ids
                    }
                },
                {
                    "_id": 0
                }
            )
        )

    else:

        item_records = []


    for item in item_records:

        product = products.find_one(
            {
                "product_id": item.get("product_id")
            },
            {
                "_id": 0,
                "category": 1
            }
        )


        if product:
            category = product.get(
                "category",
                "Other"
            )
        else:
            category = "Other"


        quantity = int(
            item.get("quantity", 0) or 0
        )

        unit_price = safe_number(
            item.get("unit_price")
        )

        discount = safe_number(
            item.get("discount")
        )


        item_revenue = (
            unit_price - discount
        ) * quantity


        if category not in category_data:

            category_data[category] = {
                "revenue": 0.0,
                "orders": set()
            }


        category_data[category]["revenue"] += item_revenue

        category_data[category]["orders"].add(
            item.get("order_id")
        )


    categories = []


    total_category_revenue = sum(
        value["revenue"]
        for value in category_data.values()
    )


    for category, values in category_data.items():

        revenue = values["revenue"]


        if total_category_revenue > 0:

            spend = (
                total_spend
                * revenue
                / total_category_revenue
            )

        else:

            spend = 0.0


        category_orders = len(
            values["orders"]
        )


        roas = calculate_roas(
            revenue,
            spend
        )

        roi = calculate_roi(
            revenue,
            spend
        )


        categories.append({
            "category": category,
            "spend": round(spend, 2),
            "orders": category_orders,
            "revenue": round(revenue, 2),
            "roas": round(roas, 2),
            "roi": round(roi, 1)
        })


    categories.sort(
        key=lambda item: item["revenue"],
        reverse=True
    )


    # ========================================================
    # WEBSITE PERFORMANCE
    # ========================================================

    visit_records = list(
        website_visits.find(
            {
                "date": {
                    "$gte": start_date,
                    "$lte": end_date
                }
            },
            {
                "_id": 0
            }
        )
    )


    visits = len(visit_records)


    conversions = sum(
        1
        for visit in visit_records
        if visit.get("converted") is True
    )


    conversion_rate = (
        (conversions / visits) * 100
        if visits > 0
        else 0.0
    )


    # ========================================================
    # ACQUISITION SOURCES
    # ========================================================

    acquisition_sources = {}


    for visit in visit_records:

        source = visit.get(
            "source",
            "Unknown"
        )

        acquisition_sources[source] = (
            acquisition_sources.get(source, 0) + 1
        )


    # ========================================================
    # EMAIL
    #
    # The current seed database does not contain
    # email campaign data.
    # ========================================================

    email_data = {
        "sent": 0,
        "opened": 0,
        "open_rate": 0,
        "clicked": 0,
        "click_rate": 0,
        "orders": 0,
        "revenue": 0
    }


    # ========================================================
    # INSIGHTS
    # ========================================================

    insights = []


    # Only calculate best channel when there is
    # actual marketing spend.

    if channels and total_spend > 0:

        best_channel = max(
            channels,
            key=lambda item: item["roas"]
        )

        insights.append({
            "type": "success",
            "title": "Best Marketing Channel",
            "message": (
                f"{best_channel['channel']} generated "
                f"{best_channel['roas']:.2f}x ROAS."
            )
        })


    # Only calculate best category when there is
    # actual marketing spend.

    if categories and total_spend > 0:

        best_category = max(
            categories,
            key=lambda item: item["roas"]
        )

        insights.append({
            "type": "success",
            "title": "Top Product Category",
            "message": (
                f"{best_category['category']} generated "
                f"{best_category['roas']:.2f}x ROAS."
            )
        })


    if visits > 0 and conversion_rate < 5:

        insights.append({
            "type": "warning",
            "title": "Low Website Conversion",
            "message": (
                f"Website conversion rate is "
                f"{conversion_rate:.1f}%. "
                "Consider improving the website conversion funnel."
            )
        })


    if total_spend == 0:

        insights.append({
            "type": "info",
            "title": "No Marketing Spend Recorded",
            "message": (
                "No marketing expenses were recorded "
                "during the selected period. "
                "ROAS and ROI cannot be calculated."
            )
        })


    elif overall_roas >= 5:

        insights.append({
            "type": "success",
            "title": "Strong Marketing Returns",
            "message": (
                f"Overall marketing ROAS is "
                f"{overall_roas:.2f}x."
            )
        })


    elif overall_roas < 2:

        insights.append({
            "type": "danger",
            "title": "Marketing Efficiency Needs Attention",
            "message": (
                f"Overall marketing ROAS is only "
                f"{overall_roas:.2f}x. "
                "Consider reviewing marketing spending."
            )
        })


    # ========================================================
    # RESPONSE
    # ========================================================

    return {

        "period": period,

        "overview": {
            "total_spend": round(total_spend, 2),
            "revenue": round(total_revenue, 2),
            "roas": round(overall_roas, 2),
            "roi": round(overall_roi, 1),
            "orders": total_orders
        },

        "channels": channels,

        "categories": categories,

        "website": {
            "visits": visits,
            "conversions": conversions,
            "conversion_rate": round(
                conversion_rate,
                1
            )
        },

        "acquisition_sources": acquisition_sources,

        "email": email_data,

        "insights": insights
    }

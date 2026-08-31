from datetime import datetime, timedelta

from fastapi import APIRouter, Query

from .database import db


router = APIRouter(prefix="/api/sales", tags=["Sales"])

orders = db["orders"]
order_items = db["order_items"]
customers = db["customers"]
products = db["products"]


# ============================================================
# DATE RANGE
# ============================================================

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


# ============================================================
# GET SALES
# ============================================================

@router.get("")
def get_sales(
    limit: int = Query(100, ge=1, le=500)
):
    """
    Return recent sales with customer and product information.
    """

    recent_orders = list(
        orders.find(
            {},
            {"_id": 0}
        )
        .sort("order_date", -1)
        .limit(limit)
    )

    result = []

    for order in recent_orders:

        order_id = order.get("order_id")
        customer_id = order.get("customer_id")

        # ----------------------------------------------------
        # CUSTOMER
        # ----------------------------------------------------

        customer = customers.find_one(
            {
                "customer_id": customer_id
            },
            {
                "_id": 0,
                "name": 1
            }
        )

        customer_name = (
            customer.get("name")
            if customer
            else "-"
        )

        # ----------------------------------------------------
        # ORDER ITEMS
        # ----------------------------------------------------

        items = list(
            order_items.find(
                {
                    "order_id": order_id
                },
                {
                    "_id": 0
                }
            )
        )

        # ----------------------------------------------------
        # If an order has multiple products,
        # create one row for each product.
        # ----------------------------------------------------

        if not items:

            result.append({
                "sale_id": order_id,

                "order_id": order_id,

                "sale_date": (
                    order["order_date"].isoformat()
                    if isinstance(
                        order.get("order_date"),
                        datetime
                    )
                    else order.get("order_date")
                ),

                "customer": customer_name,

                "product": "-",

                "quantity": 0,

                "unit_price": 0,

                "amount": float(
                    order.get(
                        "total_amount",
                        0
                    )
                ),

                "status": order.get(
                    "status"
                )
            })

            continue

        # ----------------------------------------------------
        # PRODUCT ROWS
        # ----------------------------------------------------

        for item in items:

            product_id = item.get(
                "product_id"
            )

            product = products.find_one(
                {
                    "product_id": product_id
                },
                {
                    "_id": 0,
                    "name": 1
                }
            )

            product_name = (
                product.get("name")
                if product
                else "-"
            )

            quantity = int(
                item.get(
                    "quantity",
                    0
                )
            )

            unit_price = float(
                item.get(
                    "unit_price",
                    0
                )
            )

            amount = (
                quantity *
                unit_price
            )

            result.append({

                "sale_id": order_id,

                "order_id": order_id,

                "sale_date": (
                    order["order_date"].isoformat()
                    if isinstance(
                        order.get("order_date"),
                        datetime
                    )
                    else order.get("order_date")
                ),

                "customer": customer_name,

                "product": product_name,

                "quantity": quantity,

                "unit_price": unit_price,

                "amount": round(
                    amount,
                    2
                ),

                "status": order.get(
                    "status"
                )
            })

    return result


# ============================================================
# SALES SUMMARY
# ============================================================

@router.get("/summary")
def sales_summary(
    period: str = Query("7")
):

    start_date, end_date = get_date_range(
        period
    )

    current_orders = list(
        orders.find(
            {
                "order_date": {
                    "$gte": start_date,
                    "$lte": end_date
                }
            },
            {
                "_id": 0
            }
        )
    )

    completed_orders = [
        order
        for order in current_orders
        if order.get("status") == "Completed"
    ]

    pending_orders = [
        order
        for order in current_orders
        if order.get("status") == "Pending"
    ]

    cancelled_orders = [
        order
        for order in current_orders
        if order.get("status") == "Cancelled"
    ]

    # --------------------------------------------------------
    # TOTAL SALES
    # --------------------------------------------------------

    total_sales = sum(
        float(
            order.get(
                "total_amount",
                0
            )
        )
        for order in completed_orders
    )

    # --------------------------------------------------------
    # TRANSACTIONS
    # --------------------------------------------------------

    total_transactions = len(
        completed_orders
    )

    # --------------------------------------------------------
    # AVERAGE ORDER VALUE
    # --------------------------------------------------------

    average_order = (
        total_sales /
        total_transactions
        if total_transactions
        else 0
    )

    return {

        "total_sales": round(
            total_sales,
            2
        ),

        "total_transactions":
            total_transactions,

        "average_order": round(
            average_order,
            2
        ),

        "pending_orders":
            len(pending_orders),

        "cancelled_orders":
            len(cancelled_orders)
    }


# ============================================================
# SALES CHART
# ============================================================

@router.get("/chart")
def sales_chart(
    period: str = Query("7")
):

    start_date, end_date = get_date_range(
        period
    )

    completed_orders = list(
        orders.find(
            {
                "order_date": {
                    "$gte": start_date,
                    "$lte": end_date
                },

                "status": "Completed"
            },

            {
                "_id": 0,

                "order_date": 1,

                "total_amount": 1
            }
        )
    )

    daily_sales = {}

    for order in completed_orders:

        order_date = order.get(
            "order_date"
        )

        if not isinstance(
            order_date,
            datetime
        ):
            continue

        date_key = (
            order_date
            .date()
            .isoformat()
        )

        daily_sales[date_key] = (
            daily_sales.get(
                date_key,
                0
            )
            +
            float(
                order.get(
                    "total_amount",
                    0
                )
            )
        )

    result = []

    for date, total in sorted(
        daily_sales.items()
    ):

        result.append({

            "sale_date": date,

            "total": round(
                total,
                2
            )
        })

    return result
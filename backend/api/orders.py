from fastapi import APIRouter, Query
from .database import db

router = APIRouter(prefix="/api/orders", tags=["Orders"])

orders_collection = db["orders"]
order_items_collection = db["order_items"]
customers_collection = db["customers"]
products_collection = db["products"]


def serialize_order(order):
    order_id = order.get("order_id")
    customer_id = order.get("customer_id")

    # Customer
    customer = customers_collection.find_one(
        {"customer_id": customer_id},
        {"_id": 0}
    )

    # Order items
    items = list(
        order_items_collection.find(
            {"order_id": order_id},
            {"_id": 0}
        )
    )

    products = []

    for item in items:
        product = products_collection.find_one(
            {"product_id": item.get("product_id")},
            {"_id": 0}
        )

        products.append({
            "product_id": item.get("product_id"),
            "name": product.get("name") if product else "-",
            "quantity": item.get("quantity", 0),
            "unit_price": float(item.get("unit_price", 0)),
        })

    # For table display, use first product
    first_product = products[0] if products else {}

    return {
        "order_id": order_id,

        "order_date": (
            order["order_date"].isoformat()
            if order.get("order_date")
            else None
        ),

        "customer_id": customer_id,

        "customer_name": (
            customer.get("name")
            if customer
            else "-"
        ),

        "product_name": first_product.get("name", "-"),

        "quantity": first_product.get("quantity", 0),

        "unit_price": first_product.get("unit_price", 0),

        "status": order.get("status", "-"),

        "payment_method": order.get(
            "payment_method",
            "-"
        ),

        "channel": order.get(
            "channel",
            "-"
        ),

        "total_amount": float(
            order.get("total_amount", 0)
        ),

        "discount": float(
            order.get("discount", 0)
        ),

        "items": products
    }


# ============================================================
# GET ORDERS
# ============================================================

@router.get("")
def get_orders(
    limit: int = Query(100, ge=1, le=500)
):
    order_list = list(
        orders_collection.find(
            {},
            {"_id": 0}
        )
        .sort("order_date", -1)
        .limit(limit)
    )

    return [
        serialize_order(order)
        for order in order_list
    ]


# ============================================================
# ORDER SUMMARY
# ============================================================

@router.get("/summary")
def orders_summary():

    all_orders = list(
        orders_collection.find(
            {},
            {
                "_id": 0,
                "status": 1,
                "total_amount": 1
            }
        )
    )

    total_orders = len(all_orders)

    pending_orders = sum(
        1
        for order in all_orders
        if order.get("status") == "Pending"
    )

    completed_orders = sum(
        1
        for order in all_orders
        if order.get("status") == "Completed"
    )

    cancelled_orders = sum(
        1
        for order in all_orders
        if order.get("status") == "Cancelled"
    )

    total_revenue = sum(
        float(order.get("total_amount", 0))
        for order in all_orders
        if order.get("status") == "Completed"
    )

    return {
        "total_orders": total_orders,
        "pending_orders": pending_orders,
        "completed_orders": completed_orders,
        "cancelled_orders": cancelled_orders,
        "total_revenue": round(total_revenue, 2)
    }
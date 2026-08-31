from ..database import db


def get_customer_data(customer_id: str) -> dict:
    """Retrieve customer profile and order history."""

    customer = db["customers"].find_one(
        {"customer_id": customer_id},
        {"_id": 0}
    )

    if not customer:
        return {
            "success": False,
            "error": f"Customer {customer_id} not found."
        }

    orders = list(
        db["orders"].find(
            {"customer_id": customer_id},
            {"_id": 0}
        ).sort("order_date", -1)
    )

    # Convert MongoDB datetime objects to strings
    if customer.get("signup_date"):
        customer["signup_date"] = customer["signup_date"].isoformat()

    for order in orders:
        if order.get("order_date"):
            order["order_date"] = order["order_date"].isoformat()

    completed_orders = [
        order for order in orders
        if order["status"] == "Completed"
    ]

    total_spent = sum(
        order["total_amount"]
        for order in completed_orders
    )

    return {
        "success": True,
        "customer": customer,
        "order_summary": {
            "total_orders": len(orders),
            "completed_orders": len(completed_orders),
            "cancelled_orders": sum(
                1 for order in orders
                if order["status"] == "Cancelled"
            ),
            "refunded_orders": sum(
                1 for order in orders
                if order["status"] == "Refunded"
            ),
            "total_spent": round(total_spent, 2),
            "last_order_date": (
                orders[0]["order_date"]
                if orders
                else None
            ),
        },
        "orders": orders,
    }

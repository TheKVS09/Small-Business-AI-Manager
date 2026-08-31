from ..database import db


def get_product_data(product_id: str) -> dict:
    """Retrieve product information, sales summary, and inventory data."""

    # -----------------------------
    # PRODUCT
    # -----------------------------

    product = db["products"].find_one(
        {"product_id": product_id},
        {"_id": 0}
    )

    if not product:
        return {
            "success": False,
            "error": f"Product {product_id} not found."
        }

    # -----------------------------
    # INVENTORY
    # -----------------------------

    inventory = db["inventory"].find_one(
        {"product_id": product_id},
        {"_id": 0}
    )

    if inventory and inventory.get("last_restocked"):
        inventory["last_restocked"] = (
            inventory["last_restocked"].isoformat()
        )

    # -----------------------------
    # SALES
    # -----------------------------

    order_items = list(
        db["order_items"].find(
            {"product_id": product_id},
            {"_id": 0}
        )
    )

    order_ids = [
        item["order_id"]
        for item in order_items
    ]

    orders = list(
        db["orders"].find(
            {"order_id": {"$in": order_ids}},
            {"_id": 0}
        )
    )

    completed_order_ids = {
        order["order_id"]
        for order in orders
        if order["status"] == "Completed"
    }

    completed_items = [
        item
        for item in order_items
        if item["order_id"] in completed_order_ids
    ]

    units_sold = sum(
        item["quantity"]
        for item in completed_items
    )

    revenue = sum(
        (item["unit_price"] - item["discount"])
        * item["quantity"]
        for item in completed_items
    )

    order_count = len(completed_order_ids)

    # -----------------------------
    # PROFIT
    # -----------------------------

    profit = (
        revenue
        - (units_sold * product["cost_price"])
    )

    # -----------------------------
    # REORDER STATUS
    # -----------------------------

    reorder_required = False

    if inventory:
        reorder_required = (
            inventory["quantity_in_stock"]
            <= inventory["reorder_level"]
        )

    # -----------------------------
    # RESULT
    # -----------------------------

    return {
        "success": True,

        "product": product,

        "sales_summary": {
            "units_sold": units_sold,
            "order_count": order_count,
            "revenue": round(revenue, 2),
            "estimated_profit": round(profit, 2),
        },

        "inventory": inventory,

        "reorder_required": reorder_required,
    }
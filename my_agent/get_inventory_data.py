from database import db


def get_inventory_data(product_id: str) -> dict:
    """Retrieve inventory information for a product."""

    inventory = db["inventory"].find_one(
        {"product_id": product_id},
        {"_id": 0}
    )

    if not inventory:
        return {
            "success": False,
            "error": f"Inventory data for {product_id} not found."
        }

    # Convert datetime to JSON-safe string
    if inventory.get("last_restocked"):
        inventory["last_restocked"] = (
            inventory["last_restocked"].isoformat()
        )

    quantity = inventory["quantity_in_stock"]
    reorder_level = inventory["reorder_level"]

    reorder_required = quantity <= reorder_level

    return {
        "success": True,
        "inventory": inventory,
        "stock_status": (
            "Reorder Required"
            if reorder_required
            else "Stock Available"
        ),
        "reorder_required": reorder_required,
    }
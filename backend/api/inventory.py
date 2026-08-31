from fastapi import APIRouter
from .database import db


router = APIRouter(
    prefix="/api/inventory",
    tags=["Inventory"]
)


products_collection = db["products"]
inventory_collection = db["inventory"]


@router.get("")
def get_inventory():

    products = list(
        products_collection.find(
            {},
            {"_id": 0}
        )
    )

    inventory = list(
        inventory_collection.find(
            {},
            {"_id": 0}
        )
    )

    # product_id -> inventory record
    inventory_lookup = {
        item.get("product_id"): item
        for item in inventory
    }

    result = []

    for product in products:

        product_id = product.get("product_id")

        stock_data = inventory_lookup.get(
            product_id,
            {}
        )

        result.append({
            "product_id": product_id,

            "name": product.get(
                "name",
                "Unnamed Product"
            ),

            "category": product.get(
                "category",
                "-"
            ),

            "price": float(
                product.get(
                    "selling_price",
                    0
                )
            ),

            "stock": int(
                stock_data.get(
                    "quantity_in_stock",
                    0
                )
            ),

            "reorder_level": int(
                stock_data.get(
                    "reorder_level",
                    0
                )
            ),

            "warehouse": stock_data.get(
                "warehouse",
                "-"
            )
        })

    return result
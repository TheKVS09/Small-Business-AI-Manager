from ..database import db


def get_sales_data(limit: int = 100) -> list:
    """
    Retrieve recent sales orders from MongoDB.

    Args:
        limit: Maximum number of orders to return.

    Returns:
        A list of sales orders.
    """

    orders = db["orders"]

    results = list(
        orders.find(
            {},
            {"_id": 0}
        )
        .sort("order_date", -1)
        .limit(limit)
    )

    return results

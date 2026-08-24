import re
import mysql.connector


def sales_push() -> dict:
    """
    Identify customers who are good targets for a sales campaign.

    Select customers who have:
    - A high customer value score
    - Relatively high spending per order
    - Not purchased for a long time

    Returns:
        A list of customers suitable for a sales push.
    """

    connection = mysql.connector.connect(
        host="localhost",
        user="root",
        password="1234",
        database="exam"
    )

    cursor = connection.cursor(dictionary=True)

    cursor.execute("""
        SELECT
            customerid,
            name,
            money_spent_till,
            per_expendeture_range,
            high_value_customer,
            email,
            recent_purchase
        FROM customers
    """)

    customers = cursor.fetchall()

    cursor.close()
    connection.close()

    selected = []

    for customer in customers:

        # Extract spending range
        numbers = re.findall(
            r'\d+',
            str(customer["per_expendeture_range"])
        )

        if len(numbers) >= 2:
            low = int(numbers[0])
            high = int(numbers[1])
            average_expenditure = (low + high) / 2
        else:
            average_expenditure = 0

        # Extract time since purchase
        purchase_text = str(
            customer["recent_purchase"]
        ).lower()

        time_numbers = re.findall(
            r'\d+',
            purchase_text
        )

        if not time_numbers:
            continue

        time_value = int(time_numbers[0])

        if "month" in purchase_text:
            months = time_value
        elif "week" in purchase_text:
            months = time_value / 4
        elif "day" in purchase_text:
            months = time_value / 30
        elif "year" in purchase_text:
            months = time_value * 12
        else:
            months = 0

        # Selection criteria
        high_value = customer["high_value_customer"] >= 7
        high_spender = average_expenditure >= 700
        inactive = months >= 2

        if high_value and high_spender and inactive:

            customer["average_expenditure"] = round(
                average_expenditure
            )

            customer["inactive_months"] = round(
                months, 1
            )

            selected.append(customer)
    selected.sort(
        key=lambda x: (
            x["high_value_customer"],
            x["average_expenditure"],
            x["inactive_months"]
        ),
        reverse=True
    )

    return {
        "status": "success",
        "count": len(selected),
        "customers": selected
    }
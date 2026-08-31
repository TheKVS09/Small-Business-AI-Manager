import random
from datetime import datetime, timedelta
from database import db

# -----------------------------
# CONFIG
# -----------------------------

random.seed(42)

NUM_CUSTOMERS = 200
NUM_PRODUCTS = 30
NUM_ORDERS = 1000
NUM_EXPENSES = 150
NUM_VISITS = 5000

# Clear existing demo data
collections = [
    "customers",
    "products",
    "orders",
    "order_items",
    "expenses",
    "inventory",
    "website_visits",
]

for name in collections:
    db[name].delete_many({})


# -----------------------------
# PRODUCTS
# -----------------------------

categories = [
    "Electronics",
    "Home",
    "Fashion",
    "Beauty",
    "Accessories",
]

products = []

for i in range(1, NUM_PRODUCTS + 1):
    cost = random.randint(200, 2000)
    selling_price = round(cost * random.uniform(1.3, 2.2), 2)

    products.append({
        "product_id": f"P{i:03d}",
        "name": f"Product {i}",
        "category": random.choice(categories),
        "cost_price": cost,
        "selling_price": selling_price,
        "supplier": f"Supplier {random.randint(1, 8)}",
        "active": True,
    })

db["products"].insert_many(products)


# -----------------------------
# CUSTOMERS
# -----------------------------

sources = [
    "Website",
    "Instagram",
    "Google",
    "Referral",
    "Facebook",
]

locations = [
    "Ranchi",
    "Jamshedpur",
    "Dhanbad",
    "Delhi",
    "Kolkata",
    "Bangalore",
    "Mumbai",
]

customers = []

for i in range(1, NUM_CUSTOMERS + 1):
    signup_date = datetime.now() - timedelta(
        days=random.randint(30, 500)
    )

    customers.append({
        "customer_id": f"C{i:04d}",
        "name": f"Customer {i}",
        "email": f"customer{i}@example.com",
        "phone": f"900000{i:04d}",
        "signup_date": signup_date,
        "location": random.choice(locations),
        "customer_segment": random.choice(
            ["New", "Regular", "Premium"]
        ),
        "acquisition_source": random.choice(sources),
    })

db["customers"].insert_many(customers)


# -----------------------------
# INVENTORY
# -----------------------------

inventory = []

for product in products:
    stock = random.randint(5, 100)

    inventory.append({
        "product_id": product["product_id"],
        "quantity_in_stock": stock,
        "reorder_level": random.randint(10, 30),
        "last_restocked": datetime.now()
        - timedelta(days=random.randint(1, 60)),
        "warehouse": random.choice(
            ["Ranchi", "Kolkata", "Delhi"]
        ),
    })

db["inventory"].insert_many(inventory)


# -----------------------------
# ORDERS + ORDER ITEMS
# -----------------------------

orders = []
order_items = []

today = datetime.now()

for i in range(1, NUM_ORDERS + 1):

    # Older orders are healthier.
    # Recent orders deliberately decline.
    days_ago = random.randint(0, 180)

    order_date = today - timedelta(days=days_ago)

    # Reduce probability of orders in the recent 30 days
    if days_ago < 30 and random.random() < 0.45:
        continue

    customer = random.choice(customers)

    num_items = random.randint(1, 4)

    selected_products = random.sample(
        products,
        min(num_items, len(products))
    )

    total_amount = 0
    order_item_list = []

    for product in selected_products:
        quantity = random.randint(1, 3)

        # Recent orders have slightly lower quantities
        if days_ago < 30:
            quantity = random.randint(1, 2)

        unit_price = product["selling_price"]

        discount = 0

        if random.random() < 0.25:
            discount = round(
                unit_price * random.uniform(0.05, 0.20),
                2
            )

        total_amount += (
            (unit_price - discount) * quantity
        )

        order_item_list.append({
            "product_id": product["product_id"],
            "quantity": quantity,
            "unit_price": unit_price,
            "discount": discount,
        })

    order_id = f"O{i:05d}"

    status = random.choices(
        ["Completed", "Cancelled", "Refunded"],
        weights=[90, 7, 3],
    )[0]

    order = {
        "order_id": order_id,
        "customer_id": customer["customer_id"],
        "order_date": order_date,
        "status": status,
        "payment_method": random.choice(
            ["UPI", "Card", "Cash", "Net Banking"]
        ),
        "total_amount": round(total_amount, 2),
        "discount": round(
            random.uniform(0, 200), 2
        ),
        "channel": random.choice(
            ["Website", "Store", "Instagram"]
        ),
    }

    orders.append(order)

    for j, item in enumerate(order_item_list):
        order_items.append({
            "order_item_id": f"OI{i:05d}_{j+1}",
            "order_id": order_id,
            **item,
        })

db["orders"].insert_many(orders)

if order_items:
    db["order_items"].insert_many(order_items)


# -----------------------------
# EXPENSES
# -----------------------------

expense_categories = [
    "Marketing",
    "Salary",
    "Rent",
    "Technology",
    "Logistics",
    "Utilities",
]

expenses = []

for i in range(1, NUM_EXPENSES + 1):

    days_ago = random.randint(0, 180)

    amount = random.randint(1000, 30000)

    category = random.choice(expense_categories)

    # Deliberately increase recent marketing expenses
    if days_ago < 30 and category == "Marketing":
        amount = random.randint(20000, 50000)

    expenses.append({
        "expense_id": f"E{i:04d}",
        "date": today - timedelta(days=days_ago),
        "category": category,
        "amount": amount,
        "description": f"{category} expense",
        "recurring": random.choice([True, False]),
    })

db["expenses"].insert_many(expenses)


# -----------------------------
# WEBSITE VISITS
# -----------------------------

website_visits = []

for i in range(1, NUM_VISITS + 1):

    days_ago = random.randint(0, 180)

    # Lower conversion rate recently
    if days_ago < 30:
        conversion_probability = 0.06
    else:
        conversion_probability = 0.12

    converted = random.random() < conversion_probability

    website_visits.append({
        "visit_id": f"V{i:05d}",
        "date": today - timedelta(days=days_ago),
        "visitor_id": f"VISITOR_{random.randint(1, 3500)}",
        "source": random.choice(sources),
        "device": random.choice(
            ["Mobile", "Desktop", "Tablet"]
        ),
        "product_id": random.choice(products)["product_id"],
        "converted": converted,
        "order_id": None,
    })

db["website_visits"].insert_many(website_visits)


# -----------------------------
# INDEXES
# -----------------------------

db["customers"].create_index("customer_id")
db["products"].create_index("product_id")
db["orders"].create_index("order_id")
db["orders"].create_index("customer_id")
db["orders"].create_index("order_date")
db["order_items"].create_index("order_id")
db["order_items"].create_index("product_id")
db["inventory"].create_index("product_id")
db["expenses"].create_index("date")
db["website_visits"].create_index("date")


# -----------------------------
# SUMMARY
# -----------------------------

print("\n✅ Database seeded successfully!\n")

for name in collections:
    count = db[name].count_documents({})
    print(f"{name}: {count} documents")

print("\nDatabase:", db.name)
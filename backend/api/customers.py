
from datetime import datetime, timedelta

from fastapi import APIRouter, Query

from .database import db


router = APIRouter(
    prefix="/api/customers",
    tags=["Customers"]
)

customers = db["customers"]


# ============================================================
# SERIALIZE CUSTOMER
# ============================================================

def serialize_customer(customer):

    signup_date = customer.get("signup_date")

    if isinstance(signup_date, datetime):
        signup_date = signup_date.isoformat()

    return {
        "customer_id": customer.get("customer_id"),
        "name": customer.get("name"),
        "email": customer.get("email"),
        "phone": customer.get("phone"),
        "signup_date": signup_date,
        "location": customer.get("location"),
        "customer_segment": customer.get("customer_segment"),
        "acquisition_source": customer.get("acquisition_source"),
    }


# ============================================================
# GET CUSTOMERS
# ============================================================

@router.get("")
def get_customers(
    limit: int = Query(100, ge=1, le=500)
):

    customer_list = list(
        customers.find(
            {},
            {"_id": 0}
        )
        .sort("signup_date", -1)
        .limit(limit)
    )

    return [
        serialize_customer(customer)
        for customer in customer_list
    ]


# ============================================================
# CUSTOMER SUMMARY
# ============================================================

@router.get("/summary")
def customers_summary():

    all_customers = list(
        customers.find(
            {},
            {"_id": 0}
        )
    )

    total_customers = len(all_customers)

    # --------------------------------------------------------
    # NEW CUSTOMERS THIS MONTH
    # --------------------------------------------------------

    now = datetime.now()

    month_start = datetime(
        now.year,
        now.month,
        1
    )

    new_this_month = 0

    for customer in all_customers:

        signup_date = customer.get(
            "signup_date"
        )

        if isinstance(signup_date, datetime):

            if signup_date >= month_start:
                new_this_month += 1


    # --------------------------------------------------------
    # CUSTOMER SEGMENTS
    # --------------------------------------------------------

    segment_counts = {}

    for customer in all_customers:

        segment = customer.get(
            "customer_segment"
        ) or "Unknown"

        segment_counts[segment] = (
            segment_counts.get(segment, 0) + 1
        )


    # --------------------------------------------------------
    # ACQUISITION SOURCES
    # --------------------------------------------------------

    acquisition_counts = {}

    for customer in all_customers:

        source = customer.get(
            "acquisition_source"
        ) or "Unknown"

        acquisition_counts[source] = (
            acquisition_counts.get(source, 0) + 1
        )


    # --------------------------------------------------------
    # LOCATIONS
    # --------------------------------------------------------

    location_counts = {}

    for customer in all_customers:

        location = customer.get(
            "location"
        ) or "Unknown"

        location_counts[location] = (
            location_counts.get(location, 0) + 1
        )


    return {
        "total_customers": total_customers,
        "new_this_month": new_this_month,
        "segments": segment_counts,
        "acquisition_sources": acquisition_counts,
        "locations": location_counts,
    }

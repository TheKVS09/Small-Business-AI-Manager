from ..database import db
from datetime import datetime, timedelta


def get_website_analytics(days: int = 30) -> dict:
    """Analyze website traffic and conversion performance."""

    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)

    previous_end_date = start_date
    previous_start_date = previous_end_date - timedelta(days=days)

    # ---------------------------------
    # GET VISITS
    # ---------------------------------

    current_visits = list(
        db["website_visits"].find(
            {
                "date": {
                    "$gte": start_date,
                    "$lte": end_date
                }
            },
            {"_id": 0}
        )
    )

    previous_visits = list(
        db["website_visits"].find(
            {
                "date": {
                    "$gte": previous_start_date,
                    "$lt": previous_end_date
                }
            },
            {"_id": 0}
        )
    )

    # ---------------------------------
    # ANALYSIS HELPER
    # ---------------------------------

    def analyze_visits(visits):
        total_visits = len(visits)

        conversions = sum(
            1
            for visit in visits
            if visit["converted"]
        )

        conversion_rate = (
            (conversions / total_visits) * 100
            if total_visits
            else 0
        )

        # -----------------------------
        # TRAFFIC BY SOURCE
        # -----------------------------

        traffic_by_source = {}

        for visit in visits:
            source = visit["source"]

            traffic_by_source[source] = (
                traffic_by_source.get(source, 0) + 1
            )

        # -----------------------------
        # CONVERSIONS BY SOURCE
        # -----------------------------

        conversions_by_source = {}

        for visit in visits:
            if visit["converted"]:
                source = visit["source"]

                conversions_by_source[source] = (
                    conversions_by_source.get(source, 0) + 1
                )

        # -----------------------------
        # CONVERSION RATE BY SOURCE
        # -----------------------------

        conversion_rate_by_source = {}

        for source, traffic in traffic_by_source.items():

            source_conversions = conversions_by_source.get(
                source,
                0
            )

            conversion_rate_by_source[source] = round(
                (source_conversions / traffic) * 100,
                2
            ) if traffic else 0

        # -----------------------------
        # TRAFFIC BY DEVICE
        # -----------------------------

        traffic_by_device = {}

        for visit in visits:
            device = visit["device"]

            traffic_by_device[device] = (
                traffic_by_device.get(device, 0) + 1
            )

        # -----------------------------
        # CONVERSIONS BY DEVICE
        # -----------------------------

        conversions_by_device = {}

        for visit in visits:
            if visit["converted"]:
                device = visit["device"]

                conversions_by_device[device] = (
                    conversions_by_device.get(device, 0) + 1
                )

        # -----------------------------
        # CONVERSION RATE BY DEVICE
        # -----------------------------

        conversion_rate_by_device = {}

        for device, traffic in traffic_by_device.items():

            device_conversions = conversions_by_device.get(
                device,
                0
            )

            conversion_rate_by_device[device] = round(
                (device_conversions / traffic) * 100,
                2
            ) if traffic else 0

        # -----------------------------
        # PRODUCT INTEREST
        # -----------------------------

        product_interest = {}

        for visit in visits:
            product_id = visit["product_id"]

            product_interest[product_id] = (
                product_interest.get(product_id, 0) + 1
            )

        return {
            "total_visits": total_visits,
            "conversions": conversions,
            "conversion_rate": round(
                conversion_rate,
                2
            ),
            "traffic_by_source": traffic_by_source,
            "conversions_by_source": conversions_by_source,
            "conversion_rate_by_source":
                conversion_rate_by_source,
            "traffic_by_device": traffic_by_device,
            "conversions_by_device": conversions_by_device,
            "conversion_rate_by_device":
                conversion_rate_by_device,
            "product_interest": product_interest,
        }

    # ---------------------------------
    # ANALYZE BOTH PERIODS
    # ---------------------------------

    current = analyze_visits(current_visits)
    previous = analyze_visits(previous_visits)

    # ---------------------------------
    # PERCENTAGE CHANGE
    # ---------------------------------

    def percentage_change(current_value, previous_value):
        if previous_value == 0:
            return None

        return round(
            (
                (current_value - previous_value)
                / previous_value
            ) * 100,
            2
        )

    # ---------------------------------
    # RETURN
    # ---------------------------------

    return {
        "success": True,

        "period": {
            "days": days,
            "current_start": start_date.isoformat(),
            "current_end": end_date.isoformat(),
            "previous_start":
                previous_start_date.isoformat(),
            "previous_end":
                previous_end_date.isoformat(),
        },

        "current_period": current,

        "previous_period": previous,

        "changes": {
            "visits_change_percent":
                percentage_change(
                    current["total_visits"],
                    previous["total_visits"]
                ),

            "conversions_change_percent":
                percentage_change(
                    current["conversions"],
                    previous["conversions"]
                ),

            "conversion_rate_change_percent":
                percentage_change(
                    current["conversion_rate"],
                    previous["conversion_rate"]
                ),
        },
    }
def get_marketing_data():
    """Returns marketing performance data for the demo business."""

    return {
        "monthly_leads": [
            {"month": "March", "leads": 520},
            {"month": "April", "leads": 515},
            {"month": "May", "leads": 510},
            {"month": "June", "leads": 505},
            {"month": "July", "leads": 495},
            {"month": "August", "leads": 500},
        ],
        "campaigns": [
            {
                "name": "Spring Promotion",
                "spend": 8000,
                "leads": 180,
                "conversions": 25,
            },
            {
                "name": "Summer Campaign",
                "spend": 9000,
                "leads": 160,
                "conversions": 18,
            },
            {
                "name": "Customer Win-Back",
                "spend": 3000,
                "leads": 90,
                "conversions": 15,
            },
        ],
    }
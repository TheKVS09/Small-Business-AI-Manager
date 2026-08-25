def get_business_data():
    """Single source of truth for the demo business."""

    return {
        "sales": {
            "monthly": [
                {"month": "March", "revenue": 120000, "orders": 240},
                {"month": "April", "revenue": 115000, "orders": 230},
                {"month": "May", "revenue": 108000, "orders": 220},
                {"month": "June", "revenue": 98000, "orders": 205},
                {"month": "July", "revenue": 87000, "orders": 190},
                {"month": "August", "revenue": 76000, "orders": 175},
            ],
            "leads": {
                "current": 500,
                "previous": 520,
                "conversion_rate": 7.5,
                "previous_conversion_rate": 9.8,
            },
            "customers": {
                "new": 82,
                "returning": 93,
                "previous_returning": 125,
            },
        },

        "marketing": {
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
        },

        "finance": {
            "monthly": [
                {"month": "March", "revenue": 120000, "expenses": 78000},
                {"month": "April", "revenue": 115000, "expenses": 76000},
                {"month": "May", "revenue": 108000, "expenses": 75000},
                {"month": "June", "revenue": 98000, "expenses": 73000},
                {"month": "July", "revenue": 87000, "expenses": 70000},
                {"month": "August", "revenue": 76000, "expenses": 68000},
            ],
            "expense_categories": {
                "inventory": 28000,
                "payroll": 22000,
                "marketing": 9000,
                "operations": 6000,
                "other": 3000,
            },
            "cash_balance": 125000,
        },
    }
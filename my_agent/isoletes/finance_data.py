def get_financial_data():
    """Returns financial data for the demo business."""

    return {
        "monthly_financials": [
            {
                "month": "March",
                "revenue": 120000,
                "expenses": 78000,
            },
            {
                "month": "April",
                "revenue": 115000,
                "expenses": 76000,
            },
            {
                "month": "May",
                "revenue": 108000,
                "expenses": 75000,
            },
            {
                "month": "June",
                "revenue": 98000,
                "expenses": 73000,
            },
            {
                "month": "July",
                "revenue": 87000,
                "expenses": 70000,
            },
            {
                "month": "August",
                "revenue": 76000,
                "expenses": 68000,
            },
        ],
        "expense_categories": {
            "inventory": 28000,
            "payroll": 22000,
            "marketing": 9000,
            "operations": 6000,
            "other": 3000,
        },
        "cash_balance": 125000,
    }
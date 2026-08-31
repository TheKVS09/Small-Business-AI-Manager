"""
display_schema.py

Display Schema Tool for the SmallBiz AI Manager.

Purpose:
    Provides the Display Agent with the exact response structure
    that must be returned to the React frontend.

The Display Agent should NEVER return arbitrary markdown/HTML.
It should return JSON following the format provided by this tool.
"""


# ============================================================
# DISPLAY SCHEMA
# ============================================================

def display_schema():
    """
    Return the supported response components and their schemas.

    This function is intended to be used as a tool by the
    Display Agent.
    """

    return {
        "name": "SmallBiz Display Engine",

        "description": (
            "Defines the only allowed response format for the "
            "SmallBiz AI Manager React frontend. "
            "The Display Agent must convert business analysis "
            "into these structured components."
        ),

        # ====================================================
        # ROOT RESPONSE FORMAT
        # ====================================================

        "response_format": {

            "type": "object",

            "required": [
                "type",
                "title",
                "components"
            ],

            "properties": {

                "type": {
                    "type": "string",
                    "allowed": [
                        "response",
                        "report",
                        "analysis",
                        "recommendation"
                    ]
                },

                "title": {
                    "type": "string"
                },

                "components": {
                    "type": "array",
                    "description": (
                        "Ordered list of visual components "
                        "that React should render."
                    )
                }

            }
        },

        # ====================================================
        # AVAILABLE COMPONENTS
        # ====================================================

        "components": {

            # ------------------------------------------------
            # TEXT
            # ------------------------------------------------

            "text": {

                "description":
                    "Normal explanatory text.",

                "format": {

                    "type": "text",

                    "content":
                        "string"
                }
            },

            # ------------------------------------------------
            # HEADING
            # ------------------------------------------------

            "heading": {

                "description":
                    "Section heading.",

                "format": {

                    "type": "heading",

                    "level": 1,

                    "text":
                        "Section title"
                }
            },

            # ------------------------------------------------
            # METRIC
            # ------------------------------------------------

            "metric": {

                "description": (
                    "Use for an important single business "
                    "number such as revenue, orders, profit, "
                    "customers or budget."
                ),

                "format": {

                    "type": "metric",

                    "label":
                        "Revenue",

                    "value":
                        89377.50,

                    "format":
                        "currency",

                    "change":
                        -47.79,

                    "change_label":
                        "vs previous period"
                },

                "allowed_formats": [
                    "currency",
                    "number",
                    "percentage",
                    "text"
                ]
            },

            # ------------------------------------------------
            # SUMMARY
            # ------------------------------------------------

            "summary": {

                "description": (
                    "A group of important metrics displayed "
                    "together."
                ),

                "format": {

                    "type": "summary",

                    "title":
                        "Sales Overview",

                    "items": [

                        {
                            "label":
                                "Revenue",

                            "value":
                                89377.50,

                            "format":
                                "currency"
                        },

                        {
                            "label":
                                "Orders",

                            "value":
                                11,

                            "format":
                                "number"
                        },

                        {
                            "label":
                                "AOV",

                            "value":
                                8125.23,

                            "format":
                                "currency"
                        }

                    ]
                }
            },

            # ------------------------------------------------
            # TABLE
            # ------------------------------------------------

            "table": {

                "description": (
                    "Use when multiple records need to be "
                    "displayed in rows and columns."
                ),

                "format": {

                    "type":
                        "table",

                    "title":
                        "Channel Performance",

                    "columns": [

                        "Channel",
                        "Sales",
                        "Orders"
                    ],

                    "rows": [

                        [
                            "Instagram",
                            14155.90,
                            2
                        ],

                        [
                            "Store",
                            31177.13,
                            4
                        ],

                        [
                            "Website",
                            44044.47,
                            5
                        ]
                    ]
                }
            },

            # ------------------------------------------------
            # CHART
            # ------------------------------------------------

            "chart": {

                "description": (
                    "Use when numerical data can be better "
                    "understood visually."
                ),

                "format": {

                    "type":
                        "chart",

                    "chart_type":
                        "bar",

                    "title":
                        "Sales by Channel",

                    "data": [

                        {
                            "label":
                                "Instagram",

                            "value":
                                14155.90
                        },

                        {
                            "label":
                                "Store",

                            "value":
                                31177.13
                        },

                        {
                            "label":
                                "Website",

                            "value":
                                44044.47
                        }

                    ],

                    "value_format":
                        "currency"
                },

                "allowed_chart_types": [

                    "bar",
                    "line",
                    "area",
                    "pie",
                    "donut"
                ],

                "chart_selection_rules": {

                    "bar": (
                        "Use for comparing categories."
                    ),

                    "line": (
                        "Use for time-based trends."
                    ),

                    "area": (
                        "Use for time-based trends "
                        "where magnitude is important."
                    ),

                    "pie": (
                        "Use for simple percentage "
                        "distribution."
                    ),

                    "donut": (
                        "Use for percentage or budget "
                        "distribution."
                    )
                }
            },

            # ------------------------------------------------
            # INSIGHT
            # ------------------------------------------------

            "insight": {

                "description": (
                    "Important finding discovered by "
                    "the AI."
                ),

                "format": {

                    "type":
                        "insight",

                    "title":
                        "AI Insight",

                    "content":
                        "Website is currently the strongest sales channel."
                }
            },

            # ------------------------------------------------
            # RECOMMENDATION
            # ------------------------------------------------

            "recommendation": {

                "description": (
                    "Action that the business should take."
                ),

                "format": {

                    "type":
                        "recommendation",

                    "title":
                        "AI Recommendation",

                    "content":
                        "Increase website marketing allocation."
                }
            },

            # ------------------------------------------------
            # WARNING
            # ------------------------------------------------

            "warning": {

                "description": (
                    "Important problem, risk or warning."
                ),

                "format": {

                    "type":
                        "warning",

                    "title":
                        "Warning",

                    "content":
                        "Instagram sales declined significantly."
                }
            },

            # ------------------------------------------------
            # PROGRESS
            # ------------------------------------------------

            "progress": {

                "description": (
                    "Use for a percentage or progress "
                    "measurement."
                ),

                "format": {

                    "type":
                        "progress",

                    "label":
                        "Marketing Budget Used",

                    "value":
                        35000,

                    "max":
                        50000,

                    "format":
                        "currency"
                }
            },

            # ------------------------------------------------
            # ACTION
            # ------------------------------------------------

            "action": {

                "description": (
                    "A frontend action button. Use only "
                    "when the user needs to approve or "
                    "execute an action."
                ),

                "format": {

                    "type":
                        "action",

                    "label":
                        "Place Order",

                    "action":
                        "place_restock_order",

                    "data": {}
                }
            }

        },

        # ====================================================
        # GLOBAL RULES
        # ====================================================

        "rules": [

            "Always return valid JSON.",

            "Never return HTML.",

            "Never return markdown.",

            "Never return a long unstructured paragraph "
            "when structured components can represent "
            "the information.",

            "Use multiple components when appropriate.",

            "Use a table for structured multi-row data.",

            "Use a metric for important single values.",

            "Use a bar chart for category comparisons.",

            "Use a line chart for time-series data.",

            "Use a pie or donut chart for distributions.",

            "Use a donut chart for budget allocation.",

            "Use an insight component for important findings.",

            "Use a recommendation component for suggested "
            "business actions.",

            "Use a warning component for risks or problems.",

            "Use an action component only when an actual "
            "frontend action is available.",

            "Do not invent data.",

            "Only use data provided by the Main Agent or "
            "available business data.",

            "Keep components in logical display order."
        ],

        # ====================================================
        # EXAMPLE
        # ====================================================

        "example": {

            "type":
                "report",

            "title":
                "Sales Performance — Last 7 Days",

            "components": [

                {
                    "type":
                        "summary",

                    "title":
                        "Sales Overview",

                    "items": [

                        {
                            "label":
                                "Revenue",

                            "value":
                                89377.50,

                            "format":
                                "currency"
                        },

                        {
                            "label":
                                "Orders",

                            "value":
                                11,

                            "format":
                                "number"
                        },

                        {
                            "label":
                                "Average Order Value",

                            "value":
                                8125.23,

                            "format":
                                "currency"
                        }

                    ]
                },

                {
                    "type":
                        "chart",

                    "chart_type":
                        "bar",

                    "title":
                        "Sales by Channel",

                    "data": [

                        {
                            "label":
                                "Instagram",

                            "value":
                                14155.90
                        },

                        {
                            "label":
                                "Store",

                            "value":
                                31177.13
                        },

                        {
                            "label":
                                "Website",

                            "value":
                                44044.47
                        }

                    ],

                    "value_format":
                        "currency"
                },

                {
                    "type":
                        "insight",

                    "title":
                        "AI Insight",

                    "content":
                        "Website is currently the strongest "
                        "sales channel."
                },

                {
                    "type":
                        "recommendation",

                    "title":
                        "AI Recommendation",

                    "content":
                        "Investigate the decline in Instagram "
                        "performance before increasing its "
                        "marketing budget."
                }

            ]
        }
    }
import React, { useEffect, useMemo, useState } from "react";
import "./dashboard.css";
import API_URL from "../api";

// ============================================================
// AI BUILDING PLAN
// ============================================================

const PLAN_STEPS = {
    marketing: [
        "Reviewing marketing channels",
        "Checking customer retention data",
        "Calculating optimal budget split",
        "Finalizing recommendation",
    ],

    order: [
        "Checking current inventory",
        "Analyzing sales velocity",
        "Scanning market trends",
        "Calculating restock quantities",
        "Finalizing recommendation",
    ],

    retention: [
        "Reviewing customer purchase history",
        "Identifying high-value customers",
        "Scoring retention likelihood",
        "Finalizing recommendation",
    ],
};


// ============================================================
// AI BUILDING PLAN COMPONENT
// ============================================================

function AIBuildingPlan({ planType }) {

    const steps =
        PLAN_STEPS[planType] || PLAN_STEPS.marketing;

    const [activeStep, setActiveStep] = useState(0);

    useEffect(() => {

        setActiveStep(0);

        const interval = setInterval(() => {

            setActiveStep((previous) => {

                if (previous >= steps.length - 1) {
                    return previous;
                }

                return previous + 1;
            });

        }, 1300);

        return () => clearInterval(interval);

    }, [planType, steps.length]);

    const progress =
        ((activeStep + 1) / steps.length) * 100;

    return (
        <div className="ai-building-plan">

            <div className="ai-building-progress-track">

                <div
                    className="ai-building-progress-fill"
                    style={{
                        width: `${progress}%`,
                    }}
                />

            </div>

            <div className="ai-building-header">

                <div className="ai-building-orb">
                    <span>✦</span>
                </div>

                <div>

                    <h3>
                        AI is building your plan
                    </h3>

                    <p>
                        Analyzing your business data —
                        this usually takes a few seconds.
                    </p>

                </div>

            </div>

            <ul className="ai-building-steps">

                {steps.map((step, index) => {

                    const status =
                        index < activeStep
                            ? "done"
                            : index === activeStep
                                ? "active"
                                : "pending";

                    return (
                        <li
                            className={`ai-building-step ${status}`}
                            key={step}
                        >

                            <div className="ai-building-step-marker">

                                <span className="ai-building-step-icon">
                                    {status === "done"
                                        ? "✓"
                                        : index + 1}
                                </span>

                                {index !== steps.length - 1 && (
                                    <span className="ai-building-step-line" />
                                )}

                            </div>

                            <span className="ai-building-step-label">
                                {step}
                            </span>

                        </li>
                    );

                })}

            </ul>

        </div>
    );
}


// ============================================================
// DASHBOARD
// ============================================================

function Dashboard() {

    // =========================================================
    // BUSINESS DASHBOARD STATE
    // =========================================================

    const [summary, setSummary] = useState(null);
    const [chartData, setChartData] = useState([]);
    const [sales, setSales] = useState([]);
    const [inventory, setInventory] = useState([]);

    const [dashboardPeriod, setDashboardPeriod] = useState("7");

    const [dashboardLoading, setDashboardLoading] = useState(true);
    const [dashboardError, setDashboardError] = useState("");


    // =========================================================
    // AI PLANNER STATE
    // =========================================================

    const [budget, setBudget] = useState(50000);

    const [planType, setPlanType] =
        useState("marketing");

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState("");

    const [recommendations, setRecommendations] =
        useState([]);

    const [selectedItem, setSelectedItem] =
        useState(null);

    const [actionMessage, setActionMessage] =
        useState("");


    // =========================================================
    // LOAD DASHBOARD DATA
    // =========================================================

    useEffect(() => {

        const loadDashboard = async () => {

            try {

                setDashboardLoading(true);
                setDashboardError("");

                const [
                    summaryResponse,
                    chartResponse,
                    salesResponse,
                    inventoryResponse,
                ] = await Promise.all([

                    fetch(
                        `${API_URL}/api/sales/summary?period=${dashboardPeriod}`
                    ),

                    fetch(
                        `${API_URL}/api/sales/chart?period=${dashboardPeriod}`
                    ),

                    fetch(
                        `${API_URL}/api/sales?limit=10`
                    ),

                    fetch(
                        `${API_URL}/api/inventory`
                    ),
                ]);

                if (
                    !summaryResponse.ok ||
                    !chartResponse.ok ||
                    !salesResponse.ok ||
                    !inventoryResponse.ok
                ) {
                    throw new Error(
                        "One or more dashboard requests failed"
                    );
                }

                const [
                    summaryResult,
                    chartResult,
                    salesResult,
                    inventoryResult,
                ] = await Promise.all([

                    summaryResponse.json(),
                    chartResponse.json(),
                    salesResponse.json(),
                    inventoryResponse.json(),
                ]);

                setSummary(summaryResult);

                setChartData(
                    Array.isArray(chartResult)
                        ? chartResult
                        : []
                );

                setSales(
                    Array.isArray(salesResult)
                        ? salesResult
                        : []
                );

                setInventory(
                    Array.isArray(inventoryResult)
                        ? inventoryResult
                        : []
                );

            } catch (err) {

                console.error(
                    "DASHBOARD ERROR:",
                    err
                );

                setDashboardError(
                    "Unable to load dashboard data."
                );

            } finally {

                setDashboardLoading(false);

            }

        };

        loadDashboard();

    }, [dashboardPeriod]);


    // =========================================================
    // FORMATTING
    // =========================================================

    const formatCurrency = (value) => {

        return new Intl.NumberFormat(
            "en-IN",
            {
                style: "currency",
                currency: "INR",
                maximumFractionDigits: 0,
            }
        ).format(Number(value) || 0);

    };


    const formatNumber = (value) => {

        return new Intl.NumberFormat(
            "en-IN"
        ).format(Number(value) || 0);

    };


    const formatDate = (value) => {

        if (!value) {
            return "-";
        }

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return value;
        }

        return date.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
            }
        );

    };


    // =========================================================
    // LOW STOCK
    // =========================================================

    const lowStockProducts = useMemo(() => {

        if (!Array.isArray(inventory)) {
            return [];
        }

        return inventory
            .filter((product) => {

                const stock = Number(
                    product.stock ??
                    product.quantity ??
                    product.current_stock ??
                    0
                );

                const threshold = Number(
                    product.low_stock_threshold ??
                    product.reorder_level ??
                    10
                );

                return stock <= threshold;

            })
            .sort((a, b) => {

                const stockA = Number(
                    a.stock ??
                    a.quantity ??
                    a.current_stock ??
                    0
                );

                const stockB = Number(
                    b.stock ??
                    b.quantity ??
                    b.current_stock ??
                    0
                );

                return stockA - stockB;

            })
            .slice(0, 5);

    }, [inventory]);


    // =========================================================
    // CHART
    // =========================================================

    const maxChartValue = useMemo(() => {

        if (!chartData.length) {
            return 1;
        }

        return Math.max(
            ...chartData.map(
                (item) =>
                    Number(item.total) || 0
            ),
            1
        );

    }, [chartData]);


    // =========================================================
    // AI RECOMMENDATION
    // =========================================================

    const loadAIRecommendation = async () => {

        setLoading(true);
        setError("");
        setActionMessage("");
        setRecommendations([]);
        setSelectedItem(null);

        try {

            const response = await fetch(
                `${API_URL}/api/dashboard/analyze`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",
                    },

                    body: JSON.stringify({
                        budget: budget,
                        plan_type: planType,
                    }),
                }
            );

            if (!response.ok) {

                let serverMessage =
                    `Server returned ${response.status}`;

                try {

                    const errorData =
                        await response.json();

                    if (errorData?.detail) {
                        serverMessage =
                            typeof errorData.detail === "string"
                                ? errorData.detail
                                : JSON.stringify(
                                    errorData.detail
                                );
                    }

                } catch {
                    // Keep default error message
                }

                throw new Error(serverMessage);
            }

            const data =
                await response.json();

            const results =
                Array.isArray(
                    data.recommendations
                )
                    ? data.recommendations
                    : [];

            setRecommendations(results);

            if (results.length > 0) {
                setSelectedItem(results[0]);
            }

        } catch (err) {

            console.error(
                "AI RECOMMENDATION ERROR:",
                err
            );

            setError(
                err.message ||
                "Unable to generate AI recommendation."
            );

            setRecommendations([]);
            setSelectedItem(null);

        } finally {

            setLoading(false);

        }

    };


    // =========================================================
    // PLAN CHANGE
    // =========================================================

    const handlePlanChange = (event) => {

        setPlanType(
            event.target.value
        );

        setRecommendations([]);
        setSelectedItem(null);
        setActionMessage("");
        setError("");

    };


    // =========================================================
    // BUDGET CHANGE
    // =========================================================

    const handleBudgetChange = (event) => {

        const value =
            Number(event.target.value);

        setBudget(
            value >= 0
                ? value
                : 0
        );

    };


    // =========================================================
    // MARKETING TOTALS
    // =========================================================

    const totalAllocated =
        recommendations.reduce(
            (total, item) =>
                total +
                Number(item.amount || 0),
            0
        );

    const remainingBudget =
        budget -
        totalAllocated;


    // =========================================================
    // UPDATE MARKETING ALLOCATION
    // =========================================================

    const updateAllocation = (
        itemName,
        amount
    ) => {

        const newAmount =
            Math.max(
                0,
                Number(amount) || 0
            );

        setRecommendations(
            (previous) =>
                previous.map(
                    (item) => {

                        if (
                            item.name !==
                            itemName
                        ) {
                            return item;
                        }

                        return {
                            ...item,

                            amount:
                                newAmount,

                            percentage:
                                budget > 0
                                    ? Math.round(
                                        (
                                            newAmount /
                                            budget
                                        ) *
                                        100
                                    )
                                    : 0,
                        };

                    }
                )
        );

        setSelectedItem(
            (previous) => {

                if (
                    !previous ||
                    previous.name !== itemName
                ) {
                    return previous;
                }

                return {
                    ...previous,
                    amount: newAmount,
                    percentage:
                        budget > 0
                            ? Math.round(
                                (
                                    newAmount /
                                    budget
                                ) *
                                100
                            )
                            : 0,
                };

            }
        );

    };


    // =========================================================
    // APPLY MARKETING
    // =========================================================

    const applyAllocation = async () => {

        setActionMessage("");

        try {

            const response = await fetch(
                `${API_URL}/api/marketing/apply`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",
                    },

                    body: JSON.stringify({

                        budget,

                        allocations:
                            recommendations,

                    }),
                }
            );

            if (!response.ok) {

                throw new Error(
                    "Unable to apply allocation"
                );

            }

            setActionMessage(
                "AI marketing allocation applied successfully."
            );

        } catch (err) {

            console.error(err);

            setActionMessage(
                "Marketing allocation is ready for approval."
            );

        }

    };


    // =========================================================
    // PLACE RESTOCK ORDER
    // =========================================================

    const placeOrder = async (
        product
    ) => {

        try {

            const response = await fetch(
                `${API_URL}/api/marketing/restock/order`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",
                    },

                    body: JSON.stringify({

                        product_id:
                            product.product_id,

                        quantity:
                            product.quantity,

                        amount:
                            product.amount,

                    }),
                }
            );

            if (!response.ok) {

                throw new Error(
                    "Order could not be placed"
                );

            }

            setActionMessage(
                `Restock order prepared for ${product.name}.`
            );

        } catch (err) {

            console.error(err);

            setActionMessage(
                `Order ready for ${product.name}.`
            );

        }

    };


    // =========================================================
    // AI TITLE
    // =========================================================

    const getTitle = () => {

        if (planType === "marketing") {
            return "AI Marketing Allocation";
        }

        if (planType === "order") {
            return "AI Restock Recommendation";
        }

        return "AI Customer Retention Plan";

    };


    // =========================================================
    // AI DESCRIPTION
    // =========================================================

    const getDescription = () => {

        if (planType === "marketing") {

            return (
                "AI has divided your marketing budget based on "
                + "actual business performance."
            );

        }

        if (planType === "order") {

            return (
                "AI has analyzed inventory and demand to "
                + "recommend products that should be restocked."
            );

        }

        return (
            "AI has identified customers who represent "
            + "strong retention opportunities."
        );

    };


    // =========================================================
    // DASHBOARD LOADING
    // =========================================================

    if (dashboardLoading) {

        return (
            <div className="dashboard">

                <div className="dashboard-loading">

                    <div className="loading-spinner"></div>

                    <p>
                        Loading your business dashboard...
                    </p>

                </div>

            </div>
        );

    }


    // =========================================================
    // DASHBOARD ERROR
    // =========================================================

    if (
        dashboardError &&
        !summary
    ) {

        return (
            <div className="dashboard">

                <div className="dashboard-error">

                    <h3>
                        Unable to load dashboard
                    </h3>

                    <p>
                        {dashboardError}
                    </p>

                </div>

            </div>
        );

    }


    // =========================================================
    // RENDER
    // =========================================================

    return (

        <div className="dashboard">

            {/* =================================================
                BUSINESS DASHBOARD HEADER
            ================================================= */}

            <div className="dashboard-header">

                <div>

                    <h2>
                        Dashboard
                    </h2>

                    <p>
                        Overview of your business performance
                    </p>

                </div>

                <button
                    className="add-sale-btn"
                    onClick={() =>
                        window.location.href =
                        "/sales"
                    }
                >
                    + Add Sale
                </button>

            </div>


            {/* =================================================
                SUMMARY CARDS
            ================================================= */}

            <div className="stats-grid">

                <div className="stat-card">

                    <div className="stat-icon sales-icon">
                        ₹
                    </div>

                    <div>

                        <p>
                            Total Sales
                        </p>

                        <h3>
                            {formatCurrency(
                                summary?.total_sales
                            )}
                        </h3>

                        <span className="positive">
                            {formatNumber(
                                summary?.total_transactions
                            )} completed transactions
                        </span>

                    </div>

                </div>


                <div className="stat-card">

                    <div className="stat-icon order-icon">
                        🛒
                    </div>

                    <div>

                        <p>
                            Total Orders
                        </p>

                        <h3>
                            {formatNumber(
                                summary?.total_transactions
                            )}
                        </h3>

                        <span className="positive">
                            {formatNumber(
                                summary?.pending_orders
                            )} pending
                        </span>

                    </div>

                </div>


                <div className="stat-card">

                    <div className="stat-icon inventory-icon">
                        📦
                    </div>

                    <div>

                        <p>
                            Inventory Items
                        </p>

                        <h3>
                            {formatNumber(
                                inventory.length
                            )}
                        </h3>

                        <span className="warning">
                            {formatNumber(
                                lowStockProducts.length
                            )} items need attention
                        </span>

                    </div>

                </div>


                <div className="stat-card">

                    <div className="stat-icon expense-icon">
                        💸
                    </div>

                    <div>

                        <p>
                            Average Order
                        </p>

                        <h3>
                            {formatCurrency(
                                summary?.average_order
                            )}
                        </h3>

                        <span className="negative">
                            {formatNumber(
                                summary?.cancelled_orders
                            )} cancelled
                        </span>

                    </div>

                </div>

            </div>


            {/* =================================================
                SALES + LOW STOCK
            ================================================= */}

            <div className="dashboard-grid">

                {/* SALES OVERVIEW */}

                <div className="dashboard-card sales-overview">

                    <div className="card-header">

                        <div>

                            <h3>
                                Sales Overview
                            </h3>

                            <p>
                                Sales performance for the selected period
                            </p>

                        </div>

                        <select
                            value={dashboardPeriod}
                            onChange={(event) =>
                                setDashboardPeriod(
                                    event.target.value
                                )
                            }
                        >

                            <option value="7">
                                Last 7 Days
                            </option>

                            <option value="30">
                                Last 30 Days
                            </option>

                            <option value="6months">
                                Last 6 Months
                            </option>

                            <option value="year">
                                Last Year
                            </option>

                        </select>

                    </div>


                    <div className="chart">

                        {chartData.length === 0 ? (

                            <div className="chart-empty">
                                No sales data available.
                            </div>

                        ) : (

                            chartData.map(
                                (item) => {

                                    const value =
                                        Number(
                                            item.total
                                        ) || 0;

                                    const height =
                                        Math.max(
                                            (
                                                value /
                                                maxChartValue
                                            ) *
                                            100,
                                            3
                                        );

                                    return (

                                        <div
                                            className="bar-container"
                                            key={
                                                item.sale_date
                                            }
                                        >

                                            <strong className="bar-value">
                                                {formatCurrency(
                                                    value
                                                )}
                                            </strong>

                                            <div
                                                className="bar"
                                                style={{
                                                    height:
                                                        `${height}%`,
                                                }}
                                                title={`${formatDate(
                                                    item.sale_date
                                                )}: ${formatCurrency(
                                                    value
                                                )}`}
                                            />

                                            <span>
                                                {new Date(
                                                    item.sale_date
                                                ).toLocaleDateString(
                                                    "en-IN",
                                                    {
                                                        day: "2-digit",
                                                        month: "short",
                                                    }
                                                )}
                                            </span>

                                        </div>

                                    );

                                }
                            )

                        )}

                    </div>

                </div>


                {/* LOW STOCK */}

                <div className="dashboard-card">

                    <div className="card-header">

                        <div>

                            <h3>
                                Low Stock
                            </h3>

                            <p>
                                Products that need attention
                            </p>

                        </div>

                        <button
                            className="view-btn"
                            onClick={() =>
                                window.location.href =
                                "/inventory"
                            }
                        >
                            View All
                        </button>

                    </div>


                    <div className="product-list">

                        {lowStockProducts.length === 0 ? (

                            <div className="empty-small">
                                ✓ No low-stock products
                            </div>

                        ) : (

                            lowStockProducts.map(
                                (product, index) => {

                                    const stock =
                                        Number(
                                            product.stock ??
                                            product.quantity ??
                                            product.current_stock ??
                                            0
                                        );

                                    return (

                                        <div
                                            className="product-item"
                                            key={
                                                product.product_id ||
                                                product.sku ||
                                                index
                                            }
                                        >

                                            <div>

                                                <strong>
                                                    {
                                                        product.name ||
                                                        "Unnamed Product"
                                                    }
                                                </strong>

                                                <span>
                                                    SKU:{" "}
                                                    {
                                                        product.sku ||
                                                        product.product_id ||
                                                        "-"
                                                    }
                                                </span>

                                            </div>

                                            <b
                                                className={
                                                    stock <= 5
                                                        ? "stock-low"
                                                        : "stock-warning"
                                                }
                                            >
                                                {stock} left
                                            </b>

                                        </div>

                                    );

                                }
                            )

                        )}

                    </div>

                </div>

            </div>


            {/* =================================================
                RECENT ORDERS
            ================================================= */}

            <div className="dashboard-card recent-orders">

                <div className="card-header">

                    <div>

                        <h3>
                            Recent Orders
                        </h3>

                        <p>
                            Latest customer orders
                        </p>

                    </div>

                    <button
                        className="view-btn"
                        onClick={() =>
                            window.location.href =
                            "/orders"
                        }
                    >
                        View All
                    </button>

                </div>


                <div className="table-container">

                    <table>

                        <thead>

                            <tr>
                                <th>Order ID</th>
                                <th>Customer</th>
                                <th>Product</th>
                                <th>Amount</th>
                                <th>Status</th>
                                <th>Date</th>
                            </tr>

                        </thead>

                        <tbody>

                            {sales.length === 0 ? (

                                <tr>

                                    <td
                                        colSpan="6"
                                        className="empty-table"
                                    >
                                        No recent orders found.
                                    </td>

                                </tr>

                            ) : (

                                sales.slice(0, 10).map(
                                    (sale, index) => (

                                        <tr
                                            key={
                                                `${sale.order_id}-${index}`
                                            }
                                        >

                                            <td>
                                                #{sale.order_id}
                                            </td>

                                            <td>
                                                {sale.customer}
                                            </td>

                                            <td>
                                                {sale.product}
                                            </td>

                                            <td>
                                                {formatCurrency(
                                                    sale.amount
                                                )}
                                            </td>

                                            <td>

                                                <span
                                                    className={`status ${String(
                                                        sale.status ||
                                                        ""
                                                    ).toLowerCase()
                                                        }`}
                                                >
                                                    {
                                                        sale.status ||
                                                        "Unknown"
                                                    }
                                                </span>

                                            </td>

                                            <td>
                                                {formatDate(
                                                    sale.sale_date
                                                )}
                                            </td>

                                        </tr>

                                    )
                                )

                            )}

                        </tbody>

                    </table>

                </div>

            </div>


            {/* =================================================
                AI BUSINESS PLANNER
            ================================================= */}

            <div className="ai-planner-divider"></div>

            <div className="ai-planner-page">

                <div className="planner-header">

                    <div>

                        <h1>
                            AI Business Planner
                        </h1>

                        <p>
                            Give AI a budget and let it
                            decide the best business action.
                        </p>

                    </div>

                </div>


                {/* =================================================
                    AI CONTROLS
                ================================================= */}

                <div className="planner-controls">

                    <div className="budget-control">

                        <label>
                            Budget
                        </label>

                        <div className="budget-input">

                            <span>
                                ₹
                            </span>

                            <input
                                type="number"
                                value={budget}
                                min="0"
                                disabled={loading}
                                onChange={
                                    handleBudgetChange
                                }
                            />

                        </div>

                    </div>


                    <div className="plan-control">

                        <label>
                            Plan for
                        </label>

                        <select
                            value={planType}
                            disabled={loading}
                            onChange={
                                handlePlanChange
                            }
                        >

                            <option value="order">
                                Order
                            </option>

                            <option value="marketing">
                                Marketing
                            </option>

                            <option value="retention">
                                Customer Retention
                            </option>

                        </select>

                    </div>


                    <button
                        className="analyze-btn"
                        disabled={
                            loading ||
                            budget <= 0
                        }
                        onClick={
                            loadAIRecommendation
                        }
                    >

                        {loading
                            ? "Analyzing..."
                            : "Analyze"
                        }

                    </button>

                </div>


                {/* =================================================
                    ERROR
                ================================================= */}

                {error && (

                    <div className="action-message danger-text">
                        ⚠ {error}
                    </div>

                )}


                {/* =================================================
                    AI LAYOUT
                ================================================= */}

                <div className="planner-layout">

                    <div className="planner-main">

                        <div className="section-heading">

                            <div>

                                <h2>
                                    {getTitle()}
                                </h2>

                                <p>
                                    {getDescription()}
                                </p>

                            </div>

                        </div>


                        {loading ? (

                            <AIBuildingPlan
                                planType={planType}
                            />

                        ) : (

                            <>

                                {/* =================================
                                    MARKETING
                                ================================= */}

                                {planType === "marketing" && (

                                    recommendations.length === 0 ? (

                                        <div className="empty-state">

                                            <span>
                                                ✦
                                            </span>

                                            <h3>
                                                Ready when you are
                                            </h3>

                                            <p>
                                                Click Analyze to let AI
                                                allocate your marketing
                                                budget.
                                            </p>

                                        </div>

                                    ) : (

                                        <div className="marketing-card">

                                            <div className="marketing-card-header">

                                                <div>

                                                    <span>
                                                        Total Marketing Budget
                                                    </span>

                                                    <h2>
                                                        {formatCurrency(
                                                            budget
                                                        )}
                                                    </h2>

                                                </div>

                                                <div className="ai-badge">
                                                    ✦ AI Optimized
                                                </div>

                                            </div>


                                            <div className="allocation-list">

                                                {recommendations.map(
                                                    (item, index) => {

                                                        const percentage =
                                                            budget > 0
                                                                ? (
                                                                    Number(
                                                                        item.amount ||
                                                                        0
                                                                    ) /
                                                                    budget
                                                                ) *
                                                                100
                                                                : 0;

                                                        return (

                                                            <div
                                                                className={`allocation-item ${selectedItem?.name ===
                                                                        item.name
                                                                        ? "selected"
                                                                        : ""
                                                                    }`}
                                                                key={
                                                                    item.name ||
                                                                    index
                                                                }
                                                                onClick={() =>
                                                                    setSelectedItem(
                                                                        item
                                                                    )
                                                                }
                                                            >

                                                                <div className="allocation-top">

                                                                    <div className="platform-info">

                                                                        <div className="platform-icon">

                                                                            {item.name
                                                                                ?.charAt(
                                                                                    0
                                                                                )
                                                                                .toUpperCase()}

                                                                        </div>

                                                                        <div>

                                                                            <strong>
                                                                                {
                                                                                    item.name
                                                                                }
                                                                            </strong>

                                                                            <span>
                                                                                AI recommended
                                                                            </span>

                                                                        </div>

                                                                    </div>


                                                                    <div className="allocation-money">

                                                                        <strong>
                                                                            {formatCurrency(
                                                                                item.amount
                                                                            )}
                                                                        </strong>

                                                                        <span>
                                                                            {Math.round(
                                                                                percentage
                                                                            )}
                                                                            %
                                                                        </span>

                                                                    </div>

                                                                </div>


                                                                <div className="allocation-bar">

                                                                    <div
                                                                        className="allocation-fill"
                                                                        style={{
                                                                            width:
                                                                                `${Math.min(
                                                                                    percentage,
                                                                                    100
                                                                                )}%`,
                                                                        }}
                                                                    />

                                                                </div>


                                                                <div className="allocation-bottom">

                                                                    <span>
                                                                        Customer retention
                                                                    </span>

                                                                    <strong>
                                                                        {
                                                                            item.retention ??
                                                                            "--"
                                                                        }
                                                                        %
                                                                    </strong>

                                                                </div>


                                                                <div
                                                                    className="allocation-edit"
                                                                    onClick={(
                                                                        event
                                                                    ) =>
                                                                        event.stopPropagation()
                                                                    }
                                                                >

                                                                    <label>
                                                                        Allocation
                                                                    </label>

                                                                    <div className="amount-editor">

                                                                        <span>
                                                                            ₹
                                                                        </span>

                                                                        <input
                                                                            type="number"
                                                                            value={
                                                                                item.amount
                                                                            }
                                                                            min="0"
                                                                            onChange={(
                                                                                event
                                                                            ) =>
                                                                                updateAllocation(
                                                                                    item.name,
                                                                                    event.target.value
                                                                                )
                                                                            }
                                                                        />

                                                                    </div>

                                                                </div>

                                                            </div>

                                                        );

                                                    }
                                                )}

                                            </div>


                                            <div className="allocation-summary">

                                                <div>

                                                    <span>
                                                        Total allocated
                                                    </span>

                                                    <strong>
                                                        {formatCurrency(
                                                            totalAllocated
                                                        )}
                                                    </strong>

                                                </div>


                                                <div>

                                                    <span>
                                                        Remaining
                                                    </span>

                                                    <strong
                                                        className={
                                                            remainingBudget < 0
                                                                ? "danger-text"
                                                                : ""
                                                        }
                                                    >
                                                        {formatCurrency(
                                                            remainingBudget
                                                        )}
                                                    </strong>

                                                </div>


                                                <button
                                                    className="apply-btn"
                                                    disabled={
                                                        remainingBudget < 0
                                                    }
                                                    onClick={
                                                        applyAllocation
                                                    }
                                                >
                                                    Apply Allocation
                                                </button>

                                            </div>

                                        </div>

                                    )

                                )}


                                {/* =================================
                                    ORDER
                                ================================= */}

                                {planType === "order" && (

                                    <div className="order-grid">

                                        {recommendations.length === 0 ? (

                                            <div className="empty-state">

                                                <span>
                                                    ✦
                                                </span>

                                                <h3>
                                                    Ready when you are
                                                </h3>

                                                <p>
                                                    Click Analyze to let AI
                                                    recommend your restock
                                                    products.
                                                </p>

                                            </div>

                                        ) : (

                                            recommendations.map(
                                                (
                                                    product,
                                                    index
                                                ) => (

                                                    <div
                                                        className="product-card"
                                                        key={
                                                            product.product_id ||
                                                            index
                                                        }
                                                        onClick={() =>
                                                            setSelectedItem(
                                                                product
                                                            )
                                                        }
                                                    >

                                                        <span className="product-id">
                                                            {
                                                                product.product_id
                                                            }
                                                        </span>

                                                        <h3>
                                                            {
                                                                product.name
                                                            }
                                                        </h3>

                                                        <span className="product-category">
                                                            {
                                                                product.category
                                                            }
                                                        </span>


                                                        <div className="product-stock">

                                                            <span>
                                                                Current stock
                                                            </span>

                                                            <strong>
                                                                {
                                                                    product.current_stock
                                                                }
                                                            </strong>

                                                        </div>


                                                        <div className="quantity-row">

                                                            <span>
                                                                Recommended quantity
                                                            </span>

                                                            <strong>
                                                                {
                                                                    product.quantity
                                                                }
                                                            </strong>

                                                        </div>


                                                        <div className="product-price">

                                                            <span>
                                                                Estimated cost
                                                            </span>

                                                            <strong>
                                                                {formatCurrency(
                                                                    product.amount
                                                                )}
                                                            </strong>

                                                        </div>


                                                        <button
                                                            className="order-btn"
                                                            onClick={(
                                                                event
                                                            ) => {

                                                                event.stopPropagation();

                                                                placeOrder(
                                                                    product
                                                                );

                                                            }}
                                                        >
                                                            Place Order
                                                        </button>

                                                    </div>

                                                )
                                            )

                                        )}

                                    </div>

                                )}


                                {/* =================================
                                    RETENTION
                                ================================= */}

                                {planType === "retention" && (

                                    recommendations.length === 0 ? (

                                        <div className="empty-state">

                                            <span>
                                                ♡
                                            </span>

                                            <h3>
                                                Ready when you are
                                            </h3>

                                            <p>
                                                Click Analyze to let AI
                                                identify your best
                                                customer retention
                                                opportunities.
                                            </p>

                                        </div>

                                    ) : (

                                        <div className="retention-results">

                                            {recommendations.map(
                                                (
                                                    customer,
                                                    index
                                                ) => (

                                                    <div
                                                        className="retention-result-card"
                                                        key={
                                                            customer.customer_id ||
                                                            customer.id ||
                                                            index
                                                        }
                                                        onClick={() =>
                                                            setSelectedItem(
                                                                customer
                                                            )
                                                        }
                                                    >

                                                        <div className="retention-result-icon">
                                                            ♡
                                                        </div>

                                                        <div>

                                                            <h3>
                                                                {
                                                                    customer.name ||
                                                                    customer.customer_name ||
                                                                    customer.customer_id
                                                                }
                                                            </h3>

                                                            <p>
                                                                {
                                                                    customer.reason ||
                                                                    "AI identified this customer as a strong retention opportunity."
                                                                }
                                                            </p>

                                                        </div>

                                                    </div>

                                                )
                                            )}

                                        </div>

                                    )

                                )}

                            </>

                        )}


                        {/* =================================================
                            ACTION MESSAGE
                        ================================================= */}

                        {actionMessage && (

                            <div className="action-message">

                                ✓ {actionMessage}

                            </div>

                        )}

                    </div>


                    {/* =================================================
                        AI INSIGHT PANEL
                    ================================================= */}

                    <aside className="ai-insight-panel">

                        <div className="insight-header">

                            <div className="insight-ai-icon">
                                ✦
                            </div>

                            <div>

                                <h2>
                                    AI Insight
                                </h2>

                                <span>
                                    Decision explanation
                                </span>

                            </div>

                        </div>


                        <div className="insight-body">

                            {!selectedItem ? (

                                <div className="insight-empty">

                                    <div>
                                        ✦
                                    </div>

                                    <p>
                                        Select a recommendation
                                        to see why AI chose it.
                                    </p>

                                </div>

                            ) : (

                                <>

                                    <div className="insight-selected">

                                        <span>
                                            AI recommendation
                                        </span>

                                        <h3>
                                            {
                                                selectedItem.name ||
                                                selectedItem.customer_name ||
                                                selectedItem.customer_id ||
                                                selectedItem.product_id
                                            }
                                        </h3>

                                    </div>


                                    <div className="insight-section">

                                        <h4>
                                            Why this?
                                        </h4>

                                        <p>
                                            {
                                                selectedItem.reason ||
                                                "AI selected this option based on historical business data and current conditions."
                                            }
                                        </p>

                                    </div>


                                    {planType === "marketing" && (

                                        <>

                                            <div className="insight-section">

                                                <h4>
                                                    Why this amount?
                                                </h4>

                                                <p>
                                                    AI allocated{" "}
                                                    {formatCurrency(
                                                        selectedItem.amount
                                                    )}{" "}
                                                    based on historical
                                                    performance and
                                                    customer data.
                                                </p>

                                            </div>


                                            <div className="insight-stat">

                                                <span>
                                                    Allocation
                                                </span>

                                                <strong>
                                                    {
                                                        selectedItem.percentage ??
                                                        "--"
                                                    }%
                                                </strong>

                                            </div>


                                            <div className="insight-stat">

                                                <span>
                                                    Customer retention
                                                </span>

                                                <strong>
                                                    {
                                                        selectedItem.retention ??
                                                        "--"
                                                    }%
                                                </strong>

                                            </div>

                                        </>

                                    )}


                                    {planType === "order" && (

                                        <>

                                            <div className="insight-section">

                                                <h4>
                                                    Why this quantity?
                                                </h4>

                                                <p>
                                                    {
                                                        selectedItem.reason ||
                                                        "AI calculated the recommended quantity using current inventory and demand."
                                                    }
                                                </p>

                                            </div>


                                            <div className="insight-stat">

                                                <span>
                                                    Current stock
                                                </span>

                                                <strong>
                                                    {
                                                        selectedItem.current_stock ??
                                                        "--"
                                                    }
                                                </strong>

                                            </div>


                                            <div className="insight-stat">

                                                <span>
                                                    Recommended quantity
                                                </span>

                                                <strong>
                                                    {
                                                        selectedItem.quantity ??
                                                        "--"
                                                    }
                                                </strong>

                                            </div>

                                        </>

                                    )}


                                    {planType === "retention" && (

                                        <>

                                            <div className="insight-section">

                                                <h4>
                                                    Retention opportunity
                                                </h4>

                                                <p>
                                                    {
                                                        selectedItem.reason ||
                                                        "AI identified this customer using purchase history, value and likelihood of responding to a personalized offer."
                                                    }
                                                </p>

                                            </div>

                                        </>

                                    )}

                                </>

                            )}

                        </div>


                        <div className="insight-footer">

                            <span>
                                ✦ Based on your business data
                            </span>

                        </div>

                    </aside>

                </div>

            </div>

        </div>
    );
}

export default Dashboard;

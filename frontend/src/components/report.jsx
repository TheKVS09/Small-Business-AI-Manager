import React, { useCallback, useEffect, useMemo, useState } from "react";
import "./report.css";
import API_URL from "../api";


function Report() {

    // =====================================================
    // STATE
    // =====================================================

    const [report, setReport] = useState(null);
    const [trend, setTrend] = useState([]);

    const [days, setDays] = useState(30);

    const [loading, setLoading] = useState(true);
    const [trendLoading, setTrendLoading] = useState(true);

    const [error, setError] = useState("");


    // =====================================================
    // FETCH SUMMARY
    // =====================================================

    const fetchReport = useCallback(async () => {

        try {

            setLoading(true);
            setError("");

            const response = await fetch(
                `${API_URL}/api/reports/summary?days=${days}`
            );

            if (!response.ok) {
                throw new Error(
                    `Summary request failed: ${response.status}`
                );
            }

            const data = await response.json();

            if (!data || typeof data !== "object") {
                throw new Error(
                    "Invalid summary response."
                );
            }

            setReport(data);

        } catch (err) {

            console.error(
                "Reports summary error:",
                err
            );

            setError(
                "Unable to load report data."
            );

        } finally {

            setLoading(false);

        }

    }, [days]);


    // =====================================================
    // FETCH TREND
    // =====================================================

    const fetchTrend = useCallback(async () => {

        try {

            setTrendLoading(true);

            const response = await fetch(
                `${API_URL}/api/reports/trend?days=${days}`
            );

            if (!response.ok) {
                throw new Error(
                    `Trend request failed: ${response.status}`
                );
            }

            const data = await response.json();

            setTrend(
                Array.isArray(data?.data)
                    ? data.data
                    : []
            );

        } catch (err) {

            console.error(
                "Reports trend error:",
                err
            );

            setTrend([]);

        } finally {

            setTrendLoading(false);

        }

    }, [days]);


    // =====================================================
    // LOAD
    // =====================================================

    useEffect(() => {

        fetchReport();
        fetchTrend();

    }, [fetchReport, fetchTrend]);


    // =====================================================
    // REFRESH
    // =====================================================

    const handleRefresh = () => {

        fetchReport();
        fetchTrend();

    };


    // =====================================================
    // FORMAT CURRENCY
    // =====================================================

    const formatCurrency = (value) => {

        const number = Number(value);

        return new Intl.NumberFormat(
            "en-IN",
            {
                style: "currency",
                currency: "INR",
                maximumFractionDigits: 0,
            }
        ).format(
            Number.isFinite(number)
                ? number
                : 0
        );

    };


    // =====================================================
    // FORMAT PERCENTAGE
    // =====================================================

    const formatPercentage = (value) => {

        const number = Number(value);

        return `${(
            Number.isFinite(number)
                ? number
                : 0
        ).toFixed(2)}%`;

    };


    // =====================================================
    // PERIOD LABEL
    // =====================================================

    const getPeriodLabel = () => {

        switch (days) {

            case 7:
                return "Last 7 Days";

            case 30:
                return "Last 30 Days";

            case 180:
                return "Last 6 Months";

            case 365:
                return "Last Year";

            default:
                return `Last ${days} Days`;

        }

    };


    // =====================================================
    // TREND DESCRIPTION
    // =====================================================

    const getTrendDescription = () => {

        const periodType =
            report?.trend_period_type ||
            (
                days <= 30
                    ? "daily"
                    : days <= 180
                        ? "weekly"
                        : "monthly"
            );

        switch (periodType) {

            case "daily":
                return "Daily revenue, expenses and profit";

            case "weekly":
                return "Weekly revenue, expenses and profit";

            case "monthly":
                return "Monthly revenue, expenses and profit";

            default:
                return "Revenue, expenses and profit";

        }

    };


    // =====================================================
    // TREND LABEL
    // =====================================================

    const getTrendLabel = (item) => {

        if (item?.label) {
            return item.label;
        }

        return item?.date || "";

    };


    // =====================================================
    // DATA
    // =====================================================

    const summary =
        report?.summary || {};

    const salesByChannel =
        Array.isArray(
            report?.sales_by_channel
        )
            ? report.sales_by_channel
            : [];

    const expensesByCategory =
        Array.isArray(
            report?.expenses_by_category
        )
            ? report.expenses_by_category
            : [];

    const customerSegments =
        Array.isArray(
            report?.customer_segments
        )
            ? report.customer_segments
            : [];


    // =====================================================
    // CUSTOMER VALUES
    // =====================================================

    const totalCustomers =
        Number(
            summary?.customers?.total || 0
        );

    const newCustomers =
        Number(
            summary?.customers?.new || 0
        );


    // =====================================================
    // MAX VALUES
    // =====================================================

    const maxChannelAmount = useMemo(() => {

        if (!salesByChannel.length) {
            return 1;
        }

        return Math.max(
            ...salesByChannel.map(
                item =>
                    Number(item?.amount || 0)
            ),
            1
        );

    }, [salesByChannel]);


    const maxExpenseAmount = useMemo(() => {

        if (!expensesByCategory.length) {
            return 1;
        }

        return Math.max(
            ...expensesByCategory.map(
                item =>
                    Number(item?.amount || 0)
            ),
            1
        );

    }, [expensesByCategory]);


    const maxSegmentCount = useMemo(() => {

        if (!customerSegments.length) {
            return 1;
        }

        return Math.max(
            ...customerSegments.map(
                item =>
                    Number(item?.count || 0)
            ),
            1
        );

    }, [customerSegments]);


    const maxTrendValue = useMemo(() => {

        if (!trend.length) {
            return 1;
        }

        return Math.max(
            ...trend.flatMap(
                item => [
                    Number(item?.revenue || 0),
                    Number(item?.expenses || 0),
                    Math.abs(
                        Number(item?.profit || 0)
                    ),
                ]
            ),
            1
        );

    }, [trend]);


    // =====================================================
    // LOADING
    // =====================================================

    if (loading && !report) {

        return (
            <div className="report-page">

                <div className="report-loading">
                    Loading report...
                </div>

            </div>
        );

    }


    // =====================================================
    // ERROR
    // =====================================================

    if (error && !report) {

        return (
            <div className="report-page">

                <div className="report-error">

                    <strong>
                        Something went wrong
                    </strong>

                    <span>
                        {error}
                    </span>

                    <button
                        onClick={handleRefresh}
                    >
                        Try Again
                    </button>

                </div>

            </div>
        );

    }


    // =====================================================
    // RENDER
    // =====================================================

    return (

        <div className="report-page">

            {/* =================================================
                HEADER
            ================================================= */}

            <div className="report-header">

                <div>

                    <h1>
                        Reports
                    </h1>

                    <p>
                        Analyze your business performance and
                        financial health.
                    </p>

                </div>


                <div className="report-actions">

                    <div className="period-selector">

                        {[7, 30, 180, 365].map(
                            period => (

                                <button
                                    key={period}
                                    className={
                                        days === period
                                            ? "active"
                                            : ""
                                    }
                                    onClick={() =>
                                        setDays(period)
                                    }
                                >
                                    {period === 180
                                        ? "6M"
                                        : period === 365
                                            ? "1Y"
                                            : `${period}D`}
                                </button>

                            )
                        )}

                    </div>


                    <button
                        className="report-refresh"
                        onClick={handleRefresh}
                        disabled={
                            loading ||
                            trendLoading
                        }
                    >

                        <span className="refresh-icon">
                            ↻
                        </span>

                        <span>
                            Refresh
                        </span>

                    </button>

                </div>

            </div>


            {/* =================================================
                PERIOD
            ================================================= */}

            <div className="report-period">

                <span>
                    {getPeriodLabel()}
                </span>

                {(loading || trendLoading) && (

                    <span className="updating">
                        Updating...
                    </span>

                )}

            </div>


            {/* =================================================
                KPI GRID
            ================================================= */}

            <div className="report-kpi-grid">

                <div className="report-kpi-card">

                    <div className="kpi-top">

                        <span className="kpi-label">
                            Total Revenue
                        </span>

                        <span className="kpi-icon">
                            ₹
                        </span>

                    </div>

                    <strong className="kpi-value">

                        {formatCurrency(
                            summary.total_revenue
                        )}

                    </strong>

                    <span className="kpi-description">
                        From completed orders
                    </span>

                </div>


                <div className="report-kpi-card">

                    <div className="kpi-top">

                        <span className="kpi-label">
                            Total Expenses
                        </span>

                        <span className="kpi-icon">
                            ↗
                        </span>

                    </div>

                    <strong className="kpi-value">

                        {formatCurrency(
                            summary.total_expenses
                        )}

                    </strong>

                    <span className="kpi-description">

                        {formatPercentage(
                            summary.expense_ratio
                        )}

                        {" "}of revenue

                    </span>

                </div>


                <div className="report-kpi-card highlight">

                    <div className="kpi-top">

                        <span className="kpi-label">
                            Net Profit
                        </span>

                        <span className="kpi-icon">
                            ✦
                        </span>

                    </div>

                    <strong className="kpi-value">

                        {formatCurrency(
                            summary.net_profit
                        )}

                    </strong>

                    <span className="kpi-description">

                        {formatPercentage(
                            summary.profit_margin
                        )}

                        {" "}profit margin

                    </span>

                </div>


                <div className="report-kpi-card">

                    <div className="kpi-top">

                        <span className="kpi-label">
                            Completed Orders
                        </span>

                        <span className="kpi-icon">
                            #
                        </span>

                    </div>

                    <strong className="kpi-value">
                        {summary.total_orders || 0}
                    </strong>

                    <span className="kpi-description">

                        {summary.cancelled_orders || 0}
                        {" "}cancelled

                    </span>

                </div>


                <div className="report-kpi-card">

                    <div className="kpi-top">

                        <span className="kpi-label">
                            Average Order
                        </span>

                        <span className="kpi-icon">
                            ◉
                        </span>

                    </div>

                    <strong className="kpi-value">

                        {formatCurrency(
                            summary.average_order_value
                        )}

                    </strong>

                    <span className="kpi-description">
                        Average completed order
                    </span>

                </div>


                <div className="report-kpi-card">

                    <div className="kpi-top">

                        <span className="kpi-label">
                            Customers
                        </span>

                        <span className="kpi-icon">
                            👥
                        </span>

                    </div>

                    <strong className="kpi-value">
                        {totalCustomers}
                    </strong>

                    <span className="kpi-description">

                        {newCustomers}
                        {" "}new this period

                    </span>

                </div>

            </div>


            {/* =================================================
                PERFORMANCE TREND
            ================================================= */}

            <div className="report-card report-trend-card">

                <div className="report-card-header">

                    <div>

                        <h2>
                            Business Performance
                        </h2>

                        <p>
                            {getTrendDescription()}
                        </p>

                    </div>

                </div>


                {trendLoading ? (

                    <div className="report-empty">
                        Loading performance data...
                    </div>

                ) : trend.length === 0 ? (

                    <div className="report-empty">
                        No performance data available.
                    </div>

                ) : (

                    <div className="trend-chart">

                        <div className="trend-legend">

                            <span>
                                <i className="legend-revenue" />
                                Revenue
                            </span>

                            <span>
                                <i className="legend-expenses" />
                                Expenses
                            </span>

                            <span>
                                <i className="legend-profit" />
                                Profit
                            </span>

                        </div>


                        <div
                            className={
                                `trend-bars ${
                                    trend.length > 30
                                        ? "trend-scrollable"
                                        : ""
                                }`
                            }
                        >

                            {trend.map(
                                (item, index) => {

                                    const revenue =
                                        Number(
                                            item?.revenue || 0
                                        );

                                    const expenses =
                                        Number(
                                            item?.expenses || 0
                                        );

                                    const profit =
                                        Number(
                                            item?.profit || 0
                                        );


                                    const revenueHeight =
                                        revenue > 0
                                            ? Math.max(
                                                (
                                                    revenue /
                                                    maxTrendValue
                                                ) * 100,
                                                2
                                            )
                                            : 0;


                                    const expenseHeight =
                                        expenses > 0
                                            ? Math.max(
                                                (
                                                    expenses /
                                                    maxTrendValue
                                                ) * 100,
                                                2
                                            )
                                            : 0;


                                    const profitHeight =
                                        profit !== 0
                                            ? Math.max(
                                                (
                                                    Math.abs(
                                                        profit
                                                    ) /
                                                    maxTrendValue
                                                ) * 100,
                                                2
                                            )
                                            : 0;


                                    return (

                                        <div
                                            className="trend-day"
                                            key={
                                                `${item?.date}-${index}`
                                            }
                                        >

                                            <div className="trend-bars-group">

                                                <div
                                                    className="trend-bar revenue-bar"
                                                    style={{
                                                        height:
                                                            `${revenueHeight}%`,
                                                    }}
                                                    title={
                                                        `Revenue: ${formatCurrency(
                                                            revenue
                                                        )}`
                                                    }
                                                />


                                                <div
                                                    className="trend-bar expense-bar"
                                                    style={{
                                                        height:
                                                            `${expenseHeight}%`,
                                                    }}
                                                    title={
                                                        `Expenses: ${formatCurrency(
                                                            expenses
                                                        )}`
                                                    }
                                                />


                                                <div
                                                    className={
                                                        `trend-bar profit-bar ${
                                                            profit < 0
                                                                ? "negative"
                                                                : ""
                                                        }`
                                                    }
                                                    style={{
                                                        height:
                                                            `${profitHeight}%`,
                                                    }}
                                                    title={
                                                        `Profit: ${formatCurrency(
                                                            profit
                                                        )}`
                                                    }
                                                />

                                            </div>


                                            <span className="trend-date">
                                                {getTrendLabel(item)}
                                            </span>

                                        </div>

                                    );

                                }
                            )}

                        </div>

                    </div>

                )}

            </div>


            {/* =================================================
                MAIN REPORT GRID
            ================================================= */}

            <div className="report-grid">

                {/* SALES CHANNEL */}

                <div className="report-card">

                    <div className="report-card-header">

                        <div>

                            <h2>
                                Sales by Channel
                            </h2>

                            <p>
                                Revenue contribution
                            </p>

                        </div>

                    </div>


                    {salesByChannel.length === 0 ? (

                        <div className="report-empty">
                            No sales data available.
                        </div>

                    ) : (

                        <div className="channel-list">

                            {salesByChannel.map(
                                (item, index) => {

                                    const amount =
                                        Number(
                                            item?.amount || 0
                                        );

                                    const percentage =
                                        Number(
                                            summary.total_revenue || 0
                                        ) > 0
                                            ? (
                                                amount /
                                                Number(
                                                    summary.total_revenue
                                                )
                                            ) * 100
                                            : 0;

                                    const width =
                                        (
                                            amount /
                                            maxChannelAmount
                                        ) * 100;


                                    return (

                                        <div
                                            className="channel-item"
                                            key={
                                                `${item?.channel}-${index}`
                                            }
                                        >

                                            <div className="channel-info">

                                                <span>
                                                    {item?.channel || "Other"}
                                                </span>

                                                <strong>
                                                    {formatCurrency(amount)}
                                                </strong>

                                            </div>


                                            <div className="channel-bar">

                                                <div
                                                    className="channel-bar-fill"
                                                    style={{
                                                        width:
                                                            `${width}%`,
                                                    }}
                                                />

                                            </div>


                                            <span className="channel-percentage">

                                                {percentage.toFixed(1)}%

                                            </span>

                                        </div>

                                    );

                                }
                            )}

                        </div>

                    )}

                </div>


                {/* EXPENSES */}

                <div className="report-card">

                    <div className="report-card-header">

                        <div>

                            <h2>
                                Expenses by Category
                            </h2>

                            <p>
                                Where your money is going
                            </p>

                        </div>

                    </div>


                    {expensesByCategory.length === 0 ? (

                        <div className="report-empty">
                            No expense data available.
                        </div>

                    ) : (

                        <div className="expense-list">

                            {expensesByCategory.map(
                                (item, index) => {

                                    const amount =
                                        Number(
                                            item?.amount || 0
                                        );

                                    const width =
                                        (
                                            amount /
                                            maxExpenseAmount
                                        ) * 100;


                                    return (

                                        <div
                                            className="expense-item"
                                            key={
                                                `${item?.category}-${index}`
                                            }
                                        >

                                            <div className="expense-info">

                                                <span>
                                                    {item?.category || "Other"}
                                                </span>

                                                <strong>
                                                    {formatCurrency(amount)}
                                                </strong>

                                            </div>


                                            <div className="expense-bar">

                                                <div
                                                    className="expense-bar-fill"
                                                    style={{
                                                        width:
                                                            `${width}%`,
                                                    }}
                                                />

                                            </div>

                                        </div>

                                    );

                                }
                            )}

                        </div>

                    )}

                </div>


                {/* CUSTOMER SEGMENTS */}

                <div className="report-card">

                    <div className="report-card-header">

                        <div>

                            <h2>
                                Customer Segments
                            </h2>

                            <p>
                                Customer distribution
                            </p>

                        </div>

                    </div>


                    {customerSegments.length === 0 ? (

                        <div className="report-empty">
                            No customer segment data available.
                        </div>

                    ) : (

                        <div className="segment-list">

                            {customerSegments.map(
                                (item, index) => {

                                    const count =
                                        Number(
                                            item?.count || 0
                                        );

                                    const width =
                                        (
                                            count /
                                            maxSegmentCount
                                        ) * 100;

                                    const percentage =
                                        totalCustomers > 0
                                            ? (
                                                count /
                                                totalCustomers
                                            ) * 100
                                            : 0;


                                    return (

                                        <div
                                            className="segment-item"
                                            key={
                                                `${item?.segment}-${index}`
                                            }
                                        >

                                            <div className="segment-info">

                                                <div>

                                                    <span className="segment-dot" />

                                                    <span>
                                                        {
                                                            item?.segment ||
                                                            "Other"
                                                        }
                                                    </span>

                                                </div>

                                                <strong>
                                                    {count}
                                                </strong>

                                            </div>


                                            <div className="segment-bar">

                                                <div
                                                    className="segment-bar-fill"
                                                    style={{
                                                        width:
                                                            `${width}%`,
                                                    }}
                                                />

                                            </div>


                                            <span className="segment-percentage">
                                                {percentage.toFixed(1)}%
                                            </span>

                                        </div>

                                    );

                                }
                            )}

                        </div>

                    )}

                </div>


                {/* ORDER STATUS */}

                <div className="report-card">

                    <div className="report-card-header">

                        <div>

                            <h2>
                                Order Status
                            </h2>

                            <p>
                                Current period order activity
                            </p>

                        </div>

                    </div>


                    <div className="order-status-grid">

                        <div className="order-status-item">

                            <span className="status-number">
                                {summary.total_orders || 0}
                            </span>

                            <span className="status-label">
                                Completed
                            </span>

                        </div>


                        <div className="order-status-item">

                            <span className="status-number">
                                {summary.pending_orders || 0}
                            </span>

                            <span className="status-label">
                                Pending
                            </span>

                        </div>


                        <div className="order-status-item">

                            <span className="status-number">
                                {summary.cancelled_orders || 0}
                            </span>

                            <span className="status-label">
                                Cancelled
                            </span>

                        </div>

                    </div>

                </div>

            </div>


            {/* =================================================
                PROFITABILITY
            ================================================= */}

            <div className="profitability-card">

                <div className="profitability-content">

                    <div>

                        <span className="profitability-label">
                            BUSINESS PROFITABILITY
                        </span>

                        <h2>
                            {formatPercentage(
                                summary.profit_margin
                            )}
                        </h2>

                        <p>

                            Your business generated{" "}

                            <strong>
                                {formatCurrency(
                                    summary.net_profit
                                )}
                            </strong>

                            {" "}in net profit during{" "}

                            {getPeriodLabel().toLowerCase()}.

                        </p>

                    </div>


                    <div className="profitability-meter">

                        <div className="meter-track">

                            <div
                                className="meter-fill"
                                style={{
                                    width:
                                        `${Math.min(
                                            Math.max(
                                                Number(
                                                    summary.profit_margin || 0
                                                ),
                                                0
                                            ),
                                            100
                                        )}%`,
                                }}
                            />

                        </div>


                        <div className="meter-labels">

                            <span>
                                0%
                            </span>

                            <span>
                                50%
                            </span>

                            <span>
                                100%
                            </span>

                        </div>

                    </div>

                </div>

            </div>


            {/* =================================================
                AI INSIGHTS
            ================================================= */}

            <div className="report-ai-card">

                <div className="ai-icon">
                    ✦
                </div>

                <div className="ai-content">

                    <span className="ai-label">
                        AI BUSINESS INSIGHTS
                    </span>

                    <h2>
                        Intelligent analysis is coming next.
                    </h2>

                    <p>
                        Your AI Manager will analyze these
                        report metrics and identify important
                        trends, risks, and opportunities.
                    </p>

                </div>

            </div>

        </div>

    );

}


export default Report;

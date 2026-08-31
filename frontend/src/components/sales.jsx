import React, { useEffect, useMemo, useState } from "react";
import "./sales.css";
import API_URL from "../api";


function Sales() {
    const [sales, setSales] = useState([]);
    const [summary, setSummary] = useState(null);
    const [chartData, setChartData] = useState([]);

    const [chartPeriod, setChartPeriod] = useState("7");
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All Status");

    const [loading, setLoading] = useState(true);
    const [summaryLoading, setSummaryLoading] = useState(false);
    const [error, setError] = useState("");

    // =====================================================
    // INITIAL LOAD
    // =====================================================

    useEffect(() => {
        fetchSales();
    }, []);

    // =====================================================
    // SUMMARY + CHART
    // =====================================================

    useEffect(() => {
        fetchSummary(chartPeriod);
        fetchChart(chartPeriod);
    }, [chartPeriod]);

    // =====================================================
    // FETCH SALES
    // =====================================================

    const fetchSales = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await fetch(`${API_URL}/api/sales`);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();

            setSales(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Sales error:", error);

            setError(
                "Unable to load sales. Make sure the API server is running."
            );
        } finally {
            setLoading(false);
        }
    };

    // =====================================================
    // FETCH SUMMARY
    // =====================================================

    const fetchSummary = async (period) => {
        try {
            setSummaryLoading(true);

            const response = await fetch(
                `${API_URL}/api/sales/summary?period=${period}`
            );

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();

            setSummary(data);
        } catch (error) {
            console.error("Summary error:", error);
            setSummary(null);
        } finally {
            setSummaryLoading(false);
        }
    };

    // =====================================================
    // FETCH CHART
    // =====================================================

    const fetchChart = async (period) => {
        try {
            const response = await fetch(
                `${API_URL}/api/sales/chart?period=${period}`
            );

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();

            setChartData(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Chart error:", error);
            setChartData([]);
        }
    };

    // =====================================================
    // FILTER SALES
    // =====================================================

    const filteredSales = useMemo(() => {
        const searchText = search.toLowerCase().trim();

        return sales.filter((sale) => {
            const orderId = String(sale.order_id || "").toLowerCase();
            const saleId = String(sale.sale_id || "").toLowerCase();
            const customer = String(sale.customer || "").toLowerCase();
            const product = String(sale.product || "").toLowerCase();

            const matchesSearch =
                orderId.includes(searchText) ||
                saleId.includes(searchText) ||
                customer.includes(searchText) ||
                product.includes(searchText);

            const matchesStatus =
                statusFilter === "All Status" ||
                sale.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [sales, search, statusFilter]);

    // =====================================================
    // CLEAR FILTERS
    // =====================================================

    const clearFilters = () => {
        setSearch("");
        setStatusFilter("All Status");
    };

    // =====================================================
    // FORMAT MONEY
    // =====================================================

    const formatMoney = (value) => {
        return Number(value || 0).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    // =====================================================
    // FORMAT DATE
    // =====================================================

    const formatDate = (date) => {
        if (!date) return "-";

        const parsed = new Date(date);

        if (Number.isNaN(parsed.getTime())) {
            return "-";
        }

        return parsed.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    // =====================================================
    // CHART LABEL
    // =====================================================

    const getChartLabel = (date) => {
        if (!date) return "";

        const d = new Date(date);

        if (chartPeriod === "7") {
            return d.toLocaleDateString("en-IN", {
                weekday: "short",
            });
        }

        if (chartPeriod === "30") {
            return d.toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
            });
        }

        return d.toLocaleDateString("en-IN", {
            month: "short",
        });
    };

    // =====================================================
    // MAX CHART VALUE
    // =====================================================

    const maxChartValue = Math.max(
        ...chartData.map((item) => Number(item.total || 0)),
        1
    );

    // =====================================================
    // PERIOD NAME
    // =====================================================

    const getPeriodName = () => {
        switch (chartPeriod) {
            case "7":
                return "Last 7 Days";

            case "30":
                return "Last 30 Days";

            case "6months":
                return "Last 6 Months";

            case "year":
                return "This Year";

            default:
                return "Last 7 Days";
        }
    };

    // =====================================================
    // LOADING
    // =====================================================

    if (loading) {
        return (
            <div className="sales-page">
                <div className="sales-loading">
                    <h2>Loading Sales...</h2>
                    <p>Fetching data from database...</p>
                </div>
            </div>
        );
    }

    // =====================================================
    // ERROR
    // =====================================================

    if (error) {
        return (
            <div className="sales-page">
                <div className="sales-error">
                    <h2>{error}</h2>

                    <button
                        className="sales-add-btn"
                        onClick={fetchSales}
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    // =====================================================
    // MAIN
    // =====================================================

    return (
        <div className="sales-page">

            {/* HEADER */}

            <div className="sales-header">
                <div>
                    <h2>Sales</h2>

                    <p>
                        Track and manage your business sales
                    </p>
                </div>

                <button className="sales-add-btn">
                    + Add Sale
                </button>
            </div>

            {/* STATS */}

            <div className="sales-stats">

                {/* TOTAL SALES */}

                <div className="sales-stat-card">
                    <div className="sales-stat-icon">
                        ₹
                    </div>

                    <div>
                        <p>Sales</p>

                        <h3>
                            {summaryLoading
                                ? "Loading..."
                                : `₹${formatMoney(
                                    summary?.total_sales
                                )}`}
                        </h3>

                        <span className="sales-positive">
                            {getPeriodName()}
                        </span>
                    </div>
                </div>

                {/* TRANSACTIONS */}

                <div className="sales-stat-card">
                    <div className="sales-stat-icon">
                        🛒
                    </div>

                    <div>
                        <p>Total Transactions</p>

                        <h3>
                            {summaryLoading
                                ? "Loading..."
                                : summary?.total_transactions || 0}
                        </h3>

                        <span className="sales-positive">
                            Completed orders
                        </span>
                    </div>
                </div>

                {/* AVERAGE ORDER */}

                <div className="sales-stat-card">
                    <div className="sales-stat-icon">
                        💰
                    </div>

                    <div>
                        <p>Average Order</p>

                        <h3>
                            {summaryLoading
                                ? "Loading..."
                                : `₹${formatMoney(
                                    summary?.average_order
                                )}`}
                        </h3>

                        <span className="sales-positive">
                            Per completed order
                        </span>
                    </div>
                </div>

                {/* PENDING */}

                <div className="sales-stat-card">
                    <div className="sales-stat-icon">
                        ⏳
                    </div>

                    <div>
                        <p>Pending Orders</p>

                        <h3>
                            {summaryLoading
                                ? "Loading..."
                                : summary?.pending_orders || 0}
                        </h3>

                        <span className="sales-negative">
                            {getPeriodName()}
                        </span>
                    </div>
                </div>
            </div>

            {/* CHART */}

            <div className="sales-card">

                <div className="sales-card-header">

                    <div>
                        <h3>Sales Overview</h3>

                        <p>
                            Sales performance —{" "}
                            {getPeriodName()}
                        </p>
                    </div>

                    <select
                        value={chartPeriod}
                        onChange={(e) =>
                            setChartPeriod(e.target.value)
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
                            This Year
                        </option>
                    </select>
                </div>

                <div className="sales-chart">

                    {/* Y AXIS */}

                    <div className="chart-y-axis">

                        <span>
                            ₹{formatMoney(maxChartValue)}
                        </span>

                        <span>
                            ₹{formatMoney(maxChartValue * 0.75)}
                        </span>

                        <span>
                            ₹{formatMoney(maxChartValue * 0.5)}
                        </span>

                        <span>
                            ₹{formatMoney(maxChartValue * 0.25)}
                        </span>

                        <span>₹0</span>

                    </div>

                    {/* CHART AREA */}

                    <div className="sales-chart-area">

                        <div className="sales-grid-line"></div>
                        <div className="sales-grid-line"></div>
                        <div className="sales-grid-line"></div>
                        <div className="sales-grid-line"></div>
                        <div className="sales-grid-line"></div>

                        <div className="sales-bars">

                            {chartData.length > 0 ? (

                                chartData.map((item, index) => {

                                    const amount =
                                        Number(item.total || 0);

                                    const height =
                                        (amount / maxChartValue) * 100;

                                    return (
                                        <div
                                            className="sales-bar-item"
                                            key={index}
                                        >

                                            <div
                                                className="sales-bar"
                                                style={{
                                                    height: `${Math.max(
                                                        height,
                                                        3
                                                    )}%`,
                                                }}
                                                title={`₹${formatMoney(
                                                    amount
                                                )}`}
                                            />

                                            <span>
                                                {getChartLabel(
                                                    item.sale_date
                                                )}
                                            </span>

                                        </div>
                                    );
                                })

                            ) : (

                                <div className="sales-no-chart">
                                    No sales data available.
                                </div>

                            )}

                        </div>
                    </div>
                </div>
            </div>

            {/* SALES TABLE */}

            <div className="sales-card">

                <div className="sales-card-header">

                    <div>
                        <h3>Sales Transactions</h3>

                        <p>
                            Sales generated from customer orders
                        </p>
                    </div>

                    <div className="sales-filters">

                        <input
                            type="text"
                            placeholder="Search order, customer or product..."
                            value={search}
                            onChange={(e) =>
                                setSearch(e.target.value)
                            }
                        />

                        <select
                            value={statusFilter}
                            onChange={(e) =>
                                setStatusFilter(e.target.value)
                            }
                        >
                            <option>All Status</option>
                            <option>Completed</option>
                            <option>Pending</option>
                            <option>Processing</option>
                            <option>Cancelled</option>
                        </select>

                        <button
                            className="sales-clear-btn"
                            onClick={clearFilters}
                        >
                            Clear
                        </button>

                    </div>
                </div>

                {/* TABLE */}

                <div className="sales-table-container">

                    <table className="sales-table">

                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Date</th>
                                <th>Customer</th>
                                <th>Product</th>
                                <th>Quantity</th>
                                <th>Price</th>
                                <th>Amount</th>
                                <th>Status</th>
                            </tr>
                        </thead>

                        <tbody>

                            {filteredSales.length > 0 ? (

                                filteredSales.map((sale) => (

                                    <tr
                                        key={
                                            sale.sale_id ||
                                            sale.order_id
                                        }
                                    >

                                        <td>
                                            <strong>
                                                #ORD-{sale.order_id}
                                            </strong>
                                        </td>

                                        <td>
                                            {formatDate(
                                                sale.sale_date
                                            )}
                                        </td>

                                        <td>
                                            {sale.customer || "-"}
                                        </td>

                                        <td>
                                            {sale.product || "-"}
                                        </td>

                                        <td>
                                            {sale.quantity || 0}
                                        </td>

                                        <td>
                                            ₹
                                            {formatMoney(
                                                sale.unit_price
                                            )}
                                        </td>

                                        <td>
                                            <strong>
                                                ₹
                                                {formatMoney(
                                                    sale.amount
                                                )}
                                            </strong>
                                        </td>

                                        <td>
                                            <span
                                                className={`sales-status ${String(
                                                    sale.status || ""
                                                )
                                                    .toLowerCase()
                                                    .replace(
                                                        /\s+/g,
                                                        "-"
                                                    )}`}
                                            >
                                                {sale.status || "-"}
                                            </span>
                                        </td>

                                    </tr>
                                ))

                            ) : (

                                <tr>
                                    <td
                                        colSpan="8"
                                        style={{
                                            textAlign: "center",
                                            padding: "40px",
                                        }}
                                    >
                                        No sales found.
                                    </td>
                                </tr>

                            )}

                        </tbody>

                    </table>
                </div>

                {/* RESULT COUNT */}

                <div className="sales-result-count">
                    Showing{" "}
                    <strong>
                        {filteredSales.length}
                    </strong>{" "}
                    of{" "}
                    <strong>
                        {sales.length}
                    </strong>{" "}
                    sales
                </div>

            </div>
        </div>
    );
}

export default Sales;

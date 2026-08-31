import React, { useEffect, useMemo, useState } from "react";
import "./marketing.css";
import API_URL from "../api";

function Marketing() {
    const [data, setData] = useState(null);
    const [period, setPeriod] = useState("7days");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchMarketingData = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await fetch(
                `${API_URL}/api/marketing?period=${period}`
            );

            if (!response.ok) {
                throw new Error("Failed to load marketing data");
            }

            const result = await response.json();
            setData(result);
        } catch (err) {
            console.error(err);
            setError("Unable to load marketing data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMarketingData();
    }, [period]);

    const formatCurrency = (value) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
        }).format(value || 0);
    };

    const formatNumber = (value) => {
        return new Intl.NumberFormat("en-IN").format(value || 0);
    };

    const getPerformanceClass = (roas) => {
        if (roas >= 5) return "excellent";
        if (roas >= 2) return "good";
        return "poor";
    };

    const getPerformanceLabel = (roas) => {
        if (roas >= 5) return "Excellent";
        if (roas >= 2) return "Good";
        return "Poor";
    };

    const overview = data?.overview || {};
    const website = data?.website || {};

    /*
     * Only calculate best performers when there is
     * actual marketing spend.
     *
     * This prevents 0.00x ROAS from being shown as
     * a "best" result when there is no marketing spend.
     */
    const hasMarketingSpend = Number(overview.total_spend || 0) > 0;

    const bestChannel = useMemo(() => {
        if (!hasMarketingSpend || !data?.channels?.length) {
            return null;
        }

        return [...data.channels].sort(
            (a, b) => (b.roas || 0) - (a.roas || 0)
        )[0];
    }, [data, hasMarketingSpend]);

    const bestCategory = useMemo(() => {
        if (!hasMarketingSpend || !data?.categories?.length) {
            return null;
        }

        return [...data.categories].sort(
            (a, b) => (b.roas || 0) - (a.roas || 0)
        )[0];
    }, [data, hasMarketingSpend]);

    if (loading) {
        return (
            <div className="marketing-page">
                <div className="marketing-loading">
                    <div className="loading-spinner"></div>
                    <p>Loading marketing analytics...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="marketing-page">
                <div className="marketing-error">
                    <h3>Unable to load marketing data</h3>
                    <p>{error}</p>

                    <button onClick={fetchMarketingData}>
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="marketing-page">

            {/* HEADER */}

            <div className="marketing-header">
                <div>
                    <h1>Marketing</h1>

                    <p>
                        Analyze your marketing performance,
                        channels, products and customer acquisition.
                    </p>
                </div>

                <div className="marketing-period">
                    {[
                        ["7days", "7 Days"],
                        ["1month", "1 Month"],
                        ["6months", "6 Months"],
                        ["1year", "1 Year"],
                    ].map(([value, label]) => (
                        <button
                            key={value}
                            className={period === value ? "active" : ""}
                            onClick={() => setPeriod(value)}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>


            {/* OVERVIEW */}

            <div className="marketing-stats">

                <div className="marketing-stat-card">
                    <div className="stat-icon spend-icon">₹</div>

                    <div>
                        <span>Total Marketing Spend</span>

                        <strong>
                            {formatCurrency(overview.total_spend)}
                        </strong>
                    </div>
                </div>


                <div className="marketing-stat-card">
                    <div className="stat-icon revenue-icon">↗</div>

                    <div>
                        <span>Revenue Generated</span>

                        <strong>
                            {formatCurrency(overview.revenue)}
                        </strong>
                    </div>
                </div>


                <div className="marketing-stat-card">
                    <div className="stat-icon roas-icon">×</div>

                    <div>
                        <span>ROAS</span>

                        <strong>
                            {(overview.roas || 0).toFixed(2)}x
                        </strong>
                    </div>
                </div>


                <div className="marketing-stat-card">
                    <div className="stat-icon orders-icon">#</div>

                    <div>
                        <span>Marketing Orders</span>

                        <strong>
                            {formatNumber(overview.orders)}
                        </strong>
                    </div>
                </div>

            </div>


            {/* CHANNEL PERFORMANCE */}

            <section className="marketing-section">

                <div className="section-heading">
                    <div>
                        <h2>Channel Performance</h2>

                        <p>
                            Compare performance across your sales channels.
                        </p>
                    </div>
                </div>


                <div className="channel-grid">

                    {data?.channels?.length > 0 ? (

                        data.channels.map((channel) => (

                            <div
                                className="channel-card"
                                key={channel.channel}
                            >

                                <div className="channel-card-header">

                                    <div className="channel-name">

                                        <div
                                            className={`channel-logo ${channel.channel.toLowerCase()}`}
                                        >
                                            {channel.channel === "Store" && "⌂"}
                                            {channel.channel === "Instagram" && "◎"}
                                            {channel.channel === "Website" && "⌁"}

                                            {![
                                                "Store",
                                                "Instagram",
                                                "Website"
                                            ].includes(channel.channel) && "•"}
                                        </div>


                                        <div>
                                            <h3>
                                                {channel.channel}
                                            </h3>

                                            <span>
                                                {formatNumber(
                                                    channel.orders
                                                )} orders
                                            </span>
                                        </div>

                                    </div>


                                    <span
                                        className={`performance-badge ${getPerformanceClass(
                                            channel.roas
                                        )}`}
                                    >
                                        {getPerformanceLabel(
                                            channel.roas
                                        )}
                                    </span>

                                </div>


                                <div className="channel-revenue">

                                    <span>Revenue</span>

                                    <strong>
                                        {formatCurrency(
                                            channel.revenue
                                        )}
                                    </strong>

                                </div>


                                <div className="channel-details">

                                    <div>
                                        <span>Marketing Spend</span>

                                        <strong>
                                            {formatCurrency(
                                                channel.spend
                                            )}
                                        </strong>
                                    </div>


                                    <div>
                                        <span>ROAS</span>

                                        <strong>
                                            {(channel.roas || 0).toFixed(2)}x
                                        </strong>
                                    </div>


                                    <div>
                                        <span>ROI</span>

                                        <strong>
                                            {(channel.roi || 0).toFixed(1)}%
                                        </strong>
                                    </div>

                                </div>


                                <div className="channel-progress">

                                    <div className="progress-label">

                                        <span>
                                            Performance
                                        </span>

                                        <span>
                                            {(channel.roas || 0).toFixed(1)}x
                                        </span>

                                    </div>


                                    <div className="progress-track">

                                        <div
                                            className={`progress-fill ${getPerformanceClass(
                                                channel.roas
                                            )}`}
                                            style={{
                                                width: `${Math.min(
                                                    (channel.roas || 0) * 10,
                                                    100
                                                )}%`,
                                            }}
                                        ></div>

                                    </div>

                                </div>

                            </div>

                        ))

                    ) : (

                        <p>
                            No channel data available.
                        </p>

                    )}

                </div>

            </section>


            {/* BEST PERFORMERS */}

            {hasMarketingSpend && bestChannel && bestCategory && (

                <div className="marketing-highlight-grid">

                    <div className="highlight-card">

                        <div className="highlight-icon">
                            🏆
                        </div>

                        <div>
                            <span>
                                Best Marketing Channel
                            </span>

                            <h3>
                                {bestChannel.channel}
                            </h3>

                            <p>
                                {bestChannel.roas.toFixed(2)}x ROAS
                            </p>
                        </div>

                    </div>


                    <div className="highlight-card">

                        <div className="highlight-icon">
                            📦
                        </div>

                        <div>
                            <span>
                                Best Product Category
                            </span>

                            <h3>
                                {bestCategory.category}
                            </h3>

                            <p>
                                {bestCategory.roas.toFixed(2)}x ROAS
                            </p>
                        </div>

                    </div>

                </div>

            )}


            {/* PRODUCT CATEGORY PERFORMANCE */}

            <section className="marketing-section">

                <div className="section-heading">

                    <div>
                        <h2>
                            Product Advertisement Performance
                        </h2>

                        <p>
                            Discover which product categories generate
                            the strongest returns.
                        </p>
                    </div>

                </div>


                <div className="table-container">

                    <table className="marketing-table">

                        <thead>
                            <tr>
                                <th>Category</th>
                                <th>Ad Spend</th>
                                <th>Orders</th>
                                <th>Revenue</th>
                                <th>ROAS</th>
                                <th>ROI</th>
                                <th>Status</th>
                            </tr>
                        </thead>


                        <tbody>

                            {data?.categories?.length > 0 ? (

                                data.categories.map((category) => (

                                    <tr key={category.category}>

                                        <td>
                                            <div className="category-name">

                                                <div className="category-dot"></div>

                                                {category.category}

                                            </div>
                                        </td>


                                        <td>
                                            {formatCurrency(
                                                category.spend
                                            )}
                                        </td>


                                        <td>
                                            {formatNumber(
                                                category.orders
                                            )}
                                        </td>


                                        <td>
                                            {formatCurrency(
                                                category.revenue
                                            )}
                                        </td>


                                        <td>
                                            <strong>
                                                {(category.roas || 0).toFixed(2)}x
                                            </strong>
                                        </td>


                                        <td>
                                            {(category.roi || 0).toFixed(1)}%
                                        </td>


                                        <td>
                                            <span
                                                className={`table-status ${getPerformanceClass(
                                                    category.roas
                                                )}`}
                                            >
                                                {getPerformanceLabel(
                                                    category.roas
                                                )}
                                            </span>
                                        </td>

                                    </tr>

                                ))

                            ) : (

                                <tr>
                                    <td
                                        colSpan="7"
                                        className="empty-table"
                                    >
                                        No product marketing data available.
                                    </td>
                                </tr>

                            )}

                        </tbody>

                    </table>

                </div>

            </section>


            {/* WEBSITE PERFORMANCE */}

            <section className="marketing-section">

                <div className="section-heading">

                    <div>
                        <h2>
                            Website Marketing
                        </h2>

                        <p>
                            Track traffic and conversion performance.
                        </p>
                    </div>

                </div>


                <div className="email-grid">

                    <div className="email-stat">

                        <span>
                            Website Visits
                        </span>

                        <strong>
                            {formatNumber(
                                website.visits
                            )}
                        </strong>

                    </div>


                    <div className="email-stat">

                        <span>
                            Conversions
                        </span>

                        <strong>
                            {formatNumber(
                                website.conversions
                            )}
                        </strong>

                    </div>


                    <div className="email-stat">

                        <span>
                            Conversion Rate
                        </span>

                        <strong>
                            {(website.conversion_rate || 0).toFixed(1)}%
                        </strong>

                    </div>


                    <div className="email-stat">

                        <span>
                            Marketing ROI
                        </span>

                        <strong>
                            {(overview.roi || 0).toFixed(1)}%
                        </strong>

                    </div>

                </div>

            </section>


            {/* INSIGHTS */}

            <section className="marketing-section">

                <div className="section-heading">

                    <div>
                        <h2>
                            Marketing Insights
                        </h2>

                        <p>
                            Recommendations based on your business data.
                        </p>
                    </div>

                </div>


                <div className="insights-container">

                    {data?.insights?.length > 0 ? (

                        data.insights.map((insight, index) => (

                            <div
                                className={`insight-card ${
                                    insight.type || "info"
                                }`}
                                key={index}
                            >

                                <div className="insight-icon">

                                    {insight.type === "success" && "✓"}

                                    {insight.type === "warning" && "!"}

                                    {insight.type === "danger" && "×"}

                                    {(!insight.type ||
                                        insight.type === "info") &&
                                        "💡"}

                                </div>


                                <div>

                                    <h3>
                                        {insight.title}
                                    </h3>

                                    <p>
                                        {insight.message}
                                    </p>

                                </div>

                            </div>

                        ))

                    ) : (

                        <div className="no-insights">

                            <span>
                                💡
                            </span>

                            <p>
                                More marketing data is required to
                                generate recommendations.
                            </p>

                        </div>

                    )}

                </div>

            </section>

        </div>
    );
}

export default Marketing;


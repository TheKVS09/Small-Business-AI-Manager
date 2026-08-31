import React, { useEffect, useState } from "react";
import "./order.css";
import API_URL from "../api";


function Orders() {

    // =====================================================
    // STATES
    // =====================================================

    const [orders, setOrders] = useState([]);
    const [summary, setSummary] = useState(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Filters
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All Status");
    const [dateFilter, setDateFilter] = useState("All Dates");

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);

    const ordersPerPage = 5;


    // =====================================================
    // FETCH DATA
    // =====================================================

    useEffect(() => {
        fetchOrders();
        fetchSummary();
    }, []);


    // =====================================================
    // FETCH ORDERS
    // =====================================================

    const fetchOrders = async () => {

        try {

            setLoading(true);
            setError("");

            const response = await fetch(
                `${API_URL}/api/orders`
            );

            if (!response.ok) {
                throw new Error("Failed to fetch orders");
            }

            const data = await response.json();

            console.log("ORDERS API RESPONSE:", data);

            if (Array.isArray(data)) {
                setOrders(data);
            } else {
                setOrders([]);
            }

        } catch (error) {

            console.error("Orders error:", error);

            setError(
                "Unable to load orders. Make sure FastAPI is running."
            );

        } finally {

            setLoading(false);

        }

    };


    // =====================================================
    // FETCH SUMMARY
    // =====================================================

    const fetchSummary = async () => {

        try {

            const response = await fetch(
                `${API_URL}/api/orders/summary`
            );

            if (!response.ok) {
                throw new Error("Failed to fetch summary");
            }

            const data = await response.json();

            console.log("SUMMARY API RESPONSE:", data);

            setSummary(data);

        } catch (error) {

            console.error("Summary error:", error);

            setSummary(null);

        }

    };


    // =====================================================
    // FILTER ORDERS
    // =====================================================

    const filteredOrders = orders.filter((order) => {

        const searchText = search
            .toLowerCase()
            .trim();

        const orderId = String(
            order.order_id || ""
        ).toLowerCase();

        const customerName = String(
            order.customer_name || ""
        ).toLowerCase();

        const customerId = String(
            order.customer_id || ""
        ).toLowerCase();

        const productName = String(
            order.product_name || ""
        ).toLowerCase();


        // SEARCH

        const matchesSearch =
            orderId.includes(searchText) ||
            customerName.includes(searchText) ||
            customerId.includes(searchText) ||
            productName.includes(searchText);


        // STATUS

        const status = String(
            order.status || ""
        ).toLowerCase();

        const matchesStatus =
            statusFilter === "All Status" ||
            status === statusFilter.toLowerCase();


        // DATE

        let matchesDate = true;

        if (dateFilter !== "All Dates") {

            const orderDate = new Date(
                order.order_date
            );

            const today = new Date();

            if (
                Number.isNaN(
                    orderDate.getTime()
                )
            ) {

                matchesDate = false;

            } else {

                // TODAY

                if (dateFilter === "Today") {

                    matchesDate =
                        orderDate.toDateString() ===
                        today.toDateString();

                }


                // THIS WEEK

                if (dateFilter === "This Week") {

                    const startOfWeek =
                        new Date(today);

                    const day =
                        today.getDay();

                    startOfWeek.setDate(
                        today.getDate() - day
                    );

                    startOfWeek.setHours(
                        0,
                        0,
                        0,
                        0
                    );


                    const endOfToday =
                        new Date(today);

                    endOfToday.setHours(
                        23,
                        59,
                        59,
                        999
                    );


                    matchesDate =
                        orderDate >= startOfWeek &&
                        orderDate <= endOfToday;

                }


                // THIS MONTH

                if (dateFilter === "This Month") {

                    matchesDate =
                        orderDate.getMonth() ===
                        today.getMonth() &&
                        orderDate.getFullYear() ===
                        today.getFullYear();

                }

            }

        }


        return (
            matchesSearch &&
            matchesStatus &&
            matchesDate
        );

    });


    // =====================================================
    // PAGINATION
    // =====================================================

    const totalPages = Math.ceil(
        filteredOrders.length /
        ordersPerPage
    );


    useEffect(() => {

        if (
            totalPages > 0 &&
            currentPage > totalPages
        ) {

            setCurrentPage(totalPages);

        }

        if (
            totalPages === 0 &&
            currentPage !== 1
        ) {

            setCurrentPage(1);

        }

    }, [
        totalPages,
        currentPage
    ]);


    const startIndex =
        (currentPage - 1) *
        ordersPerPage;


    const currentOrders =
        filteredOrders.slice(
            startIndex,
            startIndex + ordersPerPage
        );


    // =====================================================
    // PAGINATION BUTTONS
    // =====================================================

    const getPaginationPages = () => {

        if (totalPages <= 7) {

            return Array.from(
                {
                    length: totalPages
                },
                (_, index) => index + 1
            );

        }


        const pages = [];

        pages.push(1);


        if (currentPage > 4) {
            pages.push("...");
        }


        const startPage = Math.max(
            2,
            currentPage - 1
        );

        const endPage = Math.min(
            totalPages - 1,
            currentPage + 1
        );


        for (
            let page = startPage;
            page <= endPage;
            page++
        ) {

            if (!pages.includes(page)) {
                pages.push(page);
            }

        }


        if (
            currentPage <
            totalPages - 3
        ) {

            pages.push("...");

        }


        if (
            !pages.includes(totalPages)
        ) {

            pages.push(totalPages);

        }


        return pages;

    };


    // =====================================================
    // FILTER HANDLERS
    // =====================================================

    const handleSearchChange = (e) => {

        setSearch(e.target.value);
        setCurrentPage(1);

    };


    const handleStatusChange = (e) => {

        setStatusFilter(e.target.value);
        setCurrentPage(1);

    };


    const handleDateChange = (e) => {

        setDateFilter(e.target.value);
        setCurrentPage(1);

    };


    const clearFilters = () => {

        setSearch("");
        setStatusFilter("All Status");
        setDateFilter("All Dates");
        setCurrentPage(1);

    };


    // =====================================================
    // FORMAT DATE
    // =====================================================

    const formatDate = (date) => {

        if (!date) {
            return "-";
        }

        const parsedDate =
            new Date(date);

        if (
            Number.isNaN(
                parsedDate.getTime()
            )
        ) {

            return "-";

        }

        return parsedDate.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );

    };


    // =====================================================
    // FORMAT MONEY
    // =====================================================

    const formatMoney = (amount) => {

        const number =
            Number(amount);

        if (
            Number.isNaN(number)
        ) {

            return "0.00";

        }

        return number.toLocaleString(
            "en-IN",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        );

    };


    // =====================================================
    // VIEW ORDER
    // =====================================================

    const handleViewOrder = (order) => {

        console.log(
            "Selected order:",
            order
        );

    };


    // =====================================================
    // LOADING
    // =====================================================

    if (loading) {

        return (

            <div className="orders-page">

                <h2>
                    Loading orders...
                </h2>

            </div>

        );

    }


    // =====================================================
    // ERROR
    // =====================================================

    if (error) {

        return (

            <div className="orders-page">

                <h2>
                    {error}
                </h2>

                <button
                    onClick={() => {
                        fetchOrders();
                        fetchSummary();
                    }}
                    className="add-order-btn"
                >
                    Try Again
                </button>

            </div>

        );

    }


    // =====================================================
    // MAIN UI
    // =====================================================

    return (

        <div className="orders-page">


            {/* =================================================
                HEADER
            ================================================= */}

            <div className="orders-header">

                <div>

                    <h2>
                        Orders
                    </h2>

                    <p>
                        Manage and track all customer orders
                    </p>

                </div>


                <button
                    className="add-order-btn"
                >
                    + New Order
                </button>

            </div>


            {/* =================================================
                STATISTICS
            ================================================= */}

            <div className="orders-stats">


                {/* TOTAL ORDERS */}

                <div className="order-stat-card">

                    <div className="order-stat-icon">
                        📋
                    </div>

                    <div>

                        <p>
                            Total Orders
                        </p>

                        <h3>
                            {
                                summary?.total_orders ||
                                0
                            }
                        </h3>

                        <span className="order-positive">
                            All orders
                        </span>

                    </div>

                </div>


                {/* PENDING */}

                <div className="order-stat-card">

                    <div className="order-stat-icon">
                        ⏳
                    </div>

                    <div>

                        <p>
                            Pending
                        </p>

                        <h3>
                            {
                                summary?.pending_orders ||
                                0
                            }
                        </h3>

                        <span className="order-warning">
                            Needs attention
                        </span>

                    </div>

                </div>


                {/* COMPLETED */}

                <div className="order-stat-card">

                    <div className="order-stat-icon">
                        ✓
                    </div>

                    <div>

                        <p>
                            Completed
                        </p>

                        <h3>
                            {
                                summary?.completed_orders ||
                                0
                            }
                        </h3>

                        <span className="order-positive">
                            Completed orders
                        </span>

                    </div>

                </div>


                {/* REVENUE */}

                <div className="order-stat-card">

                    <div className="order-stat-icon">
                        ₹
                    </div>

                    <div>

                        <p>
                            Order Revenue
                        </p>

                        <h3>
                            ₹
                            {
                                formatMoney(
                                    summary?.total_revenue
                                )
                            }
                        </h3>

                        <span className="order-positive">
                            Completed order value
                        </span>

                    </div>

                </div>

            </div>


            {/* =================================================
                ORDERS CARD
            ================================================= */}

            <div className="orders-card">


                {/* CARD HEADER */}

                <div className="orders-card-header">

                    <div>

                        <h3>
                            All Orders
                        </h3>

                        <p>
                            View customer orders and purchased products
                        </p>

                    </div>


                    {/* FILTERS */}

                    <div className="orders-filters">

                        <input
                            type="text"
                            placeholder="Search orders, customers or products..."
                            value={search}
                            onChange={handleSearchChange}
                        />


                        <select
                            value={statusFilter}
                            onChange={handleStatusChange}
                        >

                            <option value="All Status">
                                All Status
                            </option>

                            <option value="Pending">
                                Pending
                            </option>

                            <option value="Processing">
                                Processing
                            </option>

                            <option value="Completed">
                                Completed
                            </option>

                            <option value="Cancelled">
                                Cancelled
                            </option>

                        </select>


                        <select
                            value={dateFilter}
                            onChange={handleDateChange}
                        >

                            <option value="All Dates">
                                All Dates
                            </option>

                            <option value="Today">
                                Today
                            </option>

                            <option value="This Week">
                                This Week
                            </option>

                            <option value="This Month">
                                This Month
                            </option>

                        </select>


                        <button
                            className="clear-filter-btn"
                            onClick={clearFilters}
                        >
                            Clear
                        </button>

                    </div>

                </div>


                {/* =================================================
                    TABLE
                ================================================= */}

                <div className="orders-table-container">

                    <table className="orders-table">

                        <thead>

                            <tr>

                                <th>
                                    Order ID
                                </th>

                                <th>
                                    Date
                                </th>

                                <th>
                                    Customer
                                </th>

                                <th>
                                    Product
                                </th>

                                <th>
                                    Quantity
                                </th>

                                <th>
                                    Price
                                </th>

                                <th>
                                    Status
                                </th>

                                <th>
                                    Action
                                </th>

                            </tr>

                        </thead>


                        <tbody>

                            {
                                currentOrders.length > 0
                                    ? currentOrders.map(
                                        (order, index) => {

                                            const status =
                                                order.status ||
                                                "-";

                                            const customerName =
                                                order.customer_name ||
                                                "-";

                                            const productName =
                                                order.product_name ||
                                                "-";

                                            const orderId =
                                                order.order_id ||
                                                "-";


                                            return (

                                                <tr
                                                    key={
                                                        `${orderId}-${index}`
                                                    }
                                                >


                                                    {/* ORDER ID */}

                                                    <td>

                                                        <strong>

                                                            #
                                                            {
                                                                String(
                                                                    orderId
                                                                ).startsWith(
                                                                    "ORD-"
                                                                )
                                                                    ? orderId
                                                                    : `ORD-${orderId}`
                                                            }

                                                        </strong>

                                                    </td>


                                                    {/* DATE */}

                                                    <td>

                                                        {
                                                            formatDate(
                                                                order.order_date
                                                            )
                                                        }

                                                    </td>


                                                    {/* CUSTOMER */}

                                                    <td>

                                                        <div className="customer">

                                                            <div className="customer-avatar">

                                                                {
                                                                    (
                                                                        customerName !== "-"
                                                                            ? customerName
                                                                            : "C"
                                                                    )
                                                                        .charAt(0)
                                                                        .toUpperCase()
                                                                }

                                                            </div>

                                                            <span>
                                                                {
                                                                    customerName
                                                                }
                                                            </span>

                                                        </div>

                                                    </td>


                                                    {/* PRODUCT */}

                                                    <td>

                                                        <strong>
                                                            {
                                                                productName
                                                            }
                                                        </strong>

                                                    </td>


                                                    {/* QUANTITY */}

                                                    <td>

                                                        {
                                                            order.quantity ||
                                                            0
                                                        }

                                                    </td>


                                                    {/* PRICE */}

                                                    <td>

                                                        ₹
                                                        {
                                                            formatMoney(
                                                                order.unit_price
                                                            )
                                                        }

                                                    </td>


                                                    {/* STATUS */}

                                                    <td>

                                                        <span
                                                            className={
                                                                `order-status ${
                                                                    String(
                                                                        status
                                                                    )
                                                                        .toLowerCase()
                                                                        .replace(
                                                                            /\s+/g,
                                                                            "-"
                                                                        )
                                                                }`
                                                            }
                                                        >

                                                            {
                                                                status
                                                            }

                                                        </span>

                                                    </td>


                                                    {/* ACTION */}

                                                    <td>

                                                        <button
                                                            className="action-btn"
                                                            onClick={() =>
                                                                handleViewOrder(
                                                                    order
                                                                )
                                                            }
                                                        >
                                                            View
                                                        </button>

                                                    </td>

                                                </tr>

                                            );

                                        }
                                    )
                                    : (

                                        <tr>

                                            <td
                                                colSpan="8"
                                                style={{
                                                    textAlign: "center",
                                                    padding: "40px"
                                                }}
                                            >
                                                No orders found.
                                            </td>

                                        </tr>

                                    )
                            }

                        </tbody>

                    </table>

                </div>


                {/* =================================================
                    PAGINATION
                ================================================= */}

                <div className="orders-pagination">

                    <span>

                        Showing{" "}

                        {
                            filteredOrders.length === 0
                                ? 0
                                : startIndex + 1
                        }

                        {"–"}

                        {
                            filteredOrders.length === 0
                                ? 0
                                : Math.min(
                                    startIndex +
                                    ordersPerPage,
                                    filteredOrders.length
                                )
                        }

                        {" "}of{" "}

                        {
                            filteredOrders.length
                        }

                        {" "}orders

                    </span>


                    <div className="pagination-buttons">


                        {/* PREVIOUS */}

                        <button
                            disabled={
                                currentPage === 1 ||
                                totalPages === 0
                            }
                            onClick={() =>
                                setCurrentPage(
                                    Math.max(
                                        1,
                                        currentPage - 1
                                    )
                                )
                            }
                        >
                            ‹
                        </button>


                        {/* PAGE NUMBERS */}

                        {
                            getPaginationPages().map(
                                (page, index) => {

                                    if (
                                        page === "..."
                                    ) {

                                        return (

                                            <span
                                                key={
                                                    `dots-${index}`
                                                }
                                                className="pagination-dots"
                                            >
                                                ...
                                            </span>

                                        );

                                    }


                                    return (

                                        <button
                                            key={page}
                                            className={
                                                currentPage === page
                                                    ? "page-active"
                                                    : ""
                                            }
                                            onClick={() =>
                                                setCurrentPage(
                                                    page
                                                )
                                            }
                                        >
                                            {page}
                                        </button>

                                    );

                                }
                            )
                        }


                        {/* NEXT */}

                        <button
                            disabled={
                                currentPage === totalPages ||
                                totalPages === 0
                            }
                            onClick={() =>
                                setCurrentPage(
                                    Math.min(
                                        totalPages,
                                        currentPage + 1
                                    )
                                )
                            }
                        >
                            ›
                        </button>

                    </div>

                </div>

            </div>

        </div>

    );

}

export default Orders;



import React, { useEffect, useState } from "react";
import "./customers.css";
import API_BASE_URL from "../api";

function Customers() {

    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [selectedCustomer, setSelectedCustomer] = useState(null);

    // =====================================================
    // FETCH CUSTOMERS
    // =====================================================

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {

        try {

            setLoading(true);
            setError("");

            const response = await fetch(
                `${API_BASE_URL}/api/customers`
            );

            if (!response.ok) {
                throw new Error(
                    `HTTP error: ${response.status}`
                );
            }

            const data = await response.json();

            console.log("Customer API response:", data);

            if (Array.isArray(data)) {
                setCustomers(data);
            } else {
                setCustomers([data]);
            }

        } catch (err) {

            console.error("Customer API error:", err);

            setError(
                "Unable to load customer data."
            );

        } finally {

            setLoading(false);

        }
    };

    // =====================================================
    // SEARCH
    // =====================================================

    const filteredCustomers = customers.filter(
        (customer) => {

            const query = search
                .toLowerCase()
                .trim();

            if (!query) {
                return true;
            }

            return (
                customer.customer_id
                    ?.toLowerCase()
                    .includes(query) ||

                customer.name
                    ?.toLowerCase()
                    .includes(query) ||

                customer.email
                    ?.toLowerCase()
                    .includes(query) ||

                customer.phone
                    ?.toLowerCase()
                    .includes(query) ||

                customer.location
                    ?.toLowerCase()
                    .includes(query) ||

                customer.customer_segment
                    ?.toLowerCase()
                    .includes(query) ||

                customer.acquisition_source
                    ?.toLowerCase()
                    .includes(query)
            );
        }
    );

    // =====================================================
    // HELPERS
    // =====================================================

    const formatDate = (date) => {

        if (!date) {
            return "—";
        }

        return new Date(date).toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );
    };

    const getSegmentClass = (segment) => {

        switch (
            String(segment || "").toLowerCase()
        ) {

            case "new":
                return "segment-new";

            case "returning":
                return "segment-returning";

            case "vip":
                return "segment-vip";

            case "loyal":
                return "segment-loyal";

            default:
                return "segment-default";
        }
    };

    // =====================================================
    // RENDER
    // =====================================================

    return (

        <div className="customers-page">

            <div className="customers-header">

                <div>
                    <h1>Customers</h1>

                    <p>
                        View and manage your customer information.
                    </p>
                </div>

                <button
                    className="refresh-button"
                    onClick={fetchCustomers}
                >
                    ↻ Refresh
                </button>

            </div>

            <div className="customer-stats">

                <div className="customer-stat-card">

                    <div className="stat-icon">
                        👥
                    </div>

                    <div>
                        <span className="stat-label">
                            Customers
                        </span>

                        <strong className="stat-value">
                            {customers.length}
                        </strong>
                    </div>

                </div>

                <div className="customer-stat-card">

                    <div className="stat-icon">
                        📍
                    </div>

                    <div>
                        <span className="stat-label">
                            Locations
                        </span>

                        <strong className="stat-value">
                            {
                                new Set(
                                    customers.map(
                                        customer =>
                                            customer.location
                                    )
                                ).size
                            }
                        </strong>
                    </div>

                </div>

                <div className="customer-stat-card">

                    <div className="stat-icon">
                        ✦
                    </div>

                    <div>

                        <span className="stat-label">
                            New Customers
                        </span>

                        <strong className="stat-value">
                            {
                                customers.filter(
                                    customer =>
                                        customer.customer_segment
                                            ?.toLowerCase() === "new"
                                ).length
                            }
                        </strong>

                    </div>

                </div>

                <div className="customer-stat-card">

                    <div className="stat-icon">
                        ◎
                    </div>

                    <div>

                        <span className="stat-label">
                            Acquisition Sources
                        </span>

                        <strong className="stat-value">
                            {
                                new Set(
                                    customers.map(
                                        customer =>
                                            customer.acquisition_source
                                    )
                                ).size
                            }
                        </strong>

                    </div>

                </div>

            </div>

            <div className="customers-card">

                <div className="customers-toolbar">

                    <div>

                        <h2>
                            Customer List
                        </h2>

                        <span>
                            {filteredCustomers.length} customer
                            {filteredCustomers.length !== 1
                                ? "s"
                                : ""}
                        </span>

                    </div>

                    <div className="customer-search">

                        <span>
                            ⌕
                        </span>

                        <input
                            type="text"
                            placeholder="Search customers..."
                            value={search}
                            onChange={(e) =>
                                setSearch(e.target.value)
                            }
                        />

                    </div>

                </div>

                {loading && (

                    <div className="customers-message">
                        Loading customers...
                    </div>

                )}

                {!loading && error && (

                    <div className="customers-message error">
                        {error}
                    </div>

                )}

                {!loading &&
                    !error &&
                    filteredCustomers.length === 0 && (

                        <div className="customers-message">
                            No customers found.
                        </div>
                    )
                }

                {!loading &&
                    !error &&
                    filteredCustomers.length > 0 && (

                        <div className="customers-table-wrapper">

                            <table className="customers-table">

                                <thead>

                                    <tr>

                                        <th>
                                            Customer
                                        </th>

                                        <th>
                                            Contact
                                        </th>

                                        <th>
                                            Location
                                        </th>

                                        <th>
                                            Segment
                                        </th>

                                        <th>
                                            Acquisition
                                        </th>

                                        <th>
                                            Signup Date
                                        </th>

                                    </tr>

                                </thead>

                                <tbody>

                                    {filteredCustomers.map(
                                        (customer) => (

                                            <tr
                                                key={
                                                    customer.customer_id
                                                }
                                                className="customer-row"
                                                onClick={() =>
                                                    setSelectedCustomer(
                                                        customer
                                                    )
                                                }
                                            >

                                                <td>

                                                    <div className="customer-name-cell">

                                                        <div className="customer-avatar">

                                                            {
                                                                customer.name
                                                                    ?.charAt(0)
                                                                    .toUpperCase()
                                                            }

                                                        </div>

                                                        <div>

                                                            <strong>
                                                                {
                                                                    customer.name
                                                                }
                                                            </strong>

                                                            <small>
                                                                {
                                                                    customer.customer_id
                                                                }
                                                            </small>

                                                        </div>

                                                    </div>

                                                </td>

                                                <td>

                                                    <div className="contact-cell">

                                                        <span>
                                                            {
                                                                customer.email
                                                            }
                                                        </span>

                                                        <small>
                                                            {
                                                                customer.phone
                                                            }
                                                        </small>

                                                    </div>

                                                </td>

                                                <td>
                                                    {
                                                        customer.location ||
                                                        "—"
                                                    }
                                                </td>

                                                <td>

                                                    <span
                                                        className={`customer-status ${getSegmentClass(
                                                            customer.customer_segment
                                                        )}`}
                                                    >
                                                        {
                                                            customer.customer_segment ||
                                                            "—"
                                                        }
                                                    </span>

                                                </td>

                                                <td>
                                                    {
                                                        customer.acquisition_source ||
                                                        "—"
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        formatDate(
                                                            customer.signup_date
                                                        )
                                                    }
                                                </td>

                                            </tr>
                                        )
                                    )}

                                </tbody>

                            </table>

                        </div>
                    )
                }

            </div>

            {selectedCustomer && (

                <div
                    className="customer-modal-overlay"
                    onClick={() =>
                        setSelectedCustomer(null)
                    }
                >

                    <div
                        className="customer-modal"
                        onClick={(e) =>
                            e.stopPropagation()
                        }
                    >

                        <button
                            className="modal-close"
                            onClick={() =>
                                setSelectedCustomer(null)
                            }
                        >
                            ×
                        </button>

                        <div className="modal-customer-header">

                            <div className="modal-avatar">

                                {
                                    selectedCustomer.name
                                        ?.charAt(0)
                                        .toUpperCase()
                                }

                            </div>

                            <div>

                                <h2>
                                    {
                                        selectedCustomer.name
                                    }
                                </h2>

                                <p>
                                    {
                                        selectedCustomer.customer_id
                                    }
                                </p>

                            </div>

                        </div>

                        <div className="customer-details-grid">

                            <div className="detail-item">

                                <span>
                                    Email
                                </span>

                                <strong>
                                    {
                                        selectedCustomer.email ||
                                        "—"
                                    }
                                </strong>

                            </div>

                            <div className="detail-item">

                                <span>
                                    Phone
                                </span>

                                <strong>
                                    {
                                        selectedCustomer.phone ||
                                        "—"
                                    }
                                </strong>

                            </div>

                            <div className="detail-item">

                                <span>
                                    Location
                                </span>

                                <strong>
                                    {
                                        selectedCustomer.location ||
                                        "—"
                                    }
                                </strong>

                            </div>

                            <div className="detail-item">

                                <span>
                                    Segment
                                </span>

                                <strong>
                                    {
                                        selectedCustomer.customer_segment ||
                                        "—"
                                    }
                                </strong>

                            </div>

                            <div className="detail-item">

                                <span>
                                    Acquisition Source
                                </span>

                                <strong>
                                    {
                                        selectedCustomer.acquisition_source ||
                                        "—"
                                    }
                                </strong>

                            </div>

                            <div className="detail-item">

                                <span>
                                    Signup Date
                                </span>

                                <strong>
                                    {
                                        formatDate(
                                            selectedCustomer.signup_date
                                        )
                                    }
                                </strong>

                            </div>

                        </div>

                    </div>

                </div>

            )}

        </div>
    );
}

export default Customers;

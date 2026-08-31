
import React, { useEffect, useMemo, useState } from "react";
import "./expenses.css";
import API_URL from "../api";

function Expenses() {

    // =====================================================
    // STATES
    // =====================================================

    const [expenses, setExpenses] = useState([]);
    const [summary, setSummary] = useState(null);

    const [search, setSearch] = useState("");
    const [categoryFilter, setCategoryFilter] =
        useState("All Categories");

    const [currentPage, setCurrentPage] = useState(1);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const expensesPerPage = 6;

    // =====================================================
    // FETCH DATA
    // =====================================================

    useEffect(() => {
        fetchExpenses();
        fetchSummary();
    }, []);


    // =====================================================
    // FETCH EXPENSES
    // =====================================================

    const fetchExpenses = async () => {

        try {

            setLoading(true);
            setError("");

            const response = await fetch(
                `${API_URL}/api/expenses`
            );

            if (!response.ok) {
                throw new Error("Failed to fetch expenses");
            }

            const data = await response.json();

            console.log("EXPENSES API RESPONSE:", data);

            let expenseData = [];

            if (Array.isArray(data)) {
                expenseData = data;
            }
            else if (Array.isArray(data.expenses)) {
                expenseData = data.expenses;
            }
            else if (Array.isArray(data.data)) {
                expenseData = data.data;
            }

            setExpenses(expenseData);

        } catch (error) {

            console.error("Expense error:", error);

            setError(
                "Unable to load expenses. Make sure FastAPI is running on port 8000."
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
                `${API_URL}/api/expenses/summary`
            );

            if (!response.ok) {
                throw new Error("Failed to fetch summary");
            }

            const data = await response.json();

            console.log("EXPENSE SUMMARY:", data);

            setSummary(data);

        } catch (error) {

            console.error("Summary error:", error);

        }

    };


    // =====================================================
    // GET UNIQUE CATEGORIES
    // =====================================================

    const categories = useMemo(() => {

        const uniqueCategories = expenses
            .map((expense) => expense.category)
            .filter(Boolean);

        return [...new Set(uniqueCategories)].sort();

    }, [expenses]);


    // =====================================================
    // FILTER EXPENSES
    // =====================================================

    const filteredExpenses = expenses.filter(
        (expense) => {

            const searchText =
                search.toLowerCase().trim();

            const expenseId =
                String(
                    expense.expense_id || ""
                ).toLowerCase();

            const description =
                String(
                    expense.description || ""
                ).toLowerCase();

            const category =
                String(
                    expense.category || ""
                ).toLowerCase();


            const matchesSearch =
                expenseId.includes(searchText) ||
                description.includes(searchText) ||
                category.includes(searchText);


            const matchesCategory =
                categoryFilter === "All Categories" ||
                expense.category === categoryFilter;


            return (
                matchesSearch &&
                matchesCategory
            );

        }
    );


    // =====================================================
    // PAGINATION
    // =====================================================

    const totalPages = Math.ceil(
        filteredExpenses.length /
        expensesPerPage
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

    }, [totalPages, currentPage]);


    const startIndex =
        (currentPage - 1) *
        expensesPerPage;


    const currentExpenses =
        filteredExpenses.slice(
            startIndex,
            startIndex + expensesPerPage
        );


    // =====================================================
    // MONTHLY CHART
    // =====================================================

    const chartData = useMemo(() => {

        const now = new Date();

        const months = [];

        for (let i = 5; i >= 0; i--) {

            const date = new Date(
                now.getFullYear(),
                now.getMonth() - i,
                1
            );

            months.push({
                month: date.toLocaleString(
                    "en-US",
                    {
                        month: "short"
                    }
                ),

                monthNumber: date.getMonth(),

                year: date.getFullYear(),

                amount: 0
            });

        }


        expenses.forEach((expense) => {

            if (!expense.date) {
                return;
            }

            const date = new Date(
                expense.date
            );

            if (
                Number.isNaN(
                    date.getTime()
                )
            ) {
                return;
            }

            const found = months.find(
                (item) =>
                    item.monthNumber === date.getMonth() &&
                    item.year === date.getFullYear()
            );

            if (found) {

                found.amount += Number(
                    expense.amount || 0
                );

            }

        });


        return months;

    }, [expenses]);


    // =====================================================
    // MAX CHART VALUE
    // =====================================================

    const maxChartValue = Math.max(
        ...chartData.map(
            (item) => item.amount
        ),
        1
    );


    // =====================================================
    // SEARCH
    // =====================================================

    const handleSearch = (e) => {

        setSearch(e.target.value);
        setCurrentPage(1);

    };


    // =====================================================
    // CATEGORY
    // =====================================================

    const handleCategory = (e) => {

        setCategoryFilter(e.target.value);
        setCurrentPage(1);

    };


    // =====================================================
    // CLEAR
    // =====================================================

    const clearFilters = () => {

        setSearch("");
        setCategoryFilter("All Categories");
        setCurrentPage(1);

    };


    // =====================================================
    // FORMAT DATE
    // =====================================================

    const formatDate = (date) => {

        if (!date) {
            return "-";
        }

        const parsedDate = new Date(date);

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

        const number = Number(amount);

        if (Number.isNaN(number)) {
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
    // LOADING
    // =====================================================

    if (loading) {

        return (
            <div className="expenses-page">

                <h2>
                    Loading expenses...
                </h2>

            </div>
        );

    }


    // =====================================================
    // ERROR
    // =====================================================

    if (error) {

        return (
            <div className="expenses-page">

                <h2>
                    {error}
                </h2>

                <button
                    className="add-expense-btn"
                    onClick={() => {
                        fetchExpenses();
                        fetchSummary();
                    }}
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

        <div className="expenses-page">

            {/* HEADER */}

            <div className="expenses-header">

                <div>

                    <h2>
                        Expenses
                    </h2>

                    <p>
                        Track and manage your business expenses
                    </p>

                </div>

                <button className="add-expense-btn">
                    + Add Expense
                </button>

            </div>


            {/* STATISTICS */}

            <div className="expenses-stats">

                <div className="expense-stat-card">

                    <div className="expense-stat-icon">
                        ₹
                    </div>

                    <div>

                        <p>Total Expenses</p>

                        <h3>
                            ₹
                            {formatMoney(
                                summary?.total_expenses
                            )}
                        </h3>

                        <span className="expense-negative">
                            Total recorded expenses
                        </span>

                    </div>

                </div>


                <div className="expense-stat-card">

                    <div className="expense-stat-icon">
                        📅
                    </div>

                    <div>

                        <p>This Month</p>

                        <h3>
                            ₹
                            {formatMoney(
                                summary?.this_month
                            )}
                        </h3>

                        <span className="expense-positive">
                            Current month
                        </span>

                    </div>

                </div>


                <div className="expense-stat-card">

                    <div className="expense-stat-icon">
                        🧾
                    </div>

                    <div>

                        <p>Total Transactions</p>

                        <h3>
                            {
                                summary?.total_transactions || 0
                            }
                        </h3>

                        <span className="expense-neutral">
                            All transactions
                        </span>

                    </div>

                </div>


                <div className="expense-stat-card">

                    <div className="expense-stat-icon">
                        📊
                    </div>

                    <div>

                        <p>Average Expense</p>

                        <h3>
                            ₹
                            {formatMoney(
                                summary?.average_expense
                            )}
                        </h3>

                        <span className="expense-neutral">
                            Per transaction
                        </span>

                    </div>

                </div>

            </div>


            {/* EXPENSE OVERVIEW */}

            <div className="expenses-overview-card">

                <div className="expenses-card-header">

                    <div>

                        <h3>
                            Expense Overview
                        </h3>

                        <p>
                            Monthly expense breakdown
                        </p>

                    </div>

                    <select defaultValue="Last 6 Months">

                        <option>
                            Last 6 Months
                        </option>

                        <option>
                            Last 12 Months
                        </option>

                        <option>
                            This Year
                        </option>

                    </select>

                </div>


                {/* CHART */}

                <div className="expense-chart">

                    <div className="expense-y-axis">

                        <span>
                            ₹
                            {formatMoney(
                                maxChartValue
                            )}
                        </span>

                        <span>
                            ₹
                            {formatMoney(
                                maxChartValue * 0.75
                            )}
                        </span>

                        <span>
                            ₹
                            {formatMoney(
                                maxChartValue * 0.5
                            )}
                        </span>

                        <span>
                            ₹
                            {formatMoney(
                                maxChartValue * 0.25
                            )}
                        </span>

                        <span>
                            ₹0
                        </span>

                    </div>


                    <div className="expense-chart-area">

                        <div className="expense-grid-line"></div>
                        <div className="expense-grid-line"></div>
                        <div className="expense-grid-line"></div>
                        <div className="expense-grid-line"></div>
                        <div className="expense-grid-line"></div>


                        <div className="expense-bars">

                            {chartData.map(
                                (item, index) => {

                                    const height =
                                        item.amount === 0
                                            ? 0
                                            : (
                                                item.amount /
                                                maxChartValue
                                            ) * 100;

                                    return (

                                        <div
                                            className="expense-bar-item"
                                            key={
                                                `${item.year}-${item.monthNumber}`
                                            }
                                        >

                                            <div
                                                className={
                                                    `expense-bar expense-bar-${index + 1}`
                                                }

                                                style={{
                                                    height:
                                                        `${height}%`
                                                }}

                                                title={
                                                    `₹${formatMoney(
                                                        item.amount
                                                    )}`
                                                }
                                            >
                                            </div>

                                            <span>
                                                {item.month}
                                            </span>

                                        </div>

                                    );

                                }
                            )}

                        </div>

                    </div>

                </div>

            </div>


            {/* EXPENSE TABLE */}

            <div className="expenses-table-card">

                <div className="expenses-card-header">

                    <div>

                        <h3>
                            Recent Expenses
                        </h3>

                        <p>
                            View and manage your expense transactions
                        </p>

                    </div>


                    {/* FILTERS */}

                    <div className="expense-filters">

                        <input
                            type="text"
                            placeholder="Search expenses..."
                            value={search}
                            onChange={handleSearch}
                        />


                        <select
                            value={categoryFilter}
                            onChange={handleCategory}
                        >

                            <option value="All Categories">
                                All Categories
                            </option>

                            {categories.map(
                                (category) => (

                                    <option
                                        key={category}
                                        value={category}
                                    >
                                        {category}
                                    </option>

                                )
                            )}

                        </select>


                        <button
                            className="clear-expense-filter-btn"
                            onClick={clearFilters}
                        >
                            Clear
                        </button>

                    </div>

                </div>


                {/* TABLE */}

                <div className="expenses-table-container">

                    <table className="expenses-table">

                        <thead>

                            <tr>

                                <th>Expense ID</th>
                                <th>Date</th>
                                <th>Description</th>
                                <th>Category</th>
                                <th>Recurring</th>
                                <th>Amount</th>
                                <th>Action</th>

                            </tr>

                        </thead>


                        <tbody>

                            {currentExpenses.length > 0 ? (

                                currentExpenses.map(
                                    (expense) => (

                                        <tr
                                            key={
                                                expense.expense_id
                                            }
                                        >

                                            <td>

                                                <strong>
                                                    #EXP-
                                                    {
                                                        expense.expense_id
                                                    }
                                                </strong>

                                            </td>


                                            <td>
                                                {
                                                    formatDate(
                                                        expense.date
                                                    )
                                                }
                                            </td>


                                            <td>
                                                {
                                                    expense.description ||
                                                    "-"
                                                }
                                            </td>


                                            <td>

                                                <span
                                                    className={
                                                        `expense-category ${String(
                                                            expense.category ||
                                                            "Other"
                                                        )
                                                            .toLowerCase()
                                                            .replace(
                                                                /\s+/g,
                                                                "-"
                                                            )}`
                                                    }
                                                >
                                                    {
                                                        expense.category ||
                                                        "Other"
                                                    }
                                                </span>

                                            </td>


                                            <td>

                                                {
                                                    expense.recurring
                                                        ? (
                                                            <span className="expense-positive">
                                                                Yes
                                                            </span>
                                                        )
                                                        : (
                                                            <span className="expense-neutral">
                                                                No
                                                            </span>
                                                        )
                                                }

                                            </td>


                                            <td className="expense-amount">

                                                ₹
                                                {
                                                    formatMoney(
                                                        expense.amount
                                                    )
                                                }

                                            </td>


                                            <td>

                                                <button
                                                    className="expense-action"
                                                    onClick={() =>
                                                        console.log(
                                                            "Selected expense:",
                                                            expense
                                                        )
                                                    }
                                                >
                                                    View
                                                </button>

                                            </td>

                                        </tr>

                                    )
                                )

                            ) : (

                                <tr>

                                    <td
                                        colSpan="7"
                                        style={{
                                            textAlign: "center",
                                            padding: "40px"
                                        }}
                                    >
                                        No expenses found.
                                    </td>

                                </tr>

                            )}

                        </tbody>

                    </table>

                </div>


                {/* PAGINATION */}

                <div className="expenses-pagination">

                    <span>

                        Showing{" "}

                        {
                            filteredExpenses.length === 0
                                ? 0
                                : startIndex + 1
                        }

                        {"–"}

                        {
                            Math.min(
                                startIndex + expensesPerPage,
                                filteredExpenses.length
                            )
                        }

                        {" "}of{" "}

                        {
                            filteredExpenses.length
                        }

                        {" "}expenses

                    </span>


                    <div className="expense-pagination-buttons">

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


                        {Array.from(
                            {
                                length: totalPages
                            },
                            (_, index) =>
                                index + 1
                        ).map(
                            (page) => (

                                <button
                                    key={page}
                                    className={
                                        currentPage === page
                                            ? "expense-page-active"
                                            : ""
                                    }
                                    onClick={() =>
                                        setCurrentPage(page)
                                    }
                                >
                                    {page}
                                </button>

                            )
                        )}


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

export default Expenses;


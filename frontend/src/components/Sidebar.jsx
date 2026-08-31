
function Sidebar({ currentPage, onPageChange }) {
    return (
        <aside className="sidebar">

            {/* Logo */}
            <div className="logo">
                <div className="logo-icon">SB</div>

                <div className="logo-text">
                    <h2>SmallBiz</h2>
                    <span>Business Manager</span>
                </div>
            </div>


            {/* Navigation */}
            <nav className="sidebar-nav">

                <p className="nav-heading">
                    MENU
                </p>


                {/* Dashboard */}
                <button
                    className={`nav-item ${
                        currentPage === "dashboard" ? "active" : ""
                    }`}
                    onClick={() => onPageChange("dashboard")}
                >
                    <span className="nav-icon">⌂</span>
                    <span>Dashboard</span>
                </button>


                {/* AI Manager */}
                <button
                    className={`nav-item ${
                        currentPage === "aimanager" ? "active" : ""
                    }`}
                    onClick={() => onPageChange("aimanager")}
                >
                    <span className="nav-icon">✦</span>
                    <span>AI Manager</span>
                </button>


                {/* Sales */}
                <button
                    className={`nav-item ${
                        currentPage === "sales" ? "active" : ""
                    }`}
                    onClick={() => onPageChange("sales")}
                >
                    <span className="nav-icon">↗</span>
                    <span>Sales</span>
                </button>


                {/* Orders */}
                <button
                    className={`nav-item ${
                        currentPage === "orders" ? "active" : ""
                    }`}
                    onClick={() => onPageChange("orders")}
                >
                    <span className="nav-icon">▤</span>
                    <span>Orders</span>
                </button>


                {/* Customers */}
                <button
                    className={`nav-item ${
                        currentPage === "customers" ? "active" : ""
                    }`}
                    onClick={() => onPageChange("customers")}
                >
                    <span className="nav-icon">♙</span>
                    <span>Customers</span>
                </button>


                {/* Inventory */}
                <button
                    className={`nav-item ${
                        currentPage === "inventory" ? "active" : ""
                    }`}
                    onClick={() => onPageChange("inventory")}
                >
                    <span className="nav-icon">□</span>
                    <span>Inventory</span>
                </button>


                {/* Expenses */}
                <button
                    className={`nav-item ${
                        currentPage === "expenses" ? "active" : ""
                    }`}
                    onClick={() => onPageChange("expenses")}
                >
                    <span className="nav-icon">₹</span>
                    <span>Expenses</span>
                </button>


                {/* Reports */}
                <button
                    className={`nav-item ${
                        currentPage === "report" ? "active" : ""
                    }`}
                    onClick={() => onPageChange("report")}
                >
                    <span className="nav-icon">▥</span>
                    <span>Reports</span>
                </button>


                {/* Marketing */}
                <button
                    className={`nav-item ${
                        currentPage === "marketing" ? "active" : ""
                    }`}
                    onClick={() => onPageChange("marketing")}
                >
                    <span className="nav-icon">◌</span>
                    <span>Marketing</span>
                </button>

            </nav>


            {/* Bottom */}
            <div className="sidebar-bottom">

                {/* Settings */}
                <button
                    className={`nav-item ${
                        currentPage === "settings" ? "active" : ""
                    }`}
                    onClick={() => onPageChange("settings")}
                >
                    <span className="nav-icon">⚙</span>
                    <span>Settings</span>
                </button>


                {/* User Profile */}
                <div className="user-profile">

                    <div className="user-avatar">
                        V
                    </div>

                    <div className="user-info">
                        <strong>Sanchita</strong>
                        <span>Owner</span>
                    </div>

                </div>

            </div>

        </aside>
    );
}

export default Sidebar;


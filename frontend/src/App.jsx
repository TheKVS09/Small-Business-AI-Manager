
import { useState } from "react";

import Sidebar from "./components/Sidebar";
import Dashboard from "./components/dashboard";
import Sales from "./components/sales";
import Orders from "./components/order";
import Customers from "./components/customers";
import Inventory from "./components/inventory";
import Expenses from "./components/expenses";
import Report from "./components/report";
import AIManager from "./components/AIManager";
import Settings from "./components/setting";
import Marketing from "./components/marketing";

import "./App.css";


function App() {

    const [currentPage, setCurrentPage] =
        useState("dashboard");


    const renderPage = () => {

        switch (currentPage) {

            case "dashboard":
                return <Dashboard />;


            case "sales":
                return <Sales />;


            case "orders":
                return <Orders />;


            case "customers":
                return <Customers />;


            case "inventory":
                return <Inventory />;


            case "expenses":
                return <Expenses />;


            case "report":
                return <Report />;


            case "aimanager":
                return <AIManager />;


            case "settings":
                return <Settings />;


            case "marketing":
                return <Marketing />;


            default:
                return <Dashboard />;
        }
    };


    return (

        <div className="app">

            <Sidebar
                currentPage={currentPage}
                onPageChange={setCurrentPage}
            />


            <main className="main-content">

                {renderPage()}

            </main>

        </div>

    );
}


export default App;



import React, { useEffect, useState } from "react";
import "./inventory.css";
import API_URL from "../api";

function Inventory() {

  // =====================================================
  // STATES
  // =====================================================

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  // =====================================================
  // FETCH INVENTORY
  // =====================================================

  useEffect(() => {
    fetchInventory();
  }, []);


  const fetchInventory = async () => {

    try {

      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/api/inventory`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch inventory");
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error("Invalid inventory data");
      }

      setProducts(data);

    } catch (error) {

      console.error(
        "Inventory error:",
        error
      );

      setError(
        "Unable to load inventory. Make sure the API server is running."
      );

    } finally {

      setLoading(false);

    }

  };


  // =====================================================
  // FORMAT PRICE
  // =====================================================

  const formatPrice = (price) => {

    return Number(
      price || 0
    ).toLocaleString(
      "en-IN",
      {
        maximumFractionDigits: 2
      }
    );

  };


  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {

    return (

      <div className="inventory-page">

        <h2>
          Loading inventory...
        </h2>

      </div>

    );

  }


  // =====================================================
  // ERROR
  // =====================================================

  if (error) {

    return (

      <div className="inventory-page">

        <h2>
          {error}
        </h2>

        <button
          className="add-product-btn"
          onClick={fetchInventory}
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

    <div className="inventory-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="inventory-header">

        <div>

          <h2>
            Inventory
          </h2>

          <p>
            Manage your products and stock levels
          </p>

        </div>

        <button className="add-product-btn">
          + Add Product
        </button>

      </div>


      {/* =================================================
          INVENTORY CARD
      ================================================= */}

      <div className="inventory-card">

        <table className="inventory-table">

          {/* =================================================
              TABLE HEADER
          ================================================= */}

          <thead>

            <tr>

              <th>
                Product
              </th>

              <th>
                Product ID
              </th>

              <th>
                Category
              </th>

              <th>
                Price
              </th>

              <th>
                Stock
              </th>

              <th>
                Status
              </th>

            </tr>

          </thead>


          {/* =================================================
              TABLE BODY
          ================================================= */}

          <tbody>

            {products.length > 0 ? (

              products.map(
                (product) => (

                  <tr
                    key={
                      product.product_id
                    }
                  >

                    {/* PRODUCT NAME */}

                    <td>

                      <strong>
                        {
                          product.name ||
                          "Unnamed Product"
                        }
                      </strong>

                    </td>


                    {/* PRODUCT ID */}

                    <td>

                      {
                        product.product_id ||
                        "-"
                      }

                    </td>


                    {/* CATEGORY */}

                    <td>

                      {
                        product.category ||
                        "-"
                      }

                    </td>


                    {/* PRICE */}

                    <td>

                      ₹
                      {formatPrice(
                        product.price
                      )}

                    </td>


                    {/* STOCK */}

                    <td>

                      {
                        product.stock ?? 0
                      }

                    </td>


                    {/* STATUS */}

                    <td>

                      {
                        Number(
                          product.stock || 0
                        ) === 0 ? (

                          <span
                            className="inventory-status out"
                          >
                            Out of Stock
                          </span>

                        ) : Number(
                          product.stock || 0
                        ) <= Number(
                          product.reorder_level || 0
                        ) ? (

                          <span
                            className="inventory-status low"
                          >
                            Low Stock
                          </span>

                        ) : (

                          <span
                            className="inventory-status in-stock"
                          >
                            In Stock
                          </span>

                        )
                      }

                    </td>

                  </tr>

                )
              )

            ) : (

              <tr>

                <td
                  colSpan="6"
                  style={{
                    textAlign: "center",
                    padding: "40px"
                  }}
                >

                  No inventory found.

                </td>

              </tr>

            )}

          </tbody>

        </table>

      </div>

    </div>

  );

}


export default Inventory;


import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import "./display.css";

const CHART_COLORS = [
  "#6366f1",
  "#a855f7",
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
];

// Helper to handle currency, percentage, and number formatting
const formatValue = (val, format) => {
  if (val === undefined || val === null) return "";
  if (typeof val === "string" && val.endsWith("%")) return val;

  if (format === "currency") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(val);
  }
  if (format === "percentage") return `${val}%`;
  if (format === "number" && typeof val === "number")
    return val.toLocaleString();

  return val;
};

export default function DisplayEngine({ data, display, payload: payloadProp }) {
  const payload = display || data || payloadProp;

  if (!payload || !Array.isArray(payload.components)) {
    return null;
  }

  return (
    <div className="ai-report-container">
      {payload.title && <h2 className="ai-report-title">{payload.title}</h2>}

      <div className="ai-report-body">
        {payload.components.map((component, index) => {
          if (!component || typeof component !== "object") return null;

          switch (component.type) {
            /* Text / Paragraph */
            case "text":
            case "paragraph":
              return (
                <p key={index} className="ai-report-paragraph">
                  {component.content || component.value || component.text}
                </p>
              );

            /* Metrics / Summary Cards */
            case "summary":
            case "metrics":
              return (
                <div key={index} className="ai-summary-block">
                  {component.title && <h3>{component.title}</h3>}
                  <div className="ai-summary-grid">
                    {(component.items || component.data)?.map((item, i) => (
                      <div key={i} className="ai-summary-card">
                        <span className="ai-summary-label">
                          {item.label || item.title}
                        </span>
                        <span className="ai-summary-value">
                          {formatValue(item.value, item.format)}
                        </span>
                        {item.change !== undefined && (
                          <span
                            className={`ai-summary-change ${
                              item.change < 0 ? "negative" : "positive"
                            }`}
                          >
                            {item.change > 0 ? `+${item.change}%` : `${item.change}%`}{" "}
                            {item.change_label && (
                              <span className="change-label">
                                {item.change_label}
                              </span>
                            )}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );

            /* Callout Blocks (Insight, Recommendation, Warning) */
            case "insight":
            case "recommendation":
            case "warning":
              return (
                <div key={index} className={`ai-callout-block ${component.type}`}>
                  {component.title && <h4>{component.title}</h4>}
                  <p>{component.content}</p>
                </div>
              );

            /* Bullet Lists */
            case "bullet_list":
              return (
                <div key={index} className="ai-bullet-block">
                  {component.title && <h3>{component.title}</h3>}
                  <ul>
                    {component.items?.map((item, i) => (
                      <li key={i}>
                        {typeof item === "string"
                          ? item
                          : item.value || item.text}
                      </li>
                    ))}
                  </ul>
                </div>
              );

            /* Data Tables */
            case "table":
              const headers =
                component.columns ||
                component.headers ||
                component.data?.headers;
              const rows = component.rows || component.data?.rows;

              return (
                <div key={index} className="ai-table-block">
                  {component.title && <h3>{component.title}</h3>}
                  <div className="ai-table-wrapper">
                    <table>
                      {headers && (
                        <thead>
                          <tr>
                            {headers.map((header, i) => (
                              <th key={i}>{header}</th>
                            ))}
                          </tr>
                        </thead>
                      )}
                      <tbody>
                        {rows?.map((row, rowIndex) => (
                          <tr key={rowIndex}>
                            {Array.isArray(row)
                              ? row.map((cell, cellIndex) => (
                                  <td key={cellIndex}>
                                    {cellIndex > 0 && typeof cell === "number"
                                      ? cellIndex === row.length - 1
                                        ? `${cell}%`
                                        : formatValue(cell, "currency")
                                      : cell}
                                  </td>
                                ))
                              : Object.values(row).map((cell, cellIndex) => (
                                  <td key={cellIndex}>{cell}</td>
                                ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );

            /* Recharts Graphs */
            case "chart":
              return (
                <div key={index} className="ai-chart-block">
                  {component.title && <h3>{component.title}</h3>}
                  <div className="ai-chart-wrapper">
                    <ResponsiveContainer width="100%" height={280}>
                      {renderChart(component)}
                    </ResponsiveContainer>
                  </div>
                </div>
              );

            default:
              return null;
          }
        })}
      </div>
    </div>
  );
}

// ============================================================
// RECHARTS RENDERER HELPER
// ============================================================

function renderChart(chartData) {
  const { chart_type, data = [], x_key, series = [], value_format } = chartData;

  const inferredXKey =
    x_key || (data[0] && "label" in data[0] ? "label" : "name");
  const activeSeries =
    series.length > 0
      ? series
      : [{ dataKey: "value", name: "Value" }];

  const formatTooltip = (val) => formatValue(val, value_format);

  if (chart_type === "bar") {
    return (
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey={inferredXKey} stroke="#64748b" fontSize={12} />
        <YAxis
          stroke="#64748b"
          fontSize={12}
          tickFormatter={(val) =>
            value_format === "currency"
              ? `$${(val / 1000).toFixed(0)}k`
              : value_format === "percentage"
              ? `${val}%`
              : val
          }
        />
        <Tooltip formatter={formatTooltip} />
        {series.length > 0 && <Legend />}
        {activeSeries.map((item, i) => (
          <Bar
            key={i}
            dataKey={item.dataKey}
            name={item.name}
            fill={item.color || CHART_COLORS[i % CHART_COLORS.length]}
            radius={[4, 4, 0, 0]}
          />
        ))}
      </BarChart>
    );
  }

  if (chart_type === "line") {
    return (
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey={inferredXKey} stroke="#64748b" fontSize={12} />
        <YAxis stroke="#64748b" fontSize={12} />
        <Tooltip formatter={formatTooltip} />
        {series.length > 0 && <Legend />}
        {activeSeries.map((item, i) => (
          <Line
            key={i}
            type="monotone"
            dataKey={item.dataKey}
            name={item.name}
            stroke={item.color || CHART_COLORS[i % CHART_COLORS.length]}
            strokeWidth={2}
          />
        ))}
      </LineChart>
    );
  }

  /* Handles Pie and Donut Chart Visualizations */
  if (chart_type === "pie" || chart_type === "donut") {
    const valueKey = activeSeries[0]?.dataKey || "value";
    return (
      <PieChart>
        <Tooltip formatter={formatTooltip} />
        <Legend />
        <Pie
          data={data}
          dataKey={valueKey}
          nameKey={inferredXKey}
          cx="50%"
          cy="50%"
          innerRadius={chart_type === "donut" ? 50 : 0}
          outerRadius={85}
          label
        >
          {data.map((_, i) => (
            <Cell
              key={`cell-${i}`}
              fill={CHART_COLORS[i % CHART_COLORS.length]}
            />
          ))}
        </Pie>
      </PieChart>
    );
  }

  return null;
}
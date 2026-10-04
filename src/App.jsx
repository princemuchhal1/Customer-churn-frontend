import { useState } from "react";
import "./App.css";

function App() {
  const [formData, setFormData] = useState({
    payment_method: "Mailed check",
    paperless_billing: "No",
    contract: "Month-to-month",
    streaming_tv: "No",
    streaming_movies: "No",
    tech_support: "No",
    device_protection: "No",
    online_backup: "No",
    online_security: "No",
    internet_service: "DSL",
    dependents: "No",
    senior_citizen: "No",
    partner: "No",
    tenure_months: 2,
    monthly_charges: 50
  });

  const [result, setResult] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [predictionHistory, setPredictionHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);

  // Batch prediction state
  const [selectedFile, setSelectedFile] = useState(null);
  const [batchResults, setBatchResults] = useState(null);
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchError, setBatchError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value
    });
  };

  // -----------------------------
  // Single prediction
  // -----------------------------

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/predict`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            ...formData,
            tenure_months: Number(formData.tenure_months),
            monthly_charges: Number(formData.monthly_charges)
          })
        }
      );

      if (!response.ok) {
        throw new Error("Prediction request failed.");
      }

      const data = await response.json();

      setResult(data);
    } catch (err) {
      setError("Unable to connect to the prediction server.");
    } finally {
      setLoading(false);
    }
  };

  // History Fetching

  const handleFetchHistory = async () => {
    setHistoryLoading(true);
    setHistoryError(null);

    try {
        const response = await fetch(
            `${import.meta.env.VITE_API_URL}/predictions`
        );

        if (!response.ok) {
            throw new Error("Failed to fetch prediction history.");
        }

        const data = await response.json();
        setPredictionHistory(data);

    } catch (error) {
        setHistoryError(error.message);
    } finally {
        setHistoryLoading(false);
    }
  };

  // -----------------------------
  // File selection
  // -----------------------------

  const handleFileChange = (e) => {
    const file = e.target.files[0];

    setSelectedFile(file);
    setBatchResults(null);
    setBatchError(null);
  };

  const handleDownloadSample = () => {
    const sampleData = [
      {
        payment_method: "Mailed check",
        paperless_billing: "No",
        contract: "Month-to-month",
        streaming_tv: "No",
        streaming_movies: "No",
        tech_support: "No",
        device_protection: "No",
        online_backup: "No",
        online_security: "No",
        internet_service: "DSL",
        dependents: "No",
        senior_citizen: "No",
        partner: "No",
        tenure_months: 2,
        monthly_charges: 50
      },
      {
        payment_method: "Electronic check",
        paperless_billing: "Yes",
        contract: "Month-to-month",
        streaming_tv: "Yes",
        streaming_movies: "Yes",
        tech_support: "No",
        device_protection: "No",
        online_backup: "No",
        online_security: "No",
        internet_service: "Fiber optic",
        dependents: "No",
        senior_citizen: "Yes",
        partner: "No",
        tenure_months: 10,
        monthly_charges: 85.5
      }
    ];

    const headers = Object.keys(sampleData[0]);

    const csvRows = [
      headers.join(","),
      ...sampleData.map((row) =>
        headers
          .map((header) => `"${row[header]}"`)
          .join(",")
      )
    ];

    const csvContent = csvRows.join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "sample_customers.csv";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  const handleDownloadResults = () => {
    if (!batchResults || !batchResults.results.length) {
      return;
    }

    const headers = [
      "row",
      "churn_probability",
      "churn_prediction"
    ];

    const csvRows = [
      headers.join(","),
      ...batchResults.results.map((item) => {
        return [
          item.row,
          item.error
            ? ""
            : (item.churn_probability * 100).toFixed(2) + "%",
          item.error
            ? item.error
            : item.churn_prediction
        ].join(",");
      })
    ];

    const csvContent = csvRows.join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "churn_prediction_results.csv";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };
  // -----------------------------
  // Batch prediction
  // -----------------------------

  const handleBatchPrediction = async () => {
    if (!selectedFile) {
      setBatchError("Please select a CSV or JSON file.");
      return;
    }

    const fileName = selectedFile.name.toLowerCase();

    if (!fileName.endsWith(".csv") && !fileName.endsWith(".json")) {
      setBatchError("Only CSV and JSON files are supported.");
      return;
    }

    setBatchLoading(true);
    setBatchError(null);
    setBatchResults(null);

    try {
      const formData = new FormData();

      formData.append("file", selectedFile);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/predict/batch`,
        {
          method: "POST",
          body: formData
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Batch prediction failed."
        );
      }

      setBatchResults(data);
    } catch (err) {
      setBatchError(
        err.message || "Unable to process the uploaded file."
      );
    } finally {
      setBatchLoading(false);
    }
  };

  const successfulResults = batchResults?.results.filter(
    (item) => !item.error
  ) || [];

  const churnedCustomers = successfulResults.filter(
    (item) => item.churn_prediction === "Yes"
  ).length;

  const nonChurnedCustomers = successfulResults.filter(
    (item) => item.churn_prediction === "No"
  ).length;

  const averageChurnProbability =
    successfulResults.length > 0
      ? successfulResults.reduce(
          (sum, item) => sum + item.churn_probability,
          0
        ) / successfulResults.length
      : 0;


  return (
    <div className="app">
      <div className="container">

        {/* Header */}

        <header className="header">
          <h1>Customer Churn Predictor</h1>

          <p>
            Estimate customer churn probability using machine learning.
          </p>
        </header>

        {/* ============================= */}
        {/* Single Customer Prediction */}
        {/* ============================= */}

        <form onSubmit={handleSubmit}>

          {/* Customer Information */}

          <section className="form-section">

            <h2>Customer Information</h2>

            <div className="form-grid">

              <div className="field">
                <label>Senior Citizen</label>

                <select
                  name="senior_citizen"
                  value={formData.senior_citizen}
                  onChange={handleChange}
                >
                  <option>No</option>
                  <option>Yes</option>
                </select>
              </div>

              <div className="field">
                <label>Partner</label>

                <select
                  name="partner"
                  value={formData.partner}
                  onChange={handleChange}
                >
                  <option>No</option>
                  <option>Yes</option>
                </select>
              </div>

              <div className="field">
                <label>Dependents</label>

                <select
                  name="dependents"
                  value={formData.dependents}
                  onChange={handleChange}
                >
                  <option>No</option>
                  <option>Yes</option>
                </select>
              </div>

              <div className="field">
                <label>Tenure (Months)</label>

                <input
                  type="number"
                  name="tenure_months"
                  min="0"
                  value={formData.tenure_months}
                  onChange={handleChange}
                />
              </div>

            </div>

          </section>

          {/* Internet & Services */}

          <section className="form-section">

            <h2>Internet & Services</h2>

            <div className="form-grid">

              <div className="field">
                <label>Internet Service</label>

                <select
                  name="internet_service"
                  value={formData.internet_service}
                  onChange={handleChange}
                >
                  <option>DSL</option>
                  <option>Fiber optic</option>
                  <option>No</option>
                </select>
              </div>

              <div className="field">
                <label>Online Security</label>

                <select
                  name="online_security"
                  value={formData.online_security}
                  onChange={handleChange}
                >
                  <option>No</option>
                  <option>No internet service</option>
                  <option>Yes</option>
                </select>
              </div>

              <div className="field">
                <label>Online Backup</label>

                <select
                  name="online_backup"
                  value={formData.online_backup}
                  onChange={handleChange}
                >
                  <option>No</option>
                  <option>No internet service</option>
                  <option>Yes</option>
                </select>
              </div>

              <div className="field">
                <label>Device Protection</label>

                <select
                  name="device_protection"
                  value={formData.device_protection}
                  onChange={handleChange}
                >
                  <option>No</option>
                  <option>No internet service</option>
                  <option>Yes</option>
                </select>
              </div>

              <div className="field">
                <label>Tech Support</label>

                <select
                  name="tech_support"
                  value={formData.tech_support}
                  onChange={handleChange}
                >
                  <option>No</option>
                  <option>No internet service</option>
                  <option>Yes</option>
                </select>
              </div>

              <div className="field">
                <label>Streaming TV</label>

                <select
                  name="streaming_tv"
                  value={formData.streaming_tv}
                  onChange={handleChange}
                >
                  <option>No</option>
                  <option>No internet service</option>
                  <option>Yes</option>
                </select>
              </div>

              <div className="field">
                <label>Streaming Movies</label>

                <select
                  name="streaming_movies"
                  value={formData.streaming_movies}
                  onChange={handleChange}
                >
                  <option>No</option>
                  <option>No internet service</option>
                  <option>Yes</option>
                </select>
              </div>

            </div>

          </section>

          {/* Billing */}

          <section className="form-section">

            <h2>Billing</h2>

            <div className="form-grid">

              <div className="field">
                <label>Contract</label>

                <select
                  name="contract"
                  value={formData.contract}
                  onChange={handleChange}
                >
                  <option>Month-to-month</option>
                  <option>One year</option>
                  <option>Two year</option>
                </select>
              </div>

              <div className="field">
                <label>Paperless Billing</label>

                <select
                  name="paperless_billing"
                  value={formData.paperless_billing}
                  onChange={handleChange}
                >
                  <option>No</option>
                  <option>Yes</option>
                </select>
              </div>

              <div className="field">
                <label>Payment Method</label>

                <select
                  name="payment_method"
                  value={formData.payment_method}
                  onChange={handleChange}
                >
                  <option>Bank transfer (automatic)</option>
                  <option>Credit card (automatic)</option>
                  <option>Electronic check</option>
                  <option>Mailed check</option>
                </select>
              </div>

              <div className="field">
                <label>Monthly Charges</label>

                <input
                  type="number"
                  name="monthly_charges"
                  min="0"
                  step="0.01"
                  value={formData.monthly_charges}
                  onChange={handleChange}
                />
              </div>

            </div>

          </section>

          <button
            className="predict-button"
            type="submit"
            disabled={loading}
          >
            {loading ? "Predicting..." : "Predict Churn"}
          </button>

        </form>

        {/* Single Prediction Error */}

        {error && (
          <div className="error-box">
            {error}
          </div>
        )}

        {/* Single Prediction Result */}

        {result && (
          <section className="result-section">

            <h2>Prediction Result</h2>

            <div className="result-grid">

              <div className="result-card">
                <span>Churn Probability</span>

                <strong>
                  {(result.churn_probability * 100).toFixed(2)}%
                </strong>
              </div>

              <div className="result-card">
                <span>Prediction</span>

                <strong>
                  {result.churn_prediction}
                </strong>
              </div>

            </div>

          </section>
        )}

        {/* ============================= */}
        {/* Batch Prediction */}
        {/* ============================= */}

        <section className="batch-section">

          <h2>Batch Prediction</h2>

          <p className="batch-description">
            Upload a CSV or JSON file containing multiple customers
            to predict churn for all of them at once.
          </p>

          <div className="file-upload">

            <button
              type="button"
              className="sample-button"
              onClick={handleDownloadSample}
            >
              Download Sample CSV
            </button>

            <input
              type="file"
              accept=".csv,.json"
              onChange={handleFileChange}
            />

            {selectedFile && (
              <p className="selected-file">
                Selected file: <strong>{selectedFile.name}</strong>
              </p>
            )}

          </div>

          <button
            className="batch-button"
            onClick={handleBatchPrediction}
            disabled={batchLoading}
          >
            {batchLoading
              ? "Processing File..."
              : "Predict File"}
          </button>

        </section>

        {/* Batch Error */}

        {batchError && (
          <div className="error-box">
            {batchError}
          </div>
        )}

        {/* Batch Results */}

        {batchResults && (
          <section className="batch-results-section">

            <div className="batch-results-header">

              <h2>Batch Results</h2>

              <button
                type="button"
                className="download-results-button"
                onClick={handleDownloadResults}
              >
                Download Results
              </button>

            </div>

            <div className="batch-summary">

              <div className="summary-card">
                <span>Total Customers</span>
                <strong>{batchResults.total_rows}</strong>
              </div>

              <div className="summary-card">
                <span>Predicted Churn</span>
                <strong>{churnedCustomers}</strong>
              </div>

              <div className="summary-card">
                <span>Predicted No Churn</span>
                <strong>{nonChurnedCustomers}</strong>
              </div>

              <div className="summary-card">
                <span>Average Churn Probability</span>
                <strong>
                  {(averageChurnProbability * 100).toFixed(2)}%
                </strong>
              </div>

            </div>

            <div className="table-container">

              <table>

                <thead>
                  <tr>
                    <th>Row</th>
                    <th>Churn Probability</th>
                    <th>Prediction</th>
                  </tr>
                </thead>

                <tbody>

                  {batchResults.results.map((item) => (
                    <tr key={item.row}>

                      <td>{item.row}</td>

                      {item.error ? (
                        <>
                          <td colSpan="2" className="table-error">
                            {item.error}
                          </td>
                        </>
                      ) : (
                        <>
                          <td>
                            {(item.churn_probability * 100).toFixed(2)}%
                          </td>

                          <td>
                            <span
                              className={
                                item.churn_prediction === "Yes"
                                  ? "prediction-yes"
                                  : "prediction-no"
                              }
                            >
                              {item.churn_prediction}
                            </span>
                          </td>
                        </>
                      )}

                    </tr>
                  ))}

                </tbody>

              </table>

            </div>

          </section>
        )}

        <section className="history-section">

          <div className="section-header">
              <h2>Prediction History</h2>

              <button
                  onClick={handleFetchHistory}
                  disabled={historyLoading}
              >
                  {historyLoading ? "Loading..." : "Load History"}
              </button>
          </div>

          {historyError && (
              <p className="error-message">
                  {historyError}
              </p>
          )}

          {predictionHistory.length > 0 && (
              <div className="history-table-container">
                  <table>
                      <thead>
                          <tr>
                              <th>ID</th>
                              <th>Churn Probability</th>
                              <th>Prediction</th>
                              <th>Date</th>
                          </tr>
                      </thead>

                      <tbody>
                          {predictionHistory.map((prediction) => (
                              <tr key={prediction.id}>
                                  <td>{prediction.id}</td>

                                  <td>
                                      {(prediction.churn_probability * 100).toFixed(2)}%
                                  </td>

                                  <td>
                                      {prediction.churn_prediction}
                                  </td>

                                  <td>
                                      {new Date(
                                          prediction.created_at
                                      ).toLocaleString()}
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          )}

          {!historyLoading &&
              predictionHistory.length === 0 &&
              !historyError && (
                  <p>No prediction history loaded.</p>
              )}

      </section>

      </div>
    </div>
  );
}

export default App;
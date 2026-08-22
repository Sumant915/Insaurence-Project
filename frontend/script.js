const API_BASE_URL = "https://insaurence-project.onrender.com";
// =========================================================
// ELEMENTS
// =========================================================

const singleTab = document.getElementById("single-tab");
const bulkTab = document.getElementById("bulk-tab");

const singlePanel = document.getElementById("single-panel");
const bulkPanel = document.getElementById("bulk-panel");

const predictionForm = document.getElementById("prediction-form");
const bulkForm = document.getElementById("bulk-form");

const singleError = document.getElementById("single-error");
const bulkError = document.getElementById("bulk-error");
const bulkSuccess = document.getElementById("bulk-success");

const bulkFile = document.getElementById("bulk-file");
const fileLabel = document.getElementById("file-label");

const results = document.getElementById("results");

const renewalProbability =
  document.getElementById("renewal-probability");

const probabilityBar =
  document.getElementById("probability-bar");

const baselineRevenue =
  document.getElementById("baseline-revenue");

const optimalIncentive =
  document.getElementById("optimal-incentive");

const bestExpectedRevenue =
  document.getElementById("best-expected-revenue");

const maxNetRevenue =
  document.getElementById("max-net-revenue");


// =========================================================
// TAB SWITCHING
// =========================================================

function showSingleMode() {
  singleTab.classList.add("active");
  bulkTab.classList.remove("active");

  singleTab.setAttribute("aria-selected", "true");
  bulkTab.setAttribute("aria-selected", "false");

  singlePanel.hidden = false;
  bulkPanel.hidden = true;

  clearMessages();
}

function showBulkMode() {
  bulkTab.classList.add("active");
  singleTab.classList.remove("active");

  bulkTab.setAttribute("aria-selected", "true");
  singleTab.setAttribute("aria-selected", "false");

  bulkPanel.hidden = false;
  singlePanel.hidden = true;

  clearMessages();
}

singleTab.addEventListener("click", showSingleMode);
bulkTab.addEventListener("click", showBulkMode);


// =========================================================
// HELPER FUNCTIONS
// =========================================================

function clearMessages() {
  singleError.hidden = true;
  singleError.textContent = "";

  bulkError.hidden = true;
  bulkError.textContent = "";

  bulkSuccess.hidden = true;
  bulkSuccess.textContent = "";
}


function showSingleError(message) {
  singleError.textContent = message;
  singleError.hidden = false;
}


function showBulkError(message) {
  bulkError.textContent = message;
  bulkError.hidden = false;
}


function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2
  }).format(value);
}


function formatPercentage(value) {
  return `${(value * 100).toFixed(2)}%`;
}


// =========================================================
// DISPLAY SINGLE CUSTOMER RESULT
// =========================================================

function displayPrediction(data) {

  renewalProbability.textContent =
    formatPercentage(data.renewal_probability);

  baselineRevenue.textContent =
    formatCurrency(data.baseline_revenue);

  optimalIncentive.textContent =
    formatCurrency(data.optimal_incentive);

  bestExpectedRevenue.textContent =
    formatCurrency(data.best_expected_revenue);

  maxNetRevenue.textContent =
    formatCurrency(data.max_net_revenue);

  const probabilityPercent =
    Math.max(0, Math.min(100, data.renewal_probability * 100));

  probabilityBar.style.width = `${probabilityPercent}%`;

  results.hidden = false;

  results.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}


// =========================================================
// SINGLE CUSTOMER PREDICTION
// =========================================================

predictionForm.addEventListener("submit", async function (event) {

  event.preventDefault();

  clearMessages();

  const submitButton =
    predictionForm.querySelector(".primary-button");

  submitButton.disabled = true;

  const originalText = submitButton.querySelector("span");

  if (originalText) {
    originalText.textContent = "Generating prediction...";
  }

  try {

    const formData = new FormData(predictionForm);

    const data = {
      perc_premium_paid_by_cash_credit:
        Number(formData.get("perc_premium_paid_by_cash_credit")),

      age_in_days:
        Number(formData.get("age_in_days")),

      Income:
        Number(formData.get("Income")),

      Count_3_6_months_late:
        Number(formData.get("Count_3_6_months_late")),

      Count_6_12_months_late:
        Number(formData.get("Count_6_12_months_late")),

      Count_more_than_12_months_late:
        Number(formData.get("Count_more_than_12_months_late")),

      application_underwriting_score:
        Number(formData.get("application_underwriting_score")),

      no_of_premiums_paid:
        Number(formData.get("no_of_premiums_paid")),

      sourcing_channel:
        formData.get("sourcing_channel"),

      residence_area_type:
        formData.get("residence_area_type"),

      premium:
        Number(formData.get("premium"))
    };


    // Basic frontend validation

    if (
      data.perc_premium_paid_by_cash_credit < 0 ||
      data.perc_premium_paid_by_cash_credit > 1
    ) {
      throw new Error(
        "Premium paid by cash/credit must be between 0 and 1."
      );
    }


    if (
      data.application_underwriting_score < 0 ||
      data.application_underwriting_score > 1
    ) {
      throw new Error(
        "Application underwriting score must be between 0 and 1."
      );
    }


    // Send request to FastAPI

    const response = await fetch(
      `${API_BASE_URL}/predict`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      }
    );


    if (!response.ok) {

      let errorMessage =
        "Prediction request failed.";

      try {
        const errorData = await response.json();

        if (errorData.detail) {
          errorMessage = errorData.detail;
        }
      } catch {
        // Ignore JSON parsing error
      }

      throw new Error(errorMessage);
    }


    const result = await response.json();

    displayPrediction(result);

  } catch (error) {

    console.error("Prediction error:", error);

    if (
      error instanceof TypeError &&
      error.message.includes("fetch")
    ) {
      showSingleError(
        "Unable to connect to the prediction server. Make sure FastAPI is running on port 8000."
      );
    } else {
      showSingleError(error.message);
    }

  } finally {

    submitButton.disabled = false;

    if (originalText) {
      originalText.textContent = "Generate prediction";
    }
  }
});


// =========================================================
// FILE NAME DISPLAY
// =========================================================

bulkFile.addEventListener("change", function () {

  if (bulkFile.files.length === 0) {

    fileLabel.textContent =
      "Choose a file to upload";

    return;
  }

  const file = bulkFile.files[0];

  fileLabel.textContent = file.name;
});


// =========================================================
// BULK FILE PREDICTION
// =========================================================

bulkForm.addEventListener("submit", async function (event) {

  event.preventDefault();

  clearMessages();

  if (!bulkFile.files.length) {

    showBulkError(
      "Please select a CSV or Excel file."
    );

    return;
  }


  const file = bulkFile.files[0];

  const allowedExtensions = [
    ".csv",
    ".xlsx"
  ];

  const fileName =
    file.name.toLowerCase();

  const isValidFile =
    allowedExtensions.some(
      extension => fileName.endsWith(extension)
    );


  if (!isValidFile) {

    showBulkError(
      "Please upload a CSV or XLSX file."
    );

    return;
  }


  const submitButton =
    bulkForm.querySelector(".primary-button");

  submitButton.disabled = true;

  const buttonText =
    submitButton.querySelector("span");

  if (buttonText) {
    buttonText.textContent =
      "Processing file...";
  }


  try {

    const formData = new FormData();

    formData.append("file", file);


    const response = await fetch(
      `${API_BASE_URL}/predict-file`,
      {
        method: "POST",
        body: formData
      }
    );


    if (!response.ok) {

      let errorMessage =
        "Unable to process the uploaded file.";

      try {

        const errorData =
          await response.json();

        if (errorData.detail) {
          errorMessage = errorData.detail;
        }

      } catch {
        // Ignore JSON parsing error
      }

      throw new Error(errorMessage);
    }


    // Convert API response into downloadable Excel file

    const blob =
      await response.blob();


    const downloadUrl =
      window.URL.createObjectURL(blob);


    const link =
      document.createElement("a");

    link.href = downloadUrl;

    link.download =
      "bulk_predictions.xlsx";

    document.body.appendChild(link);

    link.click();

    link.remove();

    window.URL.revokeObjectURL(downloadUrl);


    bulkSuccess.textContent =
      "Predictions generated successfully. Your Excel file has been downloaded.";

    bulkSuccess.hidden = false;


  } catch (error) {

    console.error(
      "Bulk prediction error:",
      error
    );

    if (
      error instanceof TypeError &&
      error.message.includes("fetch")
    ) {

      showBulkError(
        "Unable to connect to the prediction server. Make sure FastAPI is running on port 8000."
      );

    } else {

      showBulkError(
        error.message
      );
    }

  } finally {

    submitButton.disabled = false;

    if (buttonText) {
      buttonText.textContent =
        "Generate bulk predictions";
    }
  }
});
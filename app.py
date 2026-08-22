from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse
from io import BytesIO
import joblib
import pandas as pd
import numpy as np
from pydantic import BaseModel

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5500"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model_pipeline = joblib.load("model_pipeline.pkl")
imputer = joblib.load("imputer.pkl")

def agent_effort(I):
    return 10*(1-(np.exp(-I/400)))

def prob_after_agent(I):
    E = agent_effort(I)
    return 0.20*(1-(np.exp(-E/5)))

def optimal_incentive(p,premium):
    baseline_revenue=p*premium
    max_net_revenue=p*premium
    optimal_incentive=0
    best_expected_revenue = baseline_revenue
    for I in range(500,2500,500):
        effort = agent_effort(I)
        uplift = prob_after_agent(I)
        final_prob = p + uplift
        expected_revenue=final_prob*premium
        expected_net_revenue=expected_revenue-I
        if(final_prob<=1 and max_net_revenue<expected_net_revenue):
            max_net_revenue=expected_net_revenue
            best_expected_revenue=expected_revenue
            optimal_incentive=I
    return [ baseline_revenue,max_net_revenue,best_expected_revenue,optimal_incentive]

class CustomerData(BaseModel):
    perc_premium_paid_by_cash_credit: float
    age_in_days: int
    Income: float

    Count_3_6_months_late: int
    Count_6_12_months_late: int
    Count_more_than_12_months_late: int

    application_underwriting_score: float
    no_of_premiums_paid: int

    sourcing_channel: str
    residence_area_type: str
    premium: float


@app.get("/")
def home():
    return {
        "message": "Insurance Renewal Prediction API is running"
    }


@app.post("/predict")
def predict(data: CustomerData):

    # Convert input to dictionary
    input_data = data.model_dump()

    # Create DataFrame
    df = pd.DataFrame([input_data])

    # Rename API columns to original training column names
    df.rename(columns={
        "Count_3_6_months_late": "Count_3-6_months_late",
        "Count_6_12_months_late": "Count_6-12_months_late",
        "Count_more_than_12_months_late": "Count_more_than_12_months_late"
    }, inplace=True)

    # Columns used by imputer
    imputer_cols = [
        "perc_premium_paid_by_cash_credit",
        "age_in_days",
        "Income",
        "Count_3-6_months_late",
        "Count_6-12_months_late",
        "Count_more_than_12_months_late",
        "application_underwriting_score",
        "no_of_premiums_paid",
        "premium"
    ]

    # Apply imputer
    df[imputer_cols] = imputer.transform(
        df[imputer_cols]
    )

    # Create Count_late
    df["Count_late"] = (
        df["Count_3-6_months_late"]
        + df["Count_6-12_months_late"]
        + df["Count_more_than_12_months_late"]
    )

    # Remove original late-payment columns
    df.drop(
        columns=[
            "Count_3-6_months_late",
            "Count_6-12_months_late",
            "Count_more_than_12_months_late"
        ],
        inplace=True
    )
    
    probability = model_pipeline.predict_proba(df)[0][1]

    # Optimal incentive calculation
    baseline_revenue, max_net_revenue, best_expected_revenue, optimal_incentive_value = optimal_incentive(
        probability,
        data.premium
    )

    return {
    "renewal_probability": float(probability),
    "baseline_revenue": float(baseline_revenue),
    "max_net_revenue": float(max_net_revenue),
    "best_expected_revenue": float(best_expected_revenue),
    "optimal_incentive": int(optimal_incentive_value)
    }


@app.post("/predict-file")
async def predict_file(file: UploadFile = File(...)):

    # ---------------------------------------------------------
    # 1. Validate file type
    # ---------------------------------------------------------

    filename = file.filename or ""

    file_extension = (
        filename.lower().rsplit(".", 1)[-1]
        if "." in filename
        else ""
    )

    if file_extension not in {"xlsx", "csv"}:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file type. Please upload an .xlsx or .csv file."
        )


    # ---------------------------------------------------------
    # 2. Read uploaded file
    # ---------------------------------------------------------

    file_contents = await file.read()

    try:

        if file_extension == "xlsx":
            df = pd.read_excel(
                BytesIO(file_contents)
            )

        else:
            df = pd.read_csv(
                BytesIO(file_contents)
            )

    except Exception as exc:

        raise HTTPException(
            status_code=400,
            detail=f"Could not read the uploaded file: {exc}"
        )


    # ---------------------------------------------------------
    # 3. Required columns
    # ---------------------------------------------------------

    required_columns = [
        "perc_premium_paid_by_cash_credit",
        "age_in_days",
        "Income",
        "Count_3-6_months_late",
        "Count_6-12_months_late",
        "Count_more_than_12_months_late",
        "application_underwriting_score",
        "no_of_premiums_paid",
        "sourcing_channel",
        "residence_area_type",
        "premium"
    ]


    # ---------------------------------------------------------
    # 4. Check missing columns
    # ---------------------------------------------------------

    missing_columns = [
        column
        for column in required_columns
        if column not in df.columns
    ]

    if missing_columns:

        raise HTTPException(
            status_code=400,
            detail=(
                "Missing required columns: "
                + ", ".join(missing_columns)
            )
        )


    # ---------------------------------------------------------
    # 5. Columns used by the fitted imputer
    # ---------------------------------------------------------

    imputer_cols = [
        "perc_premium_paid_by_cash_credit",
        "age_in_days",
        "Income",
        "Count_3-6_months_late",
        "Count_6-12_months_late",
        "Count_more_than_12_months_late",
        "application_underwriting_score",
        "no_of_premiums_paid",
        "premium"
    ]


    # ---------------------------------------------------------
    # 6. Create model input
    #    ID is preserved in original df but NOT sent to model
    # ---------------------------------------------------------

    prediction_df = df.drop(
        columns=["id"],
        errors="ignore"
    ).copy()


    # ---------------------------------------------------------
    # 7. Apply fitted imputer
    # ---------------------------------------------------------

    prediction_df[imputer_cols] = imputer.transform(
        prediction_df[imputer_cols]
    )


    # ---------------------------------------------------------
    # 8. Create Count_late
    # ---------------------------------------------------------

    prediction_df["Count_late"] = (
        prediction_df["Count_3-6_months_late"]
        + prediction_df["Count_6-12_months_late"]
        + prediction_df["Count_more_than_12_months_late"]
    )


    # ---------------------------------------------------------
    # 9. Remove original late-payment columns
    # ---------------------------------------------------------

    prediction_df.drop(
        columns=[
            "Count_3-6_months_late",
            "Count_6-12_months_late",
            "Count_more_than_12_months_late"
        ],
        inplace=True
    )


    # ---------------------------------------------------------
    # 10. Predict renewal probability
    # ---------------------------------------------------------

    probabilities = model_pipeline.predict_proba(
        prediction_df
    )[:, 1]


    # ---------------------------------------------------------
    # 11. Calculate incentive/revenue for every customer
    # ---------------------------------------------------------

    incentive_results = [
        optimal_incentive(
            probability,
            premium
        )
        for probability, premium
        in zip(
            probabilities,
            df["premium"]
        )
    ]


    # ---------------------------------------------------------
    # 12. Add results to original dataframe
    # ---------------------------------------------------------

    df["renewal_probability"] = probabilities

    df["baseline_revenue"] = [
        result[0]
        for result in incentive_results
    ]

    df["max_net_revenue"] = [
        result[1]
        for result in incentive_results
    ]

    df["best_expected_revenue"] = [
        result[2]
        for result in incentive_results
    ]

    df["optimal_incentive"] = [
        result[3]
        for result in incentive_results
    ]


    # ---------------------------------------------------------
    # 13. Create output Excel file
    # ---------------------------------------------------------

    output = BytesIO()

    with pd.ExcelWriter(
        output,
        engine="openpyxl"
    ) as writer:

        df.to_excel(
            writer,
            index=False
        )


    output.seek(0)


    # ---------------------------------------------------------
    # 14. Return downloadable Excel file
    # ---------------------------------------------------------

    return StreamingResponse(
        output,
        media_type=(
            "application/vnd.openxmlformats-officedocument."
            "spreadsheetml.sheet"
        ),
        headers={
            "Content-Disposition":
                "attachment; filename=bulk_predictions.xlsx"
        }
    )
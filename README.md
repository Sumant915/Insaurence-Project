# 🚗 Insurance Renewal Prediction System

A Machine Learning web application that predicts whether a customer is likely to **renew their insurance policy** based on customer and policy-related information.

The project demonstrates an end-to-end Machine Learning workflow — from **data preprocessing and exploratory data analysis to model training, prediction, and deployment**.

## 🌐 Live Demo

👉 https://insaurence-project-1.onrender.com/

## 📂 GitHub Repository

👉 https://github.com/Sumant915/Insaurence-Project

---

## 📌 Project Overview

Insurance companies need to understand which customers are likely to renew their policies. Predicting renewal behavior can help businesses identify customers who may require additional engagement and improve customer retention strategies.

This project uses historical insurance/customer data to train a Machine Learning model that predicts the renewal outcome for a given customer.

The application supports:

* Individual customer predictions
* Bulk predictions using uploaded datasets
* Machine Learning-based renewal classification
* A simple web interface for interacting with the model

---

## 🔄 Machine Learning Workflow

```text
Raw Dataset
     ↓
Data Cleaning
     ↓
Exploratory Data Analysis
     ↓
Feature Engineering
     ↓
Data Preprocessing
     ↓
Model Training
     ↓
Model Evaluation
     ↓
Prediction
     ↓
Flask Web Application
     ↓
Deployment on Render
```

---

## ✨ Features

### 👤 Individual Prediction

Enter customer and policy-related information through the web interface to get a renewal prediction.

### 📊 Bulk Prediction

Upload a dataset containing multiple customer records and generate predictions for all records.

### 🤖 Machine Learning Model

The application uses a trained Machine Learning classification model to predict insurance renewal behavior.

### 🌐 Web Deployment

The trained model is integrated with a Flask application and deployed online using Render.

---

## 🛠️ Tech Stack

### Programming Language

* Python

### Data Science & Machine Learning

* Pandas
* NumPy
* Scikit-learn

### Data Visualization

* Matplotlib
* Seaborn

### Web Application

* Flask
* HTML
* CSS

### Deployment

* Render

### Development Tools

* Jupyter Notebook
* Git
* GitHub

---

## 📁 Project Structure

```text
Insaurence-Project/
│
├── app.py
├── model/
│   └── trained_model.pkl
│
├── templates/
│   └── index.html
│
├── static/
│   └── ...
│
├── dataset/
│   └── ...
│
├── notebooks/
│   └── ...
│
├── requirements.txt
├── README.md
└── Procfile
```

> The exact structure may vary depending on the current version of the project.

---

## 🚀 Running the Project Locally

### 1. Clone the repository

```bash
git clone https://github.com/Sumant915/Insaurence-Project.git
```

### 2. Navigate to the project directory

```bash
cd Insaurence-Project
```

### 3. Create a virtual environment

```bash
python -m venv venv
```

Activate it:

**Windows**

```bash
venv\Scripts\activate
```

**Linux / macOS**

```bash
source venv/bin/activate
```

### 4. Install dependencies

```bash
pip install -r requirements.txt
```

### 5. Run the Flask application

```bash
python app.py
```

### 6. Open the application

```text
http://127.0.0.1:5000/
```

---

## 📊 Prediction

The model takes relevant customer and insurance policy features as input and produces a prediction indicating whether the customer is likely to renew their policy.

For bulk prediction, users can upload a dataset and obtain predictions for multiple customers.

---

## 🎯 Learning Outcomes

Through this project, I gained practical experience in:

* Data preprocessing
* Exploratory Data Analysis
* Feature engineering
* Classification problems
* Machine Learning model training
* Model evaluation
* Model serialization
* Flask integration
* Handling user input
* Bulk prediction pipelines
* Deploying Machine Learning applications

---

## 🔮 Future Improvements

Some potential improvements for the project include:

* Adding more Machine Learning models and comparing their performance
* Hyperparameter optimization
* Improving the UI/UX
* Adding prediction probability/confidence scores
* Adding interactive analytics dashboards
* Implementing model monitoring
* Improving bulk prediction reporting

---

## 👨‍💻 Author

**Sumantra Singh**

GitHub: https://github.com/Sumant915

---

## ⭐ If you found this project useful

Feel free to explore the repository, try the live demo, and give the project a ⭐ on GitHub!

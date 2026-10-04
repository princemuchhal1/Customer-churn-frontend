# Telco Customer Churn — Frontend

React frontend for the Telco Customer Churn prediction application.

The frontend provides a web interface for making individual and batch churn predictions through the FastAPI backend.

## Live Application

**https://customer-churn-frontend-qtem.onrender.com/**

Backend API:

**https://churn-api-ka1q.onrender.com/docs**

Backend Repository:

https://github.com/princemuchhal1/Customer-churn

## Tech Stack

- React
- JavaScript
- Vite
- CSS
- Fetch API
- Docker
- Render

## Features

### Single Prediction

Users can enter customer information and receive:

- Churn probability
- Churn prediction

### Batch Prediction

Upload customer data as:

- CSV
- JSON

The application displays:

- Total customers
- Predicted churn
- Predicted no churn
- Average churn probability
- Individual prediction results

### Result Download

Batch predictions can be downloaded as a CSV file.

### Prediction History

The frontend can retrieve prediction history stored in PostgreSQL through the backend API.

## Application Flow

```text
User
 ↓
React Form
 ↓
FastAPI /predict
 ↓
ML Model
 ↓
Prediction
 ↓
PostgreSQL
 ↓
Prediction History

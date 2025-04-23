# FNTX.ai v2

A centralized, ChatGPT-like interface for systematic options selling.

## Repository Structure

This repository contains both frontend and backend code for FNTX.ai v2:

- `/frontend` - React/TypeScript application with ChatGPT-like interface
- `/backend` - Django application with IBKR API integration and OAuth support
- `/oauth-files` - OAuth configuration files for IBKR integration

## Features

- Text-driven conversation interface for options trading
- OAuth integration with IBKR for fast data streaming
- Real-time options data visualization
- Interactive stock charts
- Systematic options selling guidance

## Getting Started

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

## OAuth Integration

This version implements OAuth authentication with IBKR for improved performance and real-time data streaming. The OAuth implementation uses the encryption and signature keys provided in the `/oauth-files` directory.

## Deployment

The application can be deployed to any hosting service that supports React and Django applications. Domain configuration for www.fntx.ai will need to be updated to point to the new hosting service.

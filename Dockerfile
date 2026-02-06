FROM python:3.11-slim

WORKDIR /app

# Copy backend as a package
COPY backend/ backend/

# Install dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Expose port (optional but nice)
EXPOSE 8000

# Run FastAPI as a package
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]

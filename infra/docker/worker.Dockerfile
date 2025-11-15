FROM python:3.11-slim

# Install system dependencies for GPU support and 3D processing
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Default to FastAPI server (for health checks)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

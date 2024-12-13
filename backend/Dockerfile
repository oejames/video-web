FROM python:3.9-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    python3-pip \
    nodejs \
    npm

# Set working directory
WORKDIR /app

# Copy backend files
COPY package*.json ./
RUN npm install

# Install Python dependencies
COPY requirements.txt ./
RUN pip install -r requirements.txt

# Copy rest of the backend code
COPY . .

# Expose port
EXPOSE 5000

# Start command
CMD ["npm", "start"]
# Getting Started

## Prerequisites

- Node.js (latest) - [https://nodejs.org/](https://nodejs.org/)
- .NET SDK (latest) - [https://dotnet.microsoft.com/download](https://dotnet.microsoft.com/download)
- Docker & Docker Compose (latest) - [https://www.docker.com/get-started](https://www.docker.com/get-started)

## Quick Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/airamez/Apyvyra.git
   cd Apyvyra
   ```

2. **Install dependencies**
   ```bash
   # Frontend
   cd frontend
   npm install
   cd ..

   # Backend dependencies are restored automatically
   ```

3. **Setup database**
   ```bash
   # Start the database container
   docker-compose up -d db

   # Initialize database schema
   cd devops
   dotnet run -- db-init

   # Load demo data
   dotnet run -- db-load-test-data
   cd ..
   ```

4. **Run the application**
   ```bash
   cd Apyvyra
   # Start all services with Docker
   docker-compose up

   # Or run manually (see below)
   ```

## Manual Setup

For development, you can run services individually:

- **Database**: 
  ```bash
  cd Apyvyra
  docker-compose up -d db
  ```
- **Backend**:
  ```bash
  #go to backend folder
  dotnet run
  ```
  >Note: (Backend at http://localhost:5000)
- **Frontend**:
  ```bash
  #go to Frontend folder
  npm run dev
  ```
  >Note: (Frontend at http://localhost:80)

See individual project READMEs for detailed setup instructions.

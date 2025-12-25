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

  # Initialize database schema
  cd devops
  dotnet run -- db-init

  # Load demo data
  dotnet run -- db-load-test-data
  cd ..
  ```
- **Backend**:
  ```bash
  # Navigate to backend folder
  dotnet run

  # use this for devopment, so the changes are applied on the fly
  dotnet run watch
  ```
  >Note: (Backend at http://localhost:5000)
- **Frontend**:
  ```bash
  # Navigate to Frontend folder
  sudo npm run dev
  ```
  >Note: (Frontend at http://localhost:80). The `sudo` is required becase of the pot 80

## Documentation
- [Main README](README.md)
- [DevOps](devops/README.md)
- [Backend README](backend/README.md)
- [Frontend README](frontend/README.md)
- [Architecture](ARCHITECTURE.md)
- [Coding Guidelines](CODING_GUIDELINES.md)
- [Paging vs Filtering](PAGING_VS_FILTERING.md)

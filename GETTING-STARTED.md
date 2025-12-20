# Getting Started

## 1. Clone the Repository

```bash
git clone https://github.com/airamez/Apyvyra.git
cd Apyvyra
```

## 2. Install Required Tools and Packages

Before running the project, ensure you have the following installed:

### Prerequisites

* **Node.js** (v18 or later): (https://nodejs.org/)
* **.NET SDK** (v10.0): (https://dotnet.microsoft.com/download)
* **Docker** and **Docker Compose**: (https://www.docker.com/)

### Verify Installations

Check that all prerequisites are correctly installed:

```bash
# Check Node.js version
node --version

# Check npm version
npm --version

# Check .NET SDK version
dotnet --version

# Check Docker version
docker --version

# Check Docker Compose version
docker-compose --version
```

### Recommended VS Code Extensions

To enhance your development experience, install these VS Code extensions:

* **Docker** (`ms-azuretools.vscode-docker`): Manage containers, images, and Docker Compose directly from VS Code
* **PostgreSQL** (`ms-ossdata.vscode-pgsql`): Connect to PostgreSQL databases, run queries, and manage database objects

You can install them by searching in the Extensions view (Ctrl+Shift+X) or by running:

```bash
code --install-extension ms-azuretools.vscode-docker
code --install-extension ms-ossdata.vscode-pgsql
```

### Install Frontend Dependencies

```bash
cd frontend
npm install
cd ..
```

### Install Backend Dependencies

The .NET dependencies are automatically restored when you run the project, but you can manually restore them:

```bash
cd backend
dotnet restore
cd ..
```

## 3. Database Setup

The project includes a DevOps console tool for automated database operations. See [devops/README.md](devops/README.md) for detailed instructions on using the `db-init` command to initialize or re-create the database with the proper schema.

## 4. Running the Project Manually

### Step 1: Start the Database Container

```bash
docker-compose up -d db
```

This starts only the PostgreSQL database container in detached mode.

### Step 2: Start the Backend

* Open a new terminal and run:

  ```bash
  cd backend
  dotnet run
  
  # Using the `watch` argument allow the changes to be applied instantly, ideal for development
  dotnet watch run
  ```

* The backend API will be available at `http://localhost:5000` (or the port specified in [launchSettings.json](backend/Properties/launchSettings.json)).

### Step 3: Start the Frontend

* Open another terminal and run:

  ```bash
  cd frontend
  sudo npm run dev
  ```

* The frontend will be available at `http://localhost:80` (or the port specified in [vite.config.ts](frontend/vite.config.ts)).
>Note: The sudo is necessary if the port is 80

## 5. Running the Project with Docker

* To run the entire application stack (database, backend, and frontend) using Docker:

  ```bash
  docker-compose up
  ```

* This will build and start all services defined in [docker-compose.yml](docker-compose.yml).

* To run in detached mode:

  ```bash
  docker-compose up -d
  ```

* To stop all services:

  ```bash
  docker-compose down
  ```

* To rebuild the containers (useful after code changes):

  ```bash
  docker-compose up --build
  ```

>Note: Make sure the fronend and backend projects are not running in the terminal

## 6. Generate Entity Framework Code from SQL Database

If you need to scaffold Entity Framework Core models and DbContext from the existing SQL database, use the following command (replace connection string and provider as needed). **This command must be executed from the `backend` directory:**

```bash
# Regenerate EF Core models and context from the current database schema (run from the backend directory):
dotnet ef dbcontext scaffold "Host=localhost;Port=5432;Database=apyvyra;Username=apyvyra;Password=apyvyra" Npgsql.EntityFrameworkCore.PostgreSQL --output-dir Models --context-dir Data --context AppDbContext --force
```

- This command uses the connection string from `backend/appsettings.json` (update if your DB settings differ).
- The provider is PostgreSQL (Npgsql). For other DBs, use the appropriate provider.
- Models will be placed in the `Models` directory, and the context in the `Data` directory.
- The `--force` flag will overwrite existing files in the output directories.
- You must have the `dotnet-ef` tool installed (`dotnet tool install --global dotnet-ef`).

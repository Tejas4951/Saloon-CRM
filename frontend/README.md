# Salon Management System

A modern, full-stack salon management application built with React, TypeScript, Express, and MySQL. This application provides a complete solution for managing salon appointments, customers, services, and staff.

## Features

- **User Authentication** - Secure login and registration with JWT
- **Appointment Management** - Schedule and manage client appointments
- **Customer Management** - Maintain customer records and history
- **Staff Management** - Manage staff schedules and services
- **Service Catalog** - Organize and manage salon services
- **Real-time Updates** - Live updates for appointments and schedules
- **Responsive Design** - Works on desktop and mobile devices

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Shadcn/ui
- **Backend**: Node.js, Express, TypeScript
- **Database**: MySQL
- **Authentication**: JWT (JSON Web Tokens)
- **State Management**: React Query
- **Form Handling**: React Hook Form with Zod validation
- **UI Components**: Radix UI Primitives with Shadcn/ui

## Prerequisites

- Node.js 18+ and npm 9+
- MySQL 8.0+
- Git

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd project-with-MySQL-Database-spring-boot-backend
```

### 2. Set Up Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
2. Update the `.env` file with your configuration:
   ```env
   # Server
   PORT=3001
   NODE_ENV=development
   
   # JWT
   JWT_SECRET=your_secure_jwt_secret
   JWT_EXPIRES_IN=7d
   
   # Database
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=salon_management
   DB_USER=your_mysql_username
   DB_PASSWORD=your_mysql_password
   
   # File Uploads
   UPLOAD_DIR=./public/uploads
   MAX_FILE_SIZE=5242880 # 5MB in bytes
   
   # CORS
   FRONTEND_URL=http://localhost:5173
   ```

### 3. Set Up the Database

1. Log in to MySQL:
   ```bash
   mysql -u root -p
   ```

2. Create a new database and user:
   ```sql
   CREATE DATABASE salon_management;
   CREATE USER 'salon_user'@'localhost' IDENTIFIED BY 'your_secure_password';
   GRANT ALL PRIVILEGES ON salon_management.* TO 'salon_user'@'localhost';
   FLUSH PRIVILEGES;
   ```

### 4. Install Dependencies

```bash
# Install server dependencies
npm install

# Install client dependencies
cd client
npm install
cd ..
```

### 5. Run Migrations (if any)

```bash
# Run database migrations (if applicable)
npm run migrate
```

### 6. Start the Application

#### Development Mode

In one terminal, start the backend:
```bash
npm run dev:server
```

In another terminal, start the frontend:
```bash
npm run dev:client
```

#### Production Mode

Build the application:
```bash
npm run build
```

Start the production server:
```bash
npm start
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## Project Structure

```
project-root/
├── client/                 # Frontend React application
│   ├── public/             # Static files
│   └── src/                # Source files
│       ├── components/     # Reusable UI components
│       ├── contexts/       # React contexts
│       ├── hooks/          # Custom React hooks
│       ├── lib/            # Utility functions
│       ├── pages/          # Page components
│       ├── styles/         # Global styles
│       └── types/          # TypeScript type definitions
├── server/                 # Backend Express application
│   ├── config/             # Configuration files
│   ├── controllers/        # Route controllers
│   ├── middleware/         # Express middleware
│   ├── models/             # Database models
│   ├── routes/             # API routes
│   ├── services/           # Business logic
│   └── utils/              # Utility functions
├── .env.example           # Example environment variables
├── package.json           # Project dependencies and scripts
└── README.md              # Project documentation
```

## API Documentation

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Log in a user
- `GET /api/auth/me` - Get current user information

### Appointments

- `GET /api/appointments` - Get all appointments
- `POST /api/appointments` - Create a new appointment
- `GET /api/appointments/:id` - Get a specific appointment
- `PUT /api/appointments/:id` - Update an appointment
- `DELETE /api/appointments/:id` - Delete an appointment

### Customers

- `GET /api/customers` - Get all customers
- `POST /api/customers` - Create a new customer
- `GET /api/customers/:id` - Get a specific customer
- `PUT /api/customers/:id` - Update a customer
- `DELETE /api/customers/:id` - Delete a customer

### Services

- `GET /api/services` - Get all services
- `POST /api/services` - Create a new service
- `GET /api/services/:id` - Get a specific service
- `PUT /api/services/:id` - Update a service
- `DELETE /api/services/:id` - Delete a service

## Contributing

1. Fork the repository
2. Create a new branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

Distributed under the MIT License. See `LICENSE` for more information.

## Contact

Your Name - [@your_twitter](https://twitter.com/your_username) - your.email@example.com

Project Link: [https://github.com/yourusername/salon-management-system](https://github.com/yourusername/salon-management-system)

## Project info

**URL**: https://lovable.dev/projects/42164a50-a27e-4bef-ad78-581bebd4b634

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/42164a50-a27e-4bef-ad78-581bebd4b634) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/42164a50-a27e-4bef-ad78-581bebd4b634) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

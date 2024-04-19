# Campaign Management Application

Welcome to the Campaign Management Application! This application allows users to create fundraising campaigns, donate to existing campaigns, and view campaign details.

## Features

- **Create Campaigns**: Users can create new fundraising campaigns by providing a title, description, target amount, and an optional photo.
- **Donate to Campaigns**: Users can donate to existing campaigns by specifying the amount they wish to donate.
- **View Campaign Details**: Users can view details of all campaigns, including title, description, target amount, creator details, and current status.
- **User Authentication**: User authentication is implemented to ensure that only authenticated users can create campaigns and donate.
- **User Registration**: New users can register for an account by providing their email, password, XRP wallet address, and wallet secret.
- **Session Management**: Express-session is used for managing user sessions.
- **File Upload**: Multer is used for handling file uploads, allowing users to upload campaign photos.
- **XRPL Integration**: The application integrates with the XRP Ledger for handling XRP transactions.

## Technologies Used

- **Node.js**: The application backend is built using Node.js, a JavaScript runtime.
- **Express.js**: Express.js is used as the web framework for handling HTTP requests and routing.
- **MongoDB**: MongoDB is used as the database to store campaign and user data.
- **Mongoose**: Mongoose is used as an Object Data Modeling (ODM) library for MongoDB.
- **XRPL**: XRPL (XRP Ledger) is used for handling XRP transactions in the application.
- **Multer**: Multer is used for handling file uploads.
- **Bcrypt**: Bcrypt is used for hashing passwords and wallet secrets for security.
- **Session Management**: Express-session is used for managing user sessions.
- **Body-parser**: Body-parser is used for parsing request bodies.
- **Dotenv**: Dotenv is used for loading environment variables from a .env file.

## Setup Instructions

1. Clone the repository: `git clone <repository-url>`
2. Install dependencies: `npm install`
3. Set up environment variables:
   - Create a `.env` file in the root directory
   - Define environment variables such as MongoDB connection URI, XRPL server URL, session secret, etc.
4. Start the server: `npm start`
5. Access the application at `http://localhost:3000`

## API Endpoints

- `POST /register`: Register a new user account.
- `POST /login`: Log in to an existing user account.
- `POST /logout`: Log out the current user.
- `POST /create-campaign`: Create a new fundraising campaign.
- `POST /donate`: Donate to an existing campaign.
- `GET /campaigns/:campaignId/transactions`: Get all transactions for a specific campaign.
- `GET /mycampaigns`: Get all campaigns created by the current user.
- `GET /campaigns`: Get all campaigns.
- `GET /campaigns/:campaignId/raised`: Get the total amount raised for a specific campaign.
- `PUT /campaigns/:campaignId/mark-completed`: Mark a campaign as completed.
- `GET /completed-campaigns`: Get all completed campaigns.
- `GET /active-campaigns`: Get all active campaigns.
- `GET /wallet-balance`: Get the XRP wallet balance of the current user.

## Contributors

- [John Doe](https://github.com/johndoe)
- [Jane Smith](https://github.com/janesmith)

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Special thanks to the XRPL community for their valuable contributions.

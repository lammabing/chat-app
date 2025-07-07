# Real-Time Chat Application

This is a real-time chat application built with Node.js, Express, Socket.IO, and MongoDB. It supports user authentication, real-time messaging, file sharing (images and documents), user avatars, and emoji support.

## Features

- User Authentication (Login/Logout)
- Real-Time Messaging with Socket.IO
- Persistent Message History (MongoDB)
- File Sharing (Image and Document Uploads)
- Image Previews with Modal View
- User Avatars with Thumbnail Generation
- Emoji Picker and Shortcode Support
- Responsive User Interface
- Admin Feature: Export Chat History (JSON)

## Technology Stack

- **Backend:** Node.js, Express.js, Socket.IO, MongoDB, Mongoose, Multer, Sharp, bcryptjs, express-session, connect-mongo
- **Frontend:** HTML5, CSS3, JavaScript (ES6+), Socket.IO Client, emoji-picker-element
- **Deployment:** Docker, docker-compose

## Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository_url>
    cd chat-app
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    cd scripts
    npm install
    cd ..
    ```
3.  **Set up MongoDB:**
    Ensure you have MongoDB running. You can use the provided `docker-compose.yml` file:
    ```bash
    docker-compose up -d db
    ```
4.  **Configure environment variables:**
    Create a `config.js` file in the root directory based on `config.js.example` (if available) or define necessary environment variables for MongoDB connection and session secret.
5.  **Run the application:**
    ```bash
    npm start
    ```
    The application should be available at `http://localhost:3000`.

## Scripts

The `scripts/` directory contains utility scripts:

- `createBotUser.js`: Create an admin bot user.
- `export-collection.js`: Export a MongoDB collection to JSON.
- `generateUsers.js`: Generate test users.
- `delete-database.js`: Delete the MongoDB database.
- `list-collections.js`: List MongoDB collections.
- `mongodb-tree.cjs`: Display MongoDB collection structure.
- `resetChatData.js`: Reset chat messages.
- `show-schema.js`: Show Mongoose schema.
- `view-users.js`: View users in the database.

To run a script, navigate to the `scripts` directory and use `node <script_name>`. For example:
```bash
cd scripts
node createBotUser.js
```

## Usage

1.  Open your web browser and go to `http://localhost:3000`.
2.  Register a new user or log in with existing credentials.
3.  Start chatting in real-time.
4.  Use the file upload button to share images or documents (max 5MB).
5.  Click the emoji icon to open the emoji picker or type shortcodes like `:smile:`.
6.  Click on an image preview in the chat to view the full image in a modal.

## Project Roadmap

Refer to `documentation/projectRoadmap.md` for high-level goals and future enhancements.

## Codebase Summary

Refer to `documentation/codebaseSummary.md` for an overview of the project structure and key components.

## Technology Stack Details

Refer to `documentation/techStack.md` for detailed information on the technologies used and architectural decisions.

## Current Task

Refer to `documentation/currentTask.md` for current objectives and next steps.
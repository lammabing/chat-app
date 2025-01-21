# Codebase Summary

## Project Structure
```
/
├── models/                # MongoDB schemas
│   ├── User.js           # User model
│   └── Message.js        # Message model
├── public/               # Frontend assets
│   ├── index.html       # Main HTML file
│   ├── styles.css       # Stylesheet
│   └── script.js        # Frontend JavaScript
├── scripts/             # Utility scripts
│   └── generateUsers.js # Initial user generation
├── uploads/             # File upload directory
│   ├── avatars/        # User avatars
│   │   └── thumbnails/ # Avatar thumbnails
│   └── files/          # Uploaded files
├── cline_docs/          # Project documentation
├── server.js            # Main server file
├── package.json         # Project configuration
└── .logins             # Generated user credentials
```

## Key Components and Their Interactions

### Backend Components
1. **Express Server (server.js)**
   - MongoDB connection and configuration
   - HTTP request handling
   - Static file serving
   - File upload management with multer
   - Socket.IO configuration
   - Admin routes for exports

2. **Database Models**
   - User model with avatar support
   - Message model with file attachments
   - MongoDB session store

3. **Authentication System**
   - MongoDB-based user storage
   - Password hashing with bcrypt
   - Session management with connect-mongo
   - Avatar upload and processing

4. **WebSocket Handler**
   - Real-time message broadcasting
   - User presence management with avatars
   - File message handling with MongoDB

### Frontend Components
1. **User Interface (index.html)**
   - Login form
   - User profile with avatar
   - Chat interface
   - File upload interface
   - Emoji picker integration

2. **Client Logic (script.js)**
   - Socket.IO client setup
   - Message handling with avatars
   - File and avatar upload
   - Emoji processing
   - UI interactions

3. **Styling (styles.css)**
   - Responsive layout
   - Avatar styling
   - Message formatting
   - Modal implementations
   - UI components styling

## Data Flow
1. **Authentication Flow**
   - User submits credentials
   - MongoDB validates user
   - Password verified with bcrypt
   - Session stored in MongoDB
   - Socket connection established

2. **Message Flow**
   - User types message
   - Emoji conversion if needed
   - Socket emits message
   - Server saves to MongoDB
   - Message broadcast with avatar

3. **File Upload Flow**
   - User selects file
   - Multer processes upload
   - Server saves file info to MongoDB
   - Image thumbnails generated if needed
   - File message broadcast to users

4. **Avatar Management**
   - User uploads avatar
   - Sharp processes image
   - Thumbnail generated
   - Paths stored in MongoDB
   - User interface updated

## External Dependencies
- mongoose: MongoDB ODM
- socket.io: Real-time communication
- multer: File upload handling
- sharp: Image processing
- bcryptjs: Password hashing
- express-session: Session handling
- connect-mongo: MongoDB session store
- emoji-picker-element: Emoji selection UI

## Recent Changes
- MongoDB integration completed
- User avatar system implemented
- Session persistence added
- File organization improved
- Admin features implemented
- Documentation updated

## Current State
- Fully functional chat application
- Persistent data storage with MongoDB
- Organized file storage system
- Enhanced user profiles
- Real-time communication working
- Admin features available

## Development Guidelines
1. **Code Organization**
   - MongoDB schemas in models/
   - Utility scripts in scripts/
   - Clear separation of concerns
   - Consistent naming conventions

2. **File Management**
   - Organize uploads by type
   - Generate thumbnails for efficiency
   - 5MB upload limit
   - Support image previews

3. **Security Considerations**
   - Secure password storage
   - Session management
   - File validation
   - Admin access control
   - Input sanitization
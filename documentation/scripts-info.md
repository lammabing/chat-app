# Scripts Documentation

## Administration Scripts

### `createBotUser.js`
- **Purpose**: Creates a system bot user in the database
- **Usage**: `node createBotUser.js [--username NAME] [--email EMAIL]`
- **Dependencies**: Mongoose, dotenv
- **Output**: Creates user with bot:true flag

### `delete-database.js` ⚠️
- **Function**: Full database wipe (all collections)
- **Safety**: Requires confirmation prompt
- **Usage**: `node delete-database.js --confirm`

### `export-collection.js`
- **Purpose**: Export MongoDB collection to JSON
- **Parameters**: `--collection COLLECTION_NAME --out FILE.json`
- **Example**: `node export-collection.js --collection messages --out backup.json`

## User Management

### `generateUsers.js`
- **Function**: Bulk generate test users
- **Options**:
  - `--count NUMBER` (default: 10)
  - `--role [user|admin]`
- **Output**: Logs generated credentials

### `reset-admin-password.js`
- **Emergency utility**: Resets admin password
- **Usage**: `node reset-admin-password.js --email ADMIN_EMAIL`
- **Security**: Generates temporary password printed to console

### `update-avatar.js`
- **Function**: Update user avatar manually
- **Parameters**: `--user USERNAME --file IMAGE_PATH`
- **Process**: Generates thumbnails automatically

## Database Utilities

### `list-collections.js`
- **Info Tool**: Lists all collections + document counts
- **Usage**: `node list-collections.js`
- **Output**: Table format with stats

### `mongodb-tree.cjs`
- **Visualization**: Shows database schema relationships
- **Requirements**: MongoDB Compass-style schema analysis
- **Output**: ASCII tree of collections/fields

### `resetChatData.js`
- **Maintenance**: Clears chat history while preserving users
- **Scope**: Removes all messages and file attachments
- **Usage**: `node resetChatData.js --confirm`

### `show-schema.js`
- **Analysis**: Displays Mongoose schema definitions
- **Parameters**: `--model [User|Message]`
- **Output**: JSON schema structure

## System Scripts

### `view-users.js`
- **Monitoring**: Lists all users with key metrics
- **Options**:
  - `--sort [createdAt|lastLogin]`
  - `--role FILTER`
- **Output**: Paginated table view

---

**General Notes**:
- All scripts require MongoDB connection (configure in config.js)
- Admin scripts need `ADMIN_KEY` in .env
- Use `--help` with any script for usage details
- Scripts log to `./scripts/logs/` automatically
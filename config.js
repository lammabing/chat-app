export const config = {
    chatbot: {
        userId: "67c0a4ed0782ace1f884f75c",  // Bot's MongoDB User ID
        username: "ChatBot",
        endpoint: "http://localhost:3001",    // Chatbot server endpoint
        triggerPrefix: "@bot",                // Prefix to trigger bot responses
    },
    mongodb: {
        uri: "mongodb://localhost:27017",  // MongoDB connection URI
        dbName: "chat-app"                // MongoDB database name
    }
};

// To interact with the chatbot, the chatbot userId needs to be identical to the userId that exists in the users
// collection in the chat-app database. Use the command: node mongodb-tree.cjs to view the entries in the users
// collection.
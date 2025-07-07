export const config = {
    chatbot: {
        userId: "686425da0d48766744c4a507",  // Bot's MongoDB User ID
        username: "ChatBot",
        endpoint: "http://localhost:3210/chat",    // Chatbot server endpoint
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
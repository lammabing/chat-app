// const { MongoClient } = require('mongodb');
import { MongoClient } from 'mongodb';

async function deleteDatabase(dbName) {
  try {
    // Replace with your actual MongoDB connection string
    const uri = "mongodb://localhost:27017";

    const client = await MongoClient.connect(uri, { 
      useNewUrlParser: true, 
      useUnifiedTopology: true 
    });
    console.log("Connected to MongoDB");

    // Get a reference to the database
    const db = client.db(dbName);

    // Delete the database
    await db.dropDatabase();
    console.log(`Database '${dbName}' successfully deleted`);

    // Close the connection
    await client.close();
  } catch (error) {
    console.error("Error deleting database:", error);
  }
}

// Example usage:
deleteDatabase("chatapp");

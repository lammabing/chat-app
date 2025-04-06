import mongoose from 'mongoose';
import { User } from '../models/User.js';

async function showSchema() {
    try {
        // Connect to the database
        await mongoose.connect('mongodb://localhost:27017/your-database-name', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        // Retrieve the schema information for the User model
        const schema = User.schema.obj;

        // Log the schema to the console
        console.log(JSON.stringify(schema, null, 2));

        // Close the database connection
        await mongoose.connection.close();
    } catch (error) {
        console.error('Error showing schema:', error);
    }
}

showSchema();
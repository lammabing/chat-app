import { MongoClient } from 'mongodb';
import { config } from '../config.js';

async function listCollections() {
    const uri = config.mongodb.uri;
    const dbName = config.mongodb.dbName;

    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

    try {
        await client.connect();
        const db = client.db(dbName);
        const collections = await db.listCollections().toArray();
        console.log('Collections in the database:');
        collections.forEach(collection => {
            console.log(collection.name);
        });
    } catch (error) {
        console.error('Error connecting to the database:', error);
    } finally {
        await client.close();
    }
}

listCollections();
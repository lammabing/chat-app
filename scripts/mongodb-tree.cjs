const { MongoClient } = require('mongodb');

//host.docker.internal
async function listMongoDBTree(host = 'mongodb://127.0.0.1:27017', indent = '') {
    const client = new MongoClient(host);

    try {
        await client.connect();
        console.log(`${indent}📦 ${host}`); // Corrected template literal

        const adminDb = client.db('admin');
        const dbs = await adminDb.admin().listDatabases();

        for (const db of dbs.databases) {
            console.log(`${indent}├── 📁 ${db.name}`); // Corrected template literal
            const database = client.db(db.name);
            const collections = await database.listCollections().toArray();

            for (let i = 0; i < collections.length; i++) {
                const collection = collections[i];
                const isLastCollection = i === collections.length - 1;
                console.log(`${indent}│   ${isLastCollection ? '└── 📂' : '├── 📂'} ${collection.name}`); // Corrected

                const documents = await database.collection(collection.name).find().limit(5).toArray();
                for (let j = 0; j < documents.length; j++) {
                    const doc = documents[j];
                    const isLastDoc = j === documents.length - 1;
                    console.log(`${indent}│   ${isLastCollection ? '    ' : '│   '}${isLastDoc ? '└── 📄' : '├── 📄'} ${JSON.stringify(doc).substring(0, 50)}...`); // Corrected
                }

                if (documents.length === 20) {
                    console.log(`${indent}│   ${isLastCollection ? '    ' : '│   '}└── ... (more documents)`); // Corrected
                }
            }
        }
    } catch (err) {
        console.error('An error occurred:', err);
    } finally {
        await client.close();
    }
}

// Call the function (make sure your MongoDB instance is running!)
listMongoDBTree();

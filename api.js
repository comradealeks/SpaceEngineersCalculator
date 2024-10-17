const express = require('express');
const sql = require('mssql/msnodesqlv8');
const path = require('path');
const app = express();
const port = 3000;

// SQL configuration for Windows Authentication
const sqlConfigWinAuth = {
    server: 'ALEKSANDER-DESK\\SQLEXPRESS',
    database: 'SpaceEngineers',
    options: {
        trustedConnection: true,
        trustServerCertificate: true,
    },
    driver: 'msnodesqlv8',
};

// Function to connect to the database
async function connectToDatabase() {
    try {
        await sql.connect(sqlConfigWinAuth);
        console.log('Connected to database using Windows Authentication.');
    } catch (error) {
        console.error('Database connection error:', error);
    }
}

// Middleware to parse JSON request body
app.use(express.json());

// Serve static files (HTML, CSS, JS) from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Helper function to convert binary data (VARBINARY(MAX)) to base64
function convertIconToBase64(blocks) {
    return blocks.map(block => {
        if (block.Icon) {
            block.Icon = Buffer.from(block.Icon, 'binary').toString('base64');
        }
        return block;
    });
}

// API Route to fetch all distinct TypeIDs
app.get('/types', async (req, res) => {
    try {
        await connectToDatabase();
        const result = await sql.query`SELECT DISTINCT TypeID FROM BlockInfo`;
        res.json(result.recordset);
    } catch (error) {
        res.status(500).send('Error fetching types');
    }
});

// API Route to fetch all FileNames (categories)
app.get('/files', async (req, res) => {
    try {
        await connectToDatabase();
        const result = await sql.query`SELECT DISTINCT FileName FROM BlockInfo`;
        res.json(result.recordset);
    } catch (error) {
        res.status(500).send('Error fetching file names');
    }
});

// API Route to fetch all blocks or blocks by FileName
app.get('/blocks', async (req, res) => {
    const { filename, type } = req.query;
    try {
        await connectToDatabase();

        let query;
        const request = new sql.Request();

        if (type) {
            query = 'SELECT * FROM BlockInfo WHERE TypeID = @type';
            request.input('type', sql.NVarChar, type); // Bind the type parameter
        } else if (!filename || filename == 'all') {
            query = 'SELECT * FROM BlockInfo';
        } else {
            query = 'SELECT * FROM BlockInfo WHERE FileName = @filename';
            request.input('filename', sql.NVarChar, filename); // Bind the filename parameter
        }

        // Execute the query
        const result = await request.query(query);

        if (result.recordset.length === 0) {
            return res.status(404).send('No blocks found');
        }

        // Convert Icon binary data to base64
        const blocksWithBase64Icons = convertIconToBase64(result.recordset);
        res.json(blocksWithBase64Icons);
    } catch (error) {
        console.error('Error fetching blocks:', error);
        res.status(500).send('Error fetching blocks');
    }
});

// API Route to fetch block details by BlockID
app.get('/block/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await connectToDatabase();
        const result = await sql.query`SELECT * FROM BlockInfo WHERE BlockID = ${id}`;
        if (result.recordset.length === 0) {
            return res.status(404).send('Block not found');
        }

        // Convert Icon binary data to base64 for the single block
        const block = convertIconToBase64(result.recordset)[0];
        res.json(block);
    } catch (error) {
        res.status(500).send('Error fetching block details');
    }
});

// API Route to fetch block details by SubtypeID
app.get('/block/subtype/:subtypeId', async (req, res) => {
    const { subtypeId } = req.params;
    try {
        await connectToDatabase();
        const result = await sql.query`SELECT * FROM BlockInfo WHERE SubtypeID = ${subtypeId}`;
        if (result.recordset.length === 0) {
            return res.status(404).send('Block not found for the given SubtypeID');
        }

        // Convert Icon binary data to base64 for the single block
        const block = convertIconToBase64(result.recordset)[0];
        res.json(block);
    } catch (error) {
        console.error('Error fetching block details by SubtypeID:', error);
        res.status(500).send('Error fetching block details by SubtypeID');
    }
});

// API Route to fetch block components by BlockID
app.get('/block/:DisplayName/:Grid/components', async (req, res) => {
    const { DisplayName } = req.params;
    const { Grid } = req.params;
    try {
        await connectToDatabase();
        const result = await sql.query`
            SELECT ComponentName, Quantity 
            FROM ComponentList 
            WHERE DisplayName = ${DisplayName} 
            AND CubeSize IN (SELECT CubeSize FROM BlockInfo WHERE DisplayName = ${DisplayName} AND CubeSize = ${Grid})
        `;
        if (result.recordset.length === 0) {
            return res.status(404).send('No components found for this block');
        }
        res.json(result.recordset);
    } catch (error) {
        console.error('Error fetching block components:', error);
        res.status(500).send('Error fetching block components');
    }
});

// API Route to fetch component details by ComponentName
app.get('/component/:name', async (req, res) => {
    const { name } = req.params;
    const searchTerm = `%${name}%`; // Add wildcards for LIKE query

    try {
        await connectToDatabase();
        const result = await sql.query`
            SELECT ComponentName, Icon 
            FROM Components 
            WHERE ComponentName LIKE ${searchTerm}`;

        if (result.recordset.length === 0) {
            return res.status(404).send('Component not found');
        }

        const component = result.recordset[0];

        // Convert binary data to base64 if needed
        if (component.Icon) {
            component.Icon = Buffer.from(component.Icon, 'binary').toString('base64');
        }
        
        res.json(component);
    } catch (error) {
        console.error('Error fetching component details:', error);
        res.status(500).send('Error fetching component details');
    }
});




// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});

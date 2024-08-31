// Import packages
const express = require('express');
const sqlite = require('sqlite');
const sqlite3 = require('sqlite3');
const path = require('path');

// Import searchArg and model files
const searchArg = require('./searchArg.js');
const Screen = require('./models/Screen'); 
const Gene = require('./models/Gene');
const Phen = require('./models/Phen');

// Create the server
const app = express();
const port = 3000;
const dbPath = './genomeCRISPR.db';   // put name of database HERE

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'frontend')));


// Serving the index.html file at the root URL
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});



// Route to search for a gene directly accesing the database using the searchArg module
// not used in the frontend, models are used instead
app.get('/gene', async (req, res) => {
    let db;
    try {
        db = await sqlite.open({
            filename: './X.db', // put name of database HERE
            driver: sqlite3.Database
        });

        const searchParam = req.query;
        console.log('Search Parameters:', searchParam);

        const searchSql = searchArg.translateToSQL(searchParam, 'gene');
        console.log('Generated SQL Query:', searchSql);

        const dbResult = await db.all(searchSql);
        console.log('Database Result:', dbResult);

        res.json(dbResult);

    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'An error occurred while processing your request.' });

    } finally {
        if (db) {
            await db.close();
        }
    }
});



// Route to search for a gene using Gene.searchWithAssociations method
// Retrieves associated sgRNAs and screens
// Handles pagination, sorting and search parameters
app.get('/api/gene/search', async (req, res) => {
    let db;
    try {
        db = await sqlite.open({ filename: dbPath, driver: sqlite3.Database });

        const query = req.query.query;
        const sgLimit = parseInt(req.query.sgLimit) || 10;
        const sgPage = parseInt(req.query.sgPage) || 0;

        const sgSortBy = req.query.sgSortBy || 'sequence';
        const sgSortOrder = req.query.sgSortOrder || 'asc';
        const screenSortBy = req.query.screenSortBy || 'pubmed';
        const screenSortOrder = req.query.screenSortOrder || 'asc';

        if (!query) {
            return res.status(400).json({ error: 'Query parameter is required' });
        }

        const screenSearchParams = {
            pubmed: req.query.pubmed,
            screentype: req.query.screentype,
            condition: req.query.condition,
            cas: req.query.cas,
            cellline: req.query.cellline
        };
        const sgSearchParams = {
            sequence: req.query.sequence,
            effect: req.query.effect
        };

        const result = await Gene.searchWithAssociations(
            query, 
            screenSearchParams, 
            sgSearchParams, 
            sgPage, 
            sgLimit, 
            sgSortBy, 
            sgSortOrder, 
            screenSortBy, 
            screenSortOrder, 
            db
        );

        if (!result || result.genes.length === 0) {
            return res.status(404).json({ error: 'Gene not found or no associated data.' });
        }

        res.json({
            genes: result.genes,
            totalSgCount: result.totalSgCount,
            sgs: result.sgs,
            screens: result.screens
        });

    } catch (error) {
        console.error('Error fetching gene and associated data:', error.message, error.stack);
        res.status(500).json({ error: 'An error occurred while searching for gene and associated data.' });
    } finally {
        if (db) await db.close();
    }
});


// Route to retrieve phen data associated with a specific sgRNA, uses Phen.findBySgIds method
app.get('/api/sg/phen', async (req, res) => {
    let db;
    try {
        db = await sqlite.open({
            filename: dbPath,
            driver: sqlite3.Database
        });

        // Accept multiple sgRNA IDs as a comma-separated list
        const sgIds = req.query.ids;
        if (!sgIds) {
            return res.status(400).json({ error: 'sgRNA IDs are required' });
        }

        // Split the comma-separated list into an array
        const idsArray = sgIds.split(',').map(id => parseInt(id, 10));

        const phenData = await Phen.findBySgIds(idsArray, db);

        res.json(phenData);

    } catch (error) {
        console.error('Error retrieving phen data for sgRNAs:', error);
        res.status(500).json({ error: 'An error occurred while retrieving phen data for sgRNAs.' });

    } finally {
        if (db) {
            await db.close();
        }
    }
});


// Route to retrieve phen data from screens associated with a specific sgRNA, uses Screen.findEffectsBySgId method
// used for EffectVsScreen plot
app.get('/api/sg/screeneffect', async (req, res) => {
    let db;
    try {
        db = await sqlite.open({
            filename: dbPath,
            driver: sqlite3.Database
        });

        const sgId = req.query.sgId;
        if (!sgId) {
            return res.status(400).json({ error: 'sgRNA ID is required' });
        }

        // Fetch effects associated with the given sgRNA
        const effects = await Screen.findEffectsBySgId(sgId, db);

        if (effects.length === 0) {
            return res.status(404).json({ error: 'No effects found for the given sgRNA ID' });
        }

        res.json(effects);

    } catch (error) {
        console.error('Error retrieving effects for sgRNA:', error);
        res.status(500).json({ error: 'An error occurred while retrieving effects for sgRNA.' });

    } finally {
        if (db) {
            await db.close();
        }
    }
});




// Start server and listen
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

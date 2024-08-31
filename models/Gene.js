const BaseModel = require('./BaseModel');
const Sg = require('./Sg');
const Screen = require('./Screen');

class Gene extends BaseModel {
    constructor(data) {
        super(data);
    }

    static get tableName() {
        return 'gene';
    }

    // Methods
    // Search gene by symbol or ensembl ID
    static async searchGene(query, isEnsemblId, db) {
        const sql = `SELECT * FROM ${this.tableName} WHERE ${isEnsemblId ? 'ensg' : 'symbol'} COLLATE NOCASE = ?`;
        return await db.all(sql, [query]);
    }

    // Search gene with associatiated sgRNAs and screens
    // used in /api/gene/search route
    // use Sg and Screen models to fetch data
    static async searchWithAssociations(query, screenSearchParams, sgSearchParams, sgPage = 0, sgLimit = 10, sgSortBy = 'sequence', sgSortOrder = 'asc', screenSortBy = 'pubmed', screenSortOrder = 'asc', db) {
        const isEnsemblId = query.startsWith('ENSG');
        
        try {
            const geneResults = await this.searchGene(query, isEnsemblId, db);
            if (!geneResults.length) return null;
    
            const geneIds = geneResults.map(gene => gene.id);
    
            // Fetch sg data
            const { total: totalSgCount, results: sgResults } = await Sg.fetchDataByGeneIds(geneIds, sgSearchParams, sgPage, sgLimit, sgSortBy, sgSortOrder, db);
            
            // Fetch screen
            const { results: screenResults } = await Screen.fetchDataByGeneIds(geneIds, screenSearchParams, screenSortBy, screenSortOrder, db);
    
            return {
                genes: geneResults.map(row => new this(row)),
                totalSgCount,
                totalScreenCount: screenResults.length,
                sgs: sgResults.map(row => new Sg(row)),
                screens: screenResults.map(row => new Screen(row)),
            };
        } catch (error) {
            console.error('Error searching gene with associations:', error.message, error.stack);
            throw error;
        }
    }
}

module.exports = Gene;
const BaseModel = require('./BaseModel');

class Screen extends BaseModel {
    constructor(data) {
        super(data);
    }

    static get tableName() {
        return 'screen';
    }

    // Methods
    // Fetch screen data by gene IDs
    // used in Gene.searchWithAssociations method
    static async fetchDataByGeneIds(geneIds, screenSearchParams, sortBy = 'pubmed', sortOrder = 'asc', db) {
        const dataSql = this._buildScreenDataQuery(geneIds, screenSearchParams, sortBy, sortOrder);
        const dataResult = await db.all(dataSql.query, dataSql.params);
    
        return { results: dataResult };
    }

    // Fetch total screen count by gene IDs
    static _buildScreenTotalQuery(geneIds, screenSearchParams) {
        let query = `
            SELECT COUNT(DISTINCT s.id) as total
            FROM screen s
            JOIN genescreen gs ON s.id = gs.screen_id
            WHERE gs.gene_id IN (${geneIds.map(() => '?').join(', ')})
        `;
        const params = [...geneIds];

        if (screenSearchParams.pubmed) {
            query += ' AND s.pubmed COLLATE NOCASE LIKE ?';
            params.push(`%${screenSearchParams.pubmed}%`);
        }
        if (screenSearchParams.screentype) {
            query += ' AND s.screentype COLLATE NOCASE LIKE ?';
            params.push(`%${screenSearchParams.screentype}%`);
        }
        if (screenSearchParams.condition) {
            query += ' AND s.condition COLLATE NOCASE LIKE ?';
            params.push(`%${screenSearchParams.condition}%`);
        }
        if (screenSearchParams.cas) {
            query += ' AND s.cas COLLATE NOCASE LIKE ?';
            params.push(`%${screenSearchParams.cas}%`);
        }
        if (screenSearchParams.cellline) {
            query += ' AND s.cellline COLLATE NOCASE LIKE ?';
            params.push(`%${screenSearchParams.cellline}%`);
        }

        return { query, params };
    }

    // Build screen data query
    static _buildScreenDataQuery(geneIds, screenSearchParams, sortBy, sortOrder) {
        let query = `
            SELECT DISTINCT s.*
            FROM screen s
            JOIN genescreen gs ON s.id = gs.screen_id
            WHERE gs.gene_id IN (${geneIds.map(() => '?').join(', ')})
        `;
        const params = [...geneIds];
    
        if (screenSearchParams.pubmed) {
            query += ' AND s.pubmed COLLATE NOCASE LIKE ?';
            params.push(`%${screenSearchParams.pubmed}%`);
        }
        if (screenSearchParams.screentype) {
            query += ' AND s.screentype COLLATE NOCASE LIKE ?';
            params.push(`%${screenSearchParams.screentype}%`);
        }
        if (screenSearchParams.condition) {
            query += ' AND s.condition COLLATE NOCASE LIKE ?';
            params.push(`%${screenSearchParams.condition}%`);
        }
        if (screenSearchParams.cas) {
            query += ' AND s.cas COLLATE NOCASE LIKE ?';
            params.push(`%${screenSearchParams.cas}%`);
        }
        if (screenSearchParams.cellline) {
            query += ' AND s.cellline COLLATE NOCASE LIKE ?';
            params.push(`%${screenSearchParams.cellline}%`);
        }
    
        const validSortColumns = ['pubmed', 'screentype', 'condition', 'cas', 'cellline'];
        const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'id';
    
        query += ` ORDER BY ${sortColumn} ${sortOrder.toUpperCase()}`;
    
        return { query, params };
    }

    // Find effects by sgID, used for detail plot
    static async findEffectsBySgId(sgId, db) {
        const sql = `
            SELECT 
                screen.id AS screen_id,
                screen.pubmed,
                screen.cellline,
                phen.effect,
                phen.log2fc
            FROM 
                sgscreen sgs
            JOIN 
                phen ON sgs.phen_id = phen.id
            JOIN 
                screen ON sgs.screen_id = screen.id
            WHERE 
                sgs.sg_id = ?
        `;
        try {
            const rows = await db.all(sql, [sgId]);
            return rows;
        } catch (error) {
            console.error('Error finding effects by sgID:', error);
            throw error;
        }
    }
}

module.exports = Screen;


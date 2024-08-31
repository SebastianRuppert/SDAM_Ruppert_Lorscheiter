const BaseModel = require('./BaseModel');

class Sg extends BaseModel {
    constructor(data) {
        super(data);
    }

    static get tableName() {
        return 'sg';
    }

    // Methods
    // Fetch sg data by gene IDs
    // used in Gene.searchWithAssociations method
    static async fetchDataByGeneIds(geneIds, sgSearchParams, page = 0, limit = 10, sortBy = 'sequence', sortOrder = 'asc', db) {
        const totalSql = this._buildSgTotalQuery(geneIds, sgSearchParams);
        const totalResult = await db.get(totalSql.query, totalSql.params);

        const dataSql = this._buildSgDataQuery(geneIds, sgSearchParams, page, limit, sortBy, sortOrder);
        const dataResult = await db.all(dataSql.query, dataSql.params);

        return { total: totalResult.total, results: dataResult };
    }

    // Fetch total sg count by gene IDs
    static _buildSgTotalQuery(geneIds, sgSearchParams) {
        let query = `
            SELECT COUNT(*) as total
            FROM sg
            LEFT JOIN sgscreen sgs ON sg.id = sgs.sg_id
            LEFT JOIN phen p ON sgs.phen_id = p.id
            WHERE sg.gene_id IN (${geneIds.map(() => '?').join(', ')})
        `;
        const params = [...geneIds];
    
        if (sgSearchParams.sequence) {
            query += ' AND sg.sequence COLLATE NOCASE LIKE ?';
            params.push(`%${sgSearchParams.sequence}%`);
        }
        if (sgSearchParams.effect) {
            query += ' AND p.effect COLLATE NOCASE LIKE ?';
            params.push(`%${sgSearchParams.effect}%`);
        }
    
        return { query, params };
    }
    
    // Build sg data query
    static _buildSgDataQuery(geneIds, sgSearchParams, page, limit, sortBy, sortOrder) {
        let query = `
            SELECT sg.*, p.effect
            FROM sg
            LEFT JOIN sgscreen sgs ON sg.id = sgs.sg_id
            LEFT JOIN phen p ON sgs.phen_id = p.id
            WHERE sg.gene_id IN (${geneIds.map(() => '?').join(', ')})
        `;
        const params = [...geneIds];

        if (sgSearchParams.sequence) {
            query += ' AND sg.sequence COLLATE NOCASE LIKE ?';
            params.push(`%${sgSearchParams.sequence}%`);
        }
        if (sgSearchParams.effect) {
            query += ' AND p.effect COLLATE NOCASE LIKE ?';
            params.push(`%${sgSearchParams.effect}%`);
        }

        const validSortColumns = ['sequence', 'start', 'end', 'chr', 'strand', 'gene_id'];
        const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'id';

        query += ` ORDER BY ${sortColumn} ${sortOrder.toUpperCase()} LIMIT ? OFFSET ?`;
        params.push(limit, page * limit);

        return { query, params };
    }
}

module.exports = Sg;

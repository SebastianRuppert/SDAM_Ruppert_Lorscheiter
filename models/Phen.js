const BaseModel = require('./BaseModel');

class Phen extends BaseModel {
    constructor(data) {
        super(data);
    }

    static get tableName() {
        return 'phen';
    }

    // Methods
    // Fetch phen data by sgRNA IDs
    // used by /api/sg/phen route
    static async findBySgIds(sgIds, db) {
        const placeholders = sgIds.map(() => '?').join(',');

        const sql = `
            SELECT p.*, s.id as sgId
            FROM phen p
            JOIN sgscreen sgs ON p.id = sgs.phen_id
            JOIN sg s ON sgs.sg_id = s.id
            WHERE s.id IN (${placeholders});
        `;

        try {
            const rows = await db.all(sql, sgIds);
            return rows.map(row => new Phen(row));
        } catch (error) {
            console.error('Error finding phen data by sgRNA IDs:', error);
            throw error;
        }
    }
}

module.exports = Phen;

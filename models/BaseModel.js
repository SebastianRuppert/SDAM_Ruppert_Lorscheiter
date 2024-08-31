class BaseModel {
    static get tableName() {
        if (!this._tableName) {
            throw new Error('Table name is required. Set the tableName property in the subclass.');
        }
        return this._tableName;
    }

    static set tableName(name) {
        this._tableName = name;
    }

    constructor(keyValuePairs) {
        Object.assign(this, keyValuePairs);
    }

    // CRUD operations
    // Create
    static async createOne(keyValuePairs, db_connection) {
        this.validateTableName();
        const columns = Object.keys(keyValuePairs).join(', ');
        const placeholders = Object.keys(keyValuePairs).map(() => '?').join(', ');
        const sql = `INSERT INTO ${this.tableName} (${columns}) VALUES (${placeholders})`;

        try {
            const db_res = await db_connection.run(sql, ...Object.values(keyValuePairs));
            const new_record = await db_connection.get(
                `SELECT * FROM ${this.tableName} WHERE id = ?`,
                db_res.lastID
            );
            return new this(new_record);
        } catch (error) {
            console.error(`Error creating a record in ${this.tableName}:`, error);
            throw error;
        }
    }

    // Read
    static async search(column, query, db_connection) {
        this.validateTableName();
        const validColumns = await this.getTableColumns(db_connection);

        if (!validColumns.includes(column)) {
            throw new Error(`Invalid column for search in ${this.tableName}: ${column}`);
        }

        const sql = `SELECT * FROM ${this.tableName} WHERE ${column} LIKE ?`;
        const searchTerm = `%${query}%`;

        try {
            const rows = await db_connection.all(sql, searchTerm);
            return rows.map(row => new this(row));
        } catch (error) {
            console.error(`Error searching in ${this.tableName} by ${column}:`, error);
            throw error;
        }
    }

    // Update
    async update(db_connection) {
        this.constructor.validateTableName();
        const columns = Object.keys(this).filter(key => key !== 'id');
        const setClause = columns.map(col => `${col} = ?`).join(', ');
        const sql = `UPDATE ${this.constructor.tableName} SET ${setClause} WHERE id = ?`;

        try {
            await db_connection.run(sql, ...columns.map(col => this[col]), this.id);
            return await this.constructor.findById(this.id, db_connection);
        } catch (error) {
            console.error(`Error updating a record in ${this.constructor.tableName}:`, error);
            throw error;
        }
    }

    // Delete
    static async deleteById(id, db_connection) {
        this.validateTableName();
        const sql = `DELETE FROM ${this.tableName} WHERE id = ?`;

        try {
            await db_connection.run(sql, id);
        } catch (error) {
            console.error(`Error deleting a record from ${this.tableName}:`, error);
            throw error;
        }
    }

    
    // Additional methods
    // Find by ID
    static async findById(id, db_connection) {
        this.validateTableName();
        const sql = `SELECT * FROM ${this.tableName} WHERE id = ?`;

        try {
            const row = await db_connection.get(sql, id);
            return row ? new this(row) : null;
        } catch (error) {
            console.error(`Error finding a record in ${this.tableName} by ID:`, error);
            throw error;
        }
    }

    // Sort by column
    static async sortBy(column, order = 'ASC', db_connection) {
        this.validateTableName();
        const validColumns = await this.getTableColumns(db_connection);

        if (!validColumns.includes(column)) {
            throw new Error(`Invalid column for sorting in ${this.tableName}: ${column}`);
        }

        const sql = `SELECT * FROM ${this.tableName} ORDER BY ${column} ${order}`;

        try {
            const rows = await db_connection.all(sql);
            return rows.map(row => new this(row));
        } catch (error) {
            console.error(`Error sorting in ${this.tableName} by ${column}:`, error);
            throw error;
        }
    }

    // Get table columns
    static async getTableColumns(db_connection) {
        this.validateTableName();
        const sql = `PRAGMA table_info(${this.tableName})`;

        try {
            const columns = await db_connection.all(sql);
            return columns.map(col => col.name);
        } catch (error) {
            console.error(`Error retrieving table columns for ${this.tableName}:`, error);
            throw error;
        }
    }

    static validateTableName() {
        if (!this.tableName) {
            throw new Error('Table name is required.');
        }
    }
}

module.exports = BaseModel;

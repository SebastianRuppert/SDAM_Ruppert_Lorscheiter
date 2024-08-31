const BaseModel = require('./BaseModel');

describe('BaseModel', () => {
    let dbMock;

    beforeEach(() => {
        dbMock = {
            run: jest.fn(),
            get: jest.fn(),
            all: jest.fn(),
        };
    });

    test('should throw error if tableName is not set', () => {
        class TestModel extends BaseModel {}

        expect(() => TestModel.tableName).toThrow('Table name is required. Set the tableName property in the subclass.');
    });

    test('should set and get tableName', () => {
        class TestModel extends BaseModel {}
        TestModel.tableName = 'test_table';

        expect(TestModel.tableName).toBe('test_table');
    });

    test('should create a new record', async () => {
        class TestModel extends BaseModel {
            static get tableName() {
                return 'test_table';
            }
        }

        const mockData = { id: 1, name: 'Test' };
        dbMock.run.mockResolvedValueOnce({ lastID: 1 });
        dbMock.get.mockResolvedValueOnce(mockData);

        const result = await TestModel.createOne(mockData, dbMock);

        expect(dbMock.run).toHaveBeenCalledWith(
            'INSERT INTO test_table (id, name) VALUES (?, ?)',
            1,
            'Test'
        );
        expect(dbMock.get).toHaveBeenCalledWith(
            'SELECT * FROM test_table WHERE id = ?',
            1
        );
        expect(result).toEqual(new TestModel(mockData));
    });

    test('should find a record by id', async () => {
        class TestModel extends BaseModel {
            static get tableName() {
                return 'test_table';
            }
        }

        const mockData = { id: 1, name: 'Test' };
        dbMock.get.mockResolvedValueOnce(mockData);

        const result = await TestModel.findById(1, dbMock);

        expect(dbMock.get).toHaveBeenCalledWith(
            'SELECT * FROM test_table WHERE id = ?',
            1
        );
        expect(result).toEqual(new TestModel(mockData));
    });

    test('should return null if record is not found by id', async () => {
        class TestModel extends BaseModel {
            static get tableName() {
                return 'test_table';
            }
        }

        dbMock.get.mockResolvedValueOnce(null);

        const result = await TestModel.findById(1, dbMock);

        expect(result).toBeNull();
    });

    test('should search records by column', async () => {
        class TestModel extends BaseModel {
            static get tableName() {
                return 'test_table';
            }
        }

        const mockColumns = ['id', 'name'];
        const mockData = [{ id: 1, name: 'Test' }];
        dbMock.all.mockResolvedValueOnce(mockColumns.map(name => ({ name }))); // Mock getTableColumns
        dbMock.all.mockResolvedValueOnce(mockData);

        const result = await TestModel.search('name', 'Test', dbMock);

        expect(dbMock.all).toHaveBeenCalledWith(
            'SELECT * FROM test_table WHERE name LIKE ?',
            '%Test%'
        );
        expect(result).toEqual(mockData.map(row => new TestModel(row)));
    });

    test('should update a record', async () => {
        class TestModel extends BaseModel {
            static get tableName() {
                return 'test_table';
            }
        }

        const mockData = { id: 1, name: 'Updated Test' };
        const instance = new TestModel(mockData);
        dbMock.run.mockResolvedValueOnce();
        dbMock.get.mockResolvedValueOnce(mockData);

        const result = await instance.update(dbMock);

        expect(dbMock.run).toHaveBeenCalledWith(
            'UPDATE test_table SET name = ? WHERE id = ?',
            'Updated Test',
            1
        );
        expect(result).toEqual(new TestModel(mockData));
    });

    test('should delete a record by id', async () => {
        class TestModel extends BaseModel {
            static get tableName() {
                return 'test_table';
            }
        }

        dbMock.run.mockResolvedValueOnce();

        await TestModel.deleteById(1, dbMock);

        expect(dbMock.run).toHaveBeenCalledWith(
            'DELETE FROM test_table WHERE id = ?',
            1
        );
    });

    test('should sort records by column', async () => {
        class TestModel extends BaseModel {
            static get tableName() {
                return 'test_table';
            }
        }

        const mockColumns = ['id', 'name'];
        const mockData = [{ id: 1, name: 'Test' }];
        dbMock.all.mockResolvedValueOnce(mockColumns.map(name => ({ name }))); // Mock getTableColumns
        dbMock.all.mockResolvedValueOnce(mockData);

        const result = await TestModel.sortBy('name', 'ASC', dbMock);

        expect(dbMock.all).toHaveBeenCalledWith(
            'SELECT * FROM test_table ORDER BY name ASC'
        );
        expect(result).toEqual(mockData.map(row => new TestModel(row)));
    });

    test('should throw error if sorting by an invalid column', async () => {
        class TestModel extends BaseModel {
            static get tableName() {
                return 'test_table';
            }
        }

        const mockColumns = ['id', 'name'];
        dbMock.all.mockResolvedValueOnce(mockColumns.map(name => ({ name })));// Mock getTableColumns

        await expect(TestModel.sortBy('invalidColumn', 'ASC', dbMock)).rejects.toThrow(
            'Invalid column for sorting in test_table: invalidColumn'
        );
    });

    test('should retrieve table columns', async () => {
        class TestModel extends BaseModel {
            static get tableName() {
                return 'test_table';
            }
        }

        const mockColumns = [{ name: 'id' }, { name: 'name' }];
        dbMock.all.mockResolvedValueOnce(mockColumns);

        const result = await TestModel.getTableColumns(dbMock);

        expect(dbMock.all).toHaveBeenCalledWith('PRAGMA table_info(test_table)');
        expect(result).toEqual(['id', 'name']);
    });
});


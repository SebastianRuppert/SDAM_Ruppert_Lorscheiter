const Phen = require('./Phen');
const Screen = require('./Screen');
const Sg = require('./Sg');
const Gene = require('./Gene');

// Testing the Phen model
describe('Phen Model', () => {
    let dbMock;

    beforeEach(() => {
        dbMock = {
            all: jest.fn(),
        };
    });

    test('should fetch phen data by sgRNA IDs', async () => {
        const mockData = [{ id: 1, sgId: 1, name: 'Phen1' }];
        dbMock.all.mockResolvedValueOnce(mockData);

        const sgIds = [1];
        const result = await Phen.findBySgIds(sgIds, dbMock);

        expect(dbMock.all).toHaveBeenCalledWith(
            `
            SELECT p.*, s.id as sgId
            FROM phen p
            JOIN sgscreen sgs ON p.id = sgs.phen_id
            JOIN sg s ON sgs.sg_id = s.id
            WHERE s.id IN (?);
        `,
            sgIds
        );
        expect(result).toEqual(mockData.map(row => new Phen(row)));
    });
});

// Testing the Screen model
describe('Screen Model', () => {
    let dbMock;

    beforeEach(() => {
        dbMock = {
            all: jest.fn(),
            get: jest.fn(),
        };
    });

    test('should fetch screen data by gene IDs', async () => {
        const mockData = [{ id: 1, pubmed: 'TestPubmed' }];
        dbMock.all.mockResolvedValueOnce(mockData);

        const geneIds = [1];
        const screenSearchParams = { pubmed: 'TestPubmed' };
        const result = await Screen.fetchDataByGeneIds(geneIds, screenSearchParams, 'pubmed', 'asc', dbMock);

        expect(dbMock.all).toHaveBeenCalled();
        expect(result.results).toEqual(mockData);
    });

    test('should find effects by sgID', async () => {
        const mockData = [{ screen_id: 1, pubmed: 'TestPubmed', cellline: 'TestCellline', effect: 'TestEffect', log2fc: 1.5 }];
        dbMock.all.mockResolvedValueOnce(mockData);

        const sgId = 1;
        const result = await Screen.findEffectsBySgId(sgId, dbMock);

        expect(dbMock.all).toHaveBeenCalledWith(
            `
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
        `,
            [sgId]
        );
        expect(result).toEqual(mockData);
    });
});

// Testing the Sg model
describe('Sg Model', () => {
    let dbMock;

    beforeEach(() => {
        dbMock = {
            all: jest.fn(),
            get: jest.fn(),
        };
    });

    test('should fetch sg data by gene IDs', async () => {
        const mockData = [{ id: 1, sequence: 'TestSequence' }];
        dbMock.get.mockResolvedValueOnce({ total: 1 });
        dbMock.all.mockResolvedValueOnce(mockData);

        const geneIds = [1];
        const sgSearchParams = { sequence: 'TestSequence' };
        const result = await Sg.fetchDataByGeneIds(geneIds, sgSearchParams, 0, 10, 'sequence', 'asc', dbMock);

        expect(dbMock.all).toHaveBeenCalled();
        expect(result.results).toEqual(mockData);
        expect(result.total).toBe(1);
    });
});

// Testing the Gene model
describe('Gene Model', () => {
    let dbMock;

    beforeEach(() => {
        dbMock = {
            all: jest.fn(),
            get: jest.fn(),
        };
    });

    test('should search gene with associated sgRNAs and screens', async () => {
        const mockGeneData = [{ id: 1, symbol: 'Gene1' }];
        const mockSgData = [{ id: 1, sequence: 'TestSequence' }];
        const mockScreenData = [{ id: 1, pubmed: 'TestPubmed' }];

        dbMock.all.mockResolvedValueOnce(mockGeneData); // searchGene
        dbMock.get.mockResolvedValueOnce({ total: 1 }); // Sg.fetchDataByGeneIds total
        dbMock.all.mockResolvedValueOnce(mockSgData); // Sg.fetchDataByGeneIds results
        dbMock.all.mockResolvedValueOnce(mockScreenData); // Screen.fetchDataByGeneIds results

        const query = 'Gene1';
        const screenSearchParams = { pubmed: 'TestPubmed' };
        const sgSearchParams = { sequence: 'TestSequence' };

        const result = await Gene.searchWithAssociations(
            query,
            screenSearchParams,
            sgSearchParams,
            0,
            10,
            'sequence',
            'asc',
            'pubmed',
            'asc',
            dbMock
        );

        expect(dbMock.all).toHaveBeenCalled();
        expect(result.genes).toEqual(mockGeneData.map(row => new Gene(row)));
        expect(result.sgs).toEqual(mockSgData.map(row => new Sg(row)));
        expect(result.screens).toEqual(mockScreenData.map(row => new Screen(row)));
    });
});


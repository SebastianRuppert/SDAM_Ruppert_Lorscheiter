BEGIN;

    -- Create tables for the entities
    CREATE TABLE gene (
        id INTEGER PRIMARY KEY autoincrement,
        symbol VARCHAR NOT NULL,
        ensg VARCHAR NOT NULL,
        UNIQUE (symbol, ensg)
    );
    
    CREATE TABLE phen (
        id INTEGER PRIMARY KEY autoincrement,
        rc_final VARCHAR NOT NULL,
        rc_initial VARCHAR NOT NULL,
        effect INTEGER NOT NULL,
        log2fc INTEGER NOT NULL,
        UNIQUE (rc_final, rc_initial, effect, log2fc)
    );
	
	 CREATE TABLE screen (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pubmed INTEGER NOT NULL,
    screentype VARCHAR NOT NULL,
    condition VARCHAR NOT NULL,
    cas VARCHAR NOT NULL,
    cellline VARCHAR NOT NULL,
    UNIQUE (pubmed, screentype, condition, cas, cellline)
    );

   	CREATE TABLE sg (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    start INTEGER NOT NULL,
    end INTEGER NOT NULL,
    chr VARCHAR NOT NULL,
    strand VARCHAR NOT NULL,
    sequence VARCHAR NOT NULL,
	gene_id INTEGER NOT NULL,
	FOREIGN KEY (gene_id) REFERENCES gene(id)
    );
    
    -- Create tables for the relationships
    CREATE TABLE sgscreen (
        sg_id INTEGER NOT NULL,
        screen_id INTEGER NOT NULL,
        phen_id INTEGER NOT NULL,
        PRIMARY KEY (sg_id, screen_id),
        FOREIGN KEY (sg_id) REFERENCES sg(id),
        FOREIGN KEY (screen_id) REFERENCES screen(id),
        FOREIGN KEY (phen_id) REFERENCES phen(id)
    );

    CREATE TABLE genescreen (
        gene_id INTEGER NOT NULL,
        screen_id INTEGER NOT NULL,
        PRIMARY KEY (gene_id, screen_id),
        FOREIGN KEY (gene_id) REFERENCES gene(id),
        FOREIGN KEY (screen_id) REFERENCES screen(id)
    );

COMMIT;

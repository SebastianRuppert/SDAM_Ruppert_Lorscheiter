

-- Insert distinct gene records
INSERT INTO gene (ensg, symbol)
SELECT DISTINCT ensg, symbol
FROM csv_import
WHERE ensg IS NOT NULL AND symbol IS NOT NULL;

-- Insert distinct phen records
INSERT INTO phen (rc_final, rc_initial, effect, log2fc)
SELECT DISTINCT 
    rc_final, 
    rc_initial, 
    effect, 
    log2fc
FROM csv_import
WHERE 
    rc_final IS NOT NULL AND 
    rc_initial IS NOT NULL AND
    effect IS NOT NULL AND
    log2fc IS NOT NULL;

-- Insert distinct screen records
INSERT INTO screen (pubmed, screentype, condition, cas, cellline)
SELECT DISTINCT pubmed, screentype, condition, cas, cellline
FROM csv_import
WHERE pubmed IS NOT NULL 
AND screentype IS NOT NULL 
AND condition IS NOT NULL
AND cas IS NOT NULL 
AND cellline IS NOT NULL;
    
-- Insert distinct sg records
INSERT INTO sg (start, end, chr, strand, sequence, gene_id)
SELECT DISTINCT
    ci.start,
    ci.end,
    ci.chr,
    ci.strand,
    ci.sequence,
    g.id AS gene_id
FROM csv_import ci
JOIN gene g ON ci.symbol = g.symbol AND ci.ensg = g.ensg
WHERE ci.start IS NOT NULL AND ci.end IS NOT NULL AND ci.chr IS NOT NULL AND ci.strand IS NOT NULL AND ci.sequence IS NOT NULL;

-- Insert into sg_screen
INSERT INTO sgscreen (sg_id, screen_id, phen_id)
SELECT DISTINCT sg.id AS sg_id, sc.id AS screen_id, ph.id AS phen_id
FROM sg
JOIN csv_import ci ON sg.sequence = ci.sequence
JOIN screen sc ON ci.cellline = sc.cellline
JOIN phen ph ON ci.log2fc = ph.log2fc AND ci.effect = ph.effect 
    AND ci.rc_initial = ph.rc_initial AND ci.rc_final = ph.rc_final
WHERE NOT EXISTS (
    SELECT 1
    FROM sgscreen sgs
    WHERE sgs.sg_id = sg.id AND sgs.screen_id = sc.id AND sgs.phen_id = ph.id
);

-- Insert distinct gene_id and screen_id combinations
INSERT INTO genescreen (gene_id, screen_id)
SELECT DISTINCT g.id, s.id
FROM csv_import ci
JOIN gene g ON ci.ensg = g.ensg
JOIN screen s ON ci.pubmed = s.pubmed
    AND ci.cellline = s.cellline
    AND ci.screentype = s.screentype
    AND ci.cas = s.cas
    AND ci.condition = s.condition
WHERE s.id IS NOT NULL
AND NOT EXISTS (
    SELECT 1
    FROM genescreen gs
    WHERE gs.screen_id = s.id
    AND gs.gene_id = g.id
);

DROP TABLE csv_import;

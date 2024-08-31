-- Index on foreign keys
-- Index on sg.gene_id (references gene.id)
CREATE INDEX idx_sg_gene_id ON sg (gene_id);


-- Index on sgscreen.sg_id (references sg.id)
CREATE INDEX idx_sgscreen_sg_id ON sgscreen (sg_id);

-- Index on sgscreen.screen_id (references screen.id)
CREATE INDEX idx_sgscreen_screen_id ON sgscreen (screen_id);

-- Index on genescreen.gene_id (references gene.id)
CREATE INDEX idx_genescreen_gene_id ON genescreen (gene_id);

-- Index on genescreen.screen_id (references screen.id)
CREATE INDEX idx_genescreen_screen_id ON genescreen (screen_id);


-- Index on frequently queried columns
-- Index on gene.symbol for fast lookups
CREATE INDEX idx_gene_symbol ON gene (symbol);

-- Index on gene.ensg for fast lookups
CREATE INDEX idx_gene_ensg ON gene (ensg);


-- Composite Indexes
-- Composite index on sg.start, sg.end, sg.chr, sg-strand for fast lookups
CREATE INDEX idx_sg_location ON	sg (start, end, chr, strand);

-- Composite index on gene.symbol and gene.ensg for fast lookups
CREATE INDEX idx_gene_symbol_ensg ON gene (symbol, ensg);
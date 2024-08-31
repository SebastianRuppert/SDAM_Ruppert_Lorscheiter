// take search input (JSON) and convert into SQL SELECT statement to query the database
// always use test driven development -> create test first, code needs to pass test


// lookup table for the decoy_new column data types
const fieldTypes = {
    // decoy table
    "decoy.start": "int",
    "decoy.end": "int",
    "decoy.chr": "varchar",
    "decoy.strand": "varchar",
    "decoy.pubmed": "int",
    "decoy.cellline": "varchar",
    "decoy.condition": "varchar",
    "decoy.sequence": "varchar",
    "decoy.symbol": "varchar",
    "decoy.ensg": "varchar",
    "decoy.log2fc": "int",
    "decoy.rc_initial": "varchar",
    "decoy.rc_final": "varchar",
    "decoy.effect": "int",
    "decoy.cas": "varchar",
    "decoy.screentype": "varchar",
    
    // gene table
    "gene.id": "int",
    "gene.symbol": "varchar",
    "gene.ensg": "varchar",
    
    // phen table
    "phen.id": "int",
    "phen.rc_final": "int",
    "phen.rc_initial": "int",
    "phen.effect": "int",
    "phen.log2fc": "int",
    
    // sg table
    "sg.id": "int",
    "sg.start": "int",
    "sg.end": "int",
    "sg.chr": "varchar",
    "sg.strand": "varchar",
    "sg.sequence": "varchar",
    "sg.gene_id": "foreign_key",   // References gene(id)
    
    // screen table
    "screen.id": "int",
    "screen.pubmed": "int",
    "screen.screentype": "varchar",
    "screen.condition": "varchar",
    "screen.cas": "varchar",
    "screen.cellline": "varchar",
    
    // sgscreen table
    "sgscreen.sg_id": "foreign_key",  // References sg(id)
    "sgscreen.screen_id": "foreign_key",  // References screen(id)
    
    // genescreen table
    "genescreen.gene_id": "foreign_key",  // References gene(id)
    "genescreen.screen_id": "foreign_key",  // References screen(id)

    // sgphen table
    "sgphen.sg_id": "foreign_key",  // References sg(id)
    "sgphen.phen_id": "foreign_key"  // References phen(id)
  };
  

  // function to check if a field is a text field
  function isTextField(field) {
    var fieldType = fieldTypes[field];  // get the field type from the lookup table
    console.log(`Checking if ${field} is a text field, found type: ${fieldType}`);
    return fieldType == "varchar";  // varchar similar to text, just shorter
}

// Function to validate inputs
function validateField(field) {
    if (!fieldTypes[field]) {
        throw new Error(`Invalid field: ${field}`);
    }
}

// Function to translate a search triplet (field, operator, value) into a SQL WHERE clause
function translateTriplet(field, operator, value) {
    console.log(`Translating triplet: field=${field}, operator=${operator}, value=${value}`);

    validateField(field); // Validate the field before translating

    if (!field || !operator || value === undefined) {
        console.error("Error: One of the triplet values is undefined.");
        return "undefined undefined undefined";
    }

    if (isTextField(field)) {
        return `${field} ${operator} '${value}'`;
    } else {
        return `${field} ${operator} ${value}`;
    }
}

// Function to translate a search argument into a SQL SELECT statement
function translateToSQL(searchArg, tableName) {
    const header = `SELECT * FROM ${tableName} WHERE`;  // header of the SQL SELECT statement

    // Check if the input has descendants; if not, translate the single triplet
    if (!searchArg.descendants) {
        console.log("No descendants, simple query.");
        return `${header} ${translateTriplet(searchArg.field, searchArg.op, searchArg.val)}`;
    }
    
    // Otherwise, call the recursive function for complex queries with descendants
    const searchSQL = translateToSQLRecursive(searchArg);
    return `${header} ${searchSQL}`;  // return the complete SQL SELECT statement
}

// Recursive function to handle complex queries with descendants
function translateToSQLRecursive(searchArg) {
    console.log("Processing recursive search argument:", searchArg);

    // Check if the search argument has descendants
    if (searchArg.descendants) {
        // Recursively process the descendants
        const descSqlArr = searchArg.descendants.map(translateToSQLRecursive);
        
        // Join the descendants using the operator (AND/OR)
        const sql = descSqlArr.reduce((a, c) => `${a} ${searchArg.op} ${c}`);
        
        // Return the SQL wrapped in parentheses for complex queries
        return `(${sql})`;
    } else {
        // If no descendants, it's a simple triplet; return the SQL for it
        return translateTriplet(searchArg.field, searchArg.op, searchArg.val);
    }
}








// TESTING

// import the module for testing
const { Module } = require("module");   // import module for testing
const { default: test } = require("node:test");


// Test the translateToSQL function
function testTranslateToSQL() {
    const example_search_arg_1 = {
        descendants: [
            { field: "decoy.cellline", op: "like", val: "J%" },
            { field: "decoy.chr", op: ">", val: "10" }
        ],
        op: "AND"
    };

    const example_search_arg_2 = {
        descendants: [
            { field: "decoy.cellline", op: "like", val: "J%" },
            { field: "decoy.chr", op: ">", val: "10" }
        ],
        op: "OR"
    };

    const example_search_arg_3 = { field: "decoy.cellline", op: "like", val: "J%" };
    const example_search_arg_4 = { field: "gene.symbol", op: "=", val: "A1CF" };  // New test for gene table

    // see results
    const expectedSQL1 = "SELECT * FROM decoy WHERE (decoy.cellline like 'J%' AND decoy.chr > 10)";
    const expectedSQL2 = "SELECT * FROM decoy WHERE (decoy.cellline like 'J%' OR decoy.chr > 10)";
    const expectedSQL3 = "SELECT * FROM decoy WHERE decoy.cellline like 'J%'";
    const expectedSQL4 = "SELECT * FROM gene WHERE gene.symbol = 'A1CF'";  // Expected SQL for gene table

    const resultSQL1 = translateToSQL(example_search_arg_1, 'decoy');
    const resultSQL2 = translateToSQL(example_search_arg_2, 'decoy');
    const resultSQL3 = translateToSQL(example_search_arg_3, 'decoy');
    const resultSQL4 = translateToSQL(example_search_arg_4, 'gene');  // Test result for gene table
    
    console.log(resultSQL1 === expectedSQL1);  // should log true
    console.log(resultSQL2 === expectedSQL2);  // should log true
    console.log(resultSQL3 === expectedSQL3);  // should log true
    console.log(resultSQL4 === expectedSQL4);  // should log true
    
    console.log("Expected SQL 1:", expectedSQL1);
    console.log("Result SQL 1:", resultSQL1);
    console.log("Expected SQL 2:", expectedSQL2);
    console.log("Result SQL 2:", resultSQL2);
    console.log("Expected SQL 3:", expectedSQL3);
    console.log("Result SQL 3:", resultSQL3);
    console.log("Expected SQL 4:", expectedSQL4);
    console.log("Result SQL 4:", resultSQL4);
}

// test the isTextField function
function testIsTextField() {
    console.log(isTextField("decoy.cellline") === true);    // should log true
    console.log(isTextField("decoy.pubmed") === false);    // should log true
}

// test translateTriplet function
function testTranslateTriplet() {
    console.log(translateTriplet("decoy.cellline", "like", "J%") === "decoy.cellline like 'J%'");    // should log true
    console.log(translateTriplet("decoy.pubmed", ">", "10") === "decoy.pubmed > 10");    // should log true
}


//testTranslateToSQL();
//testIsTextField();
//testTranslateTriplet();


// export the function
module.exports = {translateToSQL, testTranslateToSQL};
# Scientific Data Warehouse - GenomeCRISPR

This project implements a scientific data warehouse storing data from the GenomeCRISPR database. The warehouse provides access to these data through a RESTful web server, enabling users to browse, query and plot scientific data related to the CRISPR screens.
This project is part of the Scientific Data Management (SDAM) module. NOTE: This project only includes the provided data, representing a fraction of the original GenomeCRISPR dataset.


## Project structure
- **Data Models**: Defined based on the provided dataset
- **Database**: Implemented using SQLite, containing tables for entities, relations and indices
- **RESTful Server**: Implemented using Node.js with Express
- **Graphical User Interface (GUI)**: Created using HTML, CSS abd JavaScript, allowing users to browse and analyze the database, including plots

## Data Models
- **Gene**: Model describing genes that were targeted by sgRNAs as part of the different screens
- **Sg**: sgRNAs used to target genes in the different screens
- **Screens**: Different screens that are part of the dataset
- **Phen**: Dhenotypic data resulting from sgRNAs targeting genes in different screens



## Database

- **Entities**: The database consists of tables representing the core entities: genes, sgRNAs, screens, and phenotypic data.
- **Relationships**: Additional tables are defined to establish relationships between these core entities, such as the association between sgRNAs and screens or genes and screens.
- **Constraints**: Unique constraints and foreign keys are applied to ensure data integrity and consistency across the database.

### **Tables**

- **Gene**: 
  - Table describing genes targeted by sgRNAs in different screens.
  - **Columns**: `id`, `symbol`, `ensg`
  - **Unique Constraints**: `symbol`, `ensg`

- **Sg**: 
  - Table containing sgRNAs used to target genes in various screens.
  - **Columns**: `id`, `start`, `end`, `chr`, `strand`, `sequence`, `gene_id`
  - **Foreign Key**: `gene_id` references `gene(id)`

- **Screen**: 
  - Table representing the different screens conducted as part of the dataset.
  - **Columns**: `id`, `pubmed`, `screentype`, `condition`, `cas`, `cellline`
  - **Unique Constraints**: `pubmed`, `screentype`, `condition`, `cas`, `cellline`

- **Phen**: 
  - Table capturing phenotypic data resulting from sgRNA targeting in different screens.
  - **Columns**: `id`, `rc_final`, `rc_initial`, `effect`, `log2fc`
  - **Unique Constraints**: `rc_final`, `rc_initial`, `effect`, `log2fc`

### **Relationship Tables**

- **SgScreen**: 
  - Table linking sgRNAs with screens and their associated phenotypic data.
  - **Columns**: `sg_id`, `screen_id`, `phen_id`
  - **Primary Key**: `sg_id`, `screen_id`
  - **Foreign Keys**: 
    - `sg_id` references `sg(id)`
    - `screen_id` references `screen(id)`
    - `phen_id` references `phen(id)`

- **GeneScreen**: 
  - Table linking genes to screens, indicating which genes were targeted in each screen.
  - **Columns**: `gene_id`, `screen_id`
  - **Primary Key**: `gene_id`, `screen_id`
  - **Foreign Keys**: 
    - `gene_id` references `gene(id)`
    - `screen_id` references `screen(id)`




## RESTful Server

- **Server Implementation**: The server is built using Node.js with Express, providing RESTful API endpoints to interact with the `genomeCRISPR.db` SQLite database.
- **Database Access**: The server uses the `sqlite` and `sqlite3` libraries to interface with the SQLite database.
- **Routing**: Multiple routes are defined to handle various API requests, including searching for genes, retrieving associated data, and more. These routes access the defined Data Models.
- **Middleware**: The server utilizes Express middleware for JSON parsing, URL-encoded data parsing, and serving static files.

### **Routes**

- **Root Route (`/`)**: 
  - Serves the `index.html` file as the main entry point for the frontend.
  - **Method**: `GET`

- **Gene Search Route (`/gene`)**: 
  - Directly accesses the database using the `searchArg` module to search for a gene based on query parameters.
  - **Method**: `GET`
  - **Usage**: Not used by the frontend; intended for direct database querying.

- **Advanced Gene Search Route (`/api/gene/search`)**: 
  - Searches for genes using the `Gene.searchWithAssociations` method, retrieving associated sgRNAs and screens.
  - Handles pagination, sorting, and various search parameters.
  - **Method**: `GET`
  - **Response**: Returns genes and their associated sgRNAs and screens, or an error message if not found.

- **Phenotypic Data Route (`/api/sg/phen`)**: 
  - Retrieves phenotypic data associated with specific sgRNAs using the `Phen.findBySgIds` method.
  - Accepts multiple sgRNA IDs as a comma-separated list.
  - **Method**: `GET`
  - **Response**: Returns phenotypic data for the provided sgRNA IDs, or an error message if data is not found.

- **Screen Effect Data Route (`/api/sg/screeneffect`)**: 
  - Retrieves phenotypic data from screens associated with a specific sgRNA using the `Screen.findEffectsBySgId` method.
  - **Method**: `GET`
  - **Response**: Returns effects data for the given sgRNA, or an error message if no effects are found.

### **Server Execution**

- **Starting the Server**: 
  - The server listens on port `3000` and outputs a message to the console once it is running.




## Graphical User Interface (GUI)

- **Purpose**: The GUI is designed to allow users to search, browse, and analyze genomic data stored in the `genomeCRISPR.db` SQLite database. It supports filtering, sorting, and paginating through sgRNAs, screens, and associated phenotypic data.
- **Implementation**: The GUI is built using HTML, CSS, and JavaScript, providing a responsive and interactive interface for data exploration.

### Features

- **Search Functionality**: 
  - Users can search for genes by symbol or ENSEMBL ID. The search results include associated sgRNAs and screens.
  - **Display Screens**: The GUI allows users to display screens related to a gene search entry, whether the search is conducted using a gene symbol or an ENSEMBL ID.
  - **Associated Routes**: The search is powered by the `/api/gene/search` route, which retrieves relevant gene data, sgRNAs, and screens.

- **Pagination and Sorting**:
  - **Pagination**: Supports navigating through multiple pages of sgRNAs and screens, with customizable items per page.
  - **Sorting**: Users can sort sgRNAs by sequence and screens by various attributes (e.g., PubMed ID, screentype, condition) in ascending or descending order.
  - **Pagination and Sorting Control**: The interface includes buttons and controls for navigating between pages and adjusting sort parameters, which are managed by the JavaScript functions `updatePaginationControls`, `triggerSort`, and `handleSearch`.

- **Data Display**:
  - **Gene Data**: Displays detailed information about the searched gene, including its symbol and ENSG IDs, in a structured format.
  - **sgRNA Data**: Presents all related sgRNAs in a table format, including their chromosomal location, sequence, and associated phenotypic effects.
  - **Effect information**: Clicking on the effect value in the sg table reveals additional phenotypic data.
  - **Screen Data**: Displays screens related to the gene search in a table, with columns for PubMed ID, screentype, condition, CAS, and cell line.
  - **Filtering Data**: The search option within the tables allow the user to screen the database for differrent properties, such as sgRNA sequence or effect.
  - **Dynamic Updates**: The display functions (`displayGeneData`, `displaySgs`, `displayScreens`) dynamically update the content based on user interaction and search results.

- **Interactive Plots**:
  - **Detail View and Plots**: When clicking on the "Detail" link for a specific sgRNA, the GUI shows a plot illustrating the effects of the selected sgRNA across different screens. Further, hovering over the bars reveals additional related information.
  - **Effect vs. Screen Plot**: This plot is rendered using the Chart.js library and is displayed in a modal window, providing a visual representation of how the sgRNA affects various screens.
  - **Plot Features**: The plot supports tooltips that provide detailed information about the effects, including log2fc values and PubMed IDs.
  - **Associated Route**: The plot data is fetched from the `/api/sg/screeneffect` route.

- **Modal Windows**:
  - **Detail Modals**: The GUI includes modals that provide detailed views of sgRNA effects and plots. These modals are triggered by user interactions, such as clicking on an sgRNA sequence or effect value.
  - **Modal Control**: The modals are managed by JavaScript functions (`showModal`, `showModalWithPlot`), ensuring smooth and responsive user experience.

- **Utility Functions**:
  - The GUI includes several utility functions to manage table creation, pagination, and data fetching, such as `createTableRow`, `createPaginationButton`, `fetchPhenData`, and `getUniqueSgs`.
  - **Debouncing**: A debounce function is implemented to prevent multiple triggers during user input, ensuring efficient search and display updates.

- **Real-time Interaction**: Users can perform searches, sort data, and view detailed information with minimal delays, thanks to efficient data handling and asynchronous JavaScript functions.
- **Error Handling**: The GUI provides user-friendly error messages and alerts in case of failed data retrievals or invalid inputs.


## Folder Structure
my-node-server
- frontend
    - script.js
    - index.html
    - styles.css
    - images
- models
    - BaseModel.js
    - Gene.js
    - Screen.js
    - Sg.js
    - Phen.js
- genome.db
- server.js
- searchArg.js
- create_tables.sql
- insert_data.sql
- index.sql
- README.md

## Prerequisites

Before setting up and running the application, ensure that the following prerequisites are installed on your GNU/Linux system:

1. **Node.js and npm:**
   - The application is built using Node.js. Make sure you have Node.js and npm (Node Package Manager) installed.
   - You can check if Node.js is installed by running:
     ```bash
     node -v
     ```
   - And for npm:
     ```bash
     npm -v
     ```
   - If not installed, you can install them using the package manager for your distribution. For example, on Ubuntu:
     ```bash
     sudo apt update
     sudo apt install nodejs npm
     ```

2. **SQLite:**
   - The database is implemented using SQLite. You can verify its installation by running:
     ```bash
     sqlite3 --version
     ```
   - If SQLite is not installed, you can install it with:
     ```bash
     sudo apt update
     sudo apt install sqlite3
     ```

3. **Git:**
   - Ensure Git is installed to clone the repository. Verify by running:
     ```bash
     git --version
     ```
   - If not installed, use:
     ```bash
     sudo apt update
     sudo apt install git
     ```



## Installation

Once the prerequisites are met, follow these steps to install and set up the project:

1. **Clone the Repository:**
   - Clone the project repository to your local machine:
     ```bash
     git clone <repository-url>
     cd <repository-directory>
     ```

2. **Install Dependencies:**
   - Navigate to the project directory and install the required Node.js packages using npm:
     ```bash
     npm install express sqlite sqlite3 jest --save-dev
     ```
   - This command will install the necessary packages (`express`, `sqlite`, `sqlite3`) for running the server and `jest` as a development dependency for running tests.


## Set up the database
Follow these steps to set up the `genomeCRISPR.db` SQLite database.

**Navigate to the Project Directory:**
   - Open your terminal and change to the project directory where your files are located:
     ```bash
     cd /path/to/your/project/directory
     ```

**Trim the CSV File:**
   - Remove the last line from the `genomeCRISPR_full.csv` file and save the output as `genomeCRISPR_full_trimmed.csv`:
     ```bash
     head -n -1 /path/to/your/project/directory/genomeCRISPR_full.csv > /path/to/your/project/directory/genomeCRISPR_full_trimmed.csv
     ```

**Create the SQLite Database:**
   - Create a new SQLite database file named `genomeCRISPR.db` by running the following command:
     ```bash
     sqlite3 genomeCRISPR.db
     .exit
     ```

**Create the Database Tables:**
   - Use the `create_tables.sql` script to create the necessary tables in the database:
     ```bash
     sqlite3 genomeCRISPR.db < create_tables.sql
     ```

**Import the CSV Data:**
   - Open the SQLite database and import the trimmed CSV data into the database:
     ```bash
     sqlite3 genomeCRISPR.db
     .mode csv
     .separator ","
     .import /path/to/your/project/directory/genomeCRISPR_full_trimmed.csv csv_import
     .exit
     ```

**Insert Data:**
   - Run the `insert_data.sql` script to insert data into the database:
     ```bash
     sqlite3 genomeCRISPR.db < insert_data.sql
     ```

**Create Indexes:**
   - Finally, set up the necessary indexes in the database by running the `index.sql` script:
     ```bash
     sqlite3 genomeCRISPR.db < index.sql
     ```

---

Replace `/path/to/your/project/directory` with the actual path to your project directory on your Linux system. This guide provides a step-by-step process to set up your SQLite database directly on Linux.






## Running the Application

To start the application, follow these steps:

1. **Start the Server:**
   - Start the Node.js server:
     ```bash
     npm start
     ```

2. **Access the GUI:**
   - Open your web browser and navigate to `http://localhost:3000` to access the graphical user interface.

## Running Tests with Jest

This project uses Jest for testing the data models.


1. **Run the Tests:**
   - To execute the tests, run the following command in the terminal:
     ```bash
     npm test
     ```
   - Jest will automatically detect and run all test files in the project, typically those located in the `__tests__` directory or files with the `.test.js` or `.spec.js` extensions.

2. **View Test Results:**
   - After running the tests, Jest will display the results in the terminal, including which tests passed, failed, or were skipped.





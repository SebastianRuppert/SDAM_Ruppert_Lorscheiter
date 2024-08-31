let currentScreenPage = 1;  // Default page for screens
let currentSgPage = 1;    // Default page for sgRNAs
let currentScreenLimit = 10;  // Default limit for screens
let currentSgLimit = 10;      // Default limit for sgRNAs

// Function to handle the search request using api/gene/search
async function handleSearch(screenPage = currentScreenPage, screenLimit = currentScreenLimit, sgPage = currentSgPage, sgLimit = currentSgLimit, sortBy = 'pubmed', sortOrder = 'asc') {
    const query = document.getElementById('search-input').value;

    if (!query) {
        alert('Please enter a gene symbol or ENSEMBL ID.');
        return;
    }

    try {
        // Update the global variables with the current parameters
        currentScreenPage = screenPage;
        currentScreenLimit = screenLimit;
        currentSgPage = sgPage;
        currentSgLimit = sgLimit;

        const associatedResponse = await fetch(`/api/gene/search?query=${encodeURIComponent(query)}&screenPage=${screenPage}&screenLimit=${screenLimit}&sgPage=${sgPage}&sgLimit=${sgLimit}&sortBy=${sortBy}&sortOrder=${sortOrder}`);
        const associatedData = await associatedResponse.json();

        if (associatedResponse.ok) {
            handleApiResponse(associatedData);
            return associatedData; // Return the data for testing
        } else {
            alert(associatedData.error || 'Error fetching associated data');
        }
    } catch (error) {
        console.error('Error fetching data:', error);
        alert('An error occurred while fetching data.');
    }
}

// Function to handle the API response and call other display functions
function handleApiResponse(response) {
    const { genes, totalSgCount, totalScreenCount, sgs, screens } = response;

    // Attach sgRNAs to the corresponding genes
    genes.forEach(gene => {
        gene.sgs = sgs.filter(sg => sg.gene_id === gene.id);
    });

    // Display the gene data
    displayGeneData(genes);

    // Display sgRNAs with pagination
    displaySgs(sgs, currentSgLimit, currentSgPage, totalSgCount);

    // Display screens with pagination
    displayScreens(screens, currentScreenLimit, currentScreenPage, totalScreenCount);

    // Plot sgRNA effects for the retrieved genes
    plotSgEffects(genes);
}



// Utility function to create a table row
function createTableRow(data, columns) {
    const row = document.createElement('tr');
    columns.forEach(col => {
        const cell = document.createElement('td');
        cell.textContent = data[col] || 'N/A';
        row.appendChild(cell);
    });
    return row;
}

// Utility function to update the pagination controls
function updatePaginationControls(type, currentPage, totalCount, limit, updateFunction) {
    console.log('Update Function:', updateFunction);
    console.log('Total Count:', totalCount);
    const totalPages = Math.ceil(totalCount / limit);
    const paginationContainer = document.getElementById(`${type}-pagination`);
    paginationContainer.innerHTML = '';

    // Create pagination buttons
    function createButton(page, isActive, isDisabled) {
        const button = document.createElement('button');
        button.textContent = page;
        button.classList.add('pagination-button');
        if (isActive) button.classList.add('active');
        if (isDisabled) button.disabled = true;
        button.addEventListener('click', () => updateFunction(page));
        return button;
    }

    function createPrevButton() {
        return createButton('←', false, currentPage === 1);
    }

    function createNextButton() {
        return createButton('→', false, currentPage === totalPages);
    }

    // Handle the pagination logic for the number of pages
    if (totalPages <= 7) {
        paginationContainer.appendChild(createPrevButton());
        for (let page = 1; page <= totalPages; page++) {
            paginationContainer.appendChild(createButton(page, page === currentPage, false));
        }
        paginationContainer.appendChild(createNextButton());
    } else {
        paginationContainer.appendChild(createPrevButton());
        if (currentPage <= 4) {
            for (let page = 1; page <= 5; page++) {
                paginationContainer.appendChild(createButton(page, page === currentPage, false));
            }
            paginationContainer.appendChild(createButton('...', false, true));
            paginationContainer.appendChild(createButton(totalPages, false, false));
        } else if (currentPage >= totalPages - 3) {
            paginationContainer.appendChild(createButton(1, false, false));
            paginationContainer.appendChild(createButton('...', false, true));
            for (let page = totalPages - 4; page <= totalPages; page++) {
                paginationContainer.appendChild(createButton(page, page === currentPage, false));
            }
        } else {
            paginationContainer.appendChild(createButton(1, false, false));
            paginationContainer.appendChild(createButton('...', false, true));
            for (let page = currentPage - 2; page <= currentPage + 2; page++) {
                paginationContainer.appendChild(createButton(page, page === currentPage, false));
            }
            paginationContainer.appendChild(createButton('...', false, true));
            paginationContainer.appendChild(createButton(totalPages, false, false));
        }
        paginationContainer.appendChild(createNextButton());
    }
}




// Function to display gene data
function displayGeneData(genes) {
    if (!genes || !Array.isArray(genes) || genes.length === 0) {
        console.error('Gene data is missing or incorrect:', genes);
        return;
    }

    const geneHeader = document.getElementById('gene-header');
    geneHeader.innerHTML = '';  // Clear any previous content

    // Create a container for the symbol and ENSG grid
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.alignItems = 'flex-start';

    // Display the gene symbol
    const geneSymbol = genes[0].symbol;
    const symbolElement = document.createElement('h2');
    symbolElement.textContent = geneSymbol;
    symbolElement.style.marginRight = '20px';
    container.appendChild(symbolElement);

    // Create the ENSG grid
    const ensgContainer = createEnsgGrid(genes);
    container.appendChild(ensgContainer);

    geneHeader.appendChild(container);
}
// Function to create a grid of ENSG IDs
function createEnsgGrid(genes) {
    const totalEnsgs = genes.length;
    const maxColumns = 3; // Adjust the number of columns as needed
    const rowsPerColumn = Math.ceil(totalEnsgs / maxColumns);

    const ensgContainer = document.createElement('div');
    ensgContainer.style.display = 'grid';
    ensgContainer.style.gridTemplateColumns = `repeat(${maxColumns}, auto)`;
    ensgContainer.style.gap = '20px';

    let currentColumn;
    genes.forEach((gene, index) => {
        if (index % rowsPerColumn === 0) {
            currentColumn = document.createElement('ul');
            currentColumn.style.fontSize = '14px';
            currentColumn.style.listStyleType = 'none';
            currentColumn.style.paddingLeft = '0';
            currentColumn.style.margin = '0';
            ensgContainer.appendChild(currentColumn);
        }
        const listItem = document.createElement('li');
        listItem.textContent = gene.ensg;
        currentColumn.appendChild(listItem);
    });

    return ensgContainer;
}




// Function to display screens with pagination
function displayScreens(screens, limit, page, totalScreenCount) {
    const resultsBody = document.getElementById('results-body');
    resultsBody.innerHTML = ''; // Clear previous results

    console.log('Screens:', screens);
    console.log('Total screens:', totalScreenCount);

    screens.forEach((screen) => {
        const columns = ['pubmed', 'screentype', 'condition', 'cas', 'cellline'];
        const row = createTableRow(screen, columns);
        resultsBody.appendChild(row);
    });

    updatePaginationControls('screen', page, totalScreenCount, limit, (newPage) => {
        currentScreenPage = newPage;
        handleSearch(currentScreenPage, currentScreenLimit, currentSgPage, currentSgLimit);
    });
}



// Function to display sgRNAs with pagination
async function displaySgs(sgs, limit, page, totalSgCount) {
    const sgResultsBody = document.getElementById('sg-results-body');
    sgResultsBody.innerHTML = ''; // Clear previous results

    const uniqueSgs = getUniqueSgs(sgs);
    const effectValues = await fetchPhenData(uniqueSgs);

    let displayedRows = 0;

    for (let i = 0; i < uniqueSgs.length && displayedRows < limit; i++) {
        const sg = uniqueSgs[i];
        const effects = effectValues[sg.id] || [];
        const effectChunks = chunkArray(effects, 1); // Ensure each effect is in its own row

        for (const effectChunk of effectChunks) {
            if (displayedRows >= limit) break;
            const row = createSgRow(sg, effectChunk);
            sgResultsBody.appendChild(row);
            displayedRows++;
        }
    }

    updatePaginationControls('sg', page, totalSgCount, limit, (newPage) => {
        currentSgPage = newPage;
        handleSearch(currentScreenPage, currentScreenLimit, currentSgPage, currentSgLimit);
    });
}

// Function to divide an array into chunks
function chunkArray(arr, size) {
    const chunks = [];
    for (let i = 0; i < arr.length; i += size) {
        chunks.push(arr.slice(i, i + size));
    }
    return chunks;
}

function getUniqueSgs(sgs) {
    const uniqueSgsMap = new Map();
    sgs.forEach(sg => uniqueSgsMap.set(sg.id, sg));
    return Array.from(uniqueSgsMap.values());
}

async function fetchPhenData(uniqueSgs) {
    const sgIds = uniqueSgs.map(sg => sg.id).join(',');
    let effectValues = {};

    try {
        const phenResponse = await fetch(`/api/sg/phen?ids=${sgIds}`);
        if (phenResponse.ok) {
            const phenData = await phenResponse.json();
            phenData.forEach(phen => {
                if (!effectValues[phen.sgId]) {
                    effectValues[phen.sgId] = [];
                }
                effectValues[phen.sgId].push(phen);
            });
        }
    } catch (error) {
        console.error('Error fetching phen data:', error);
    }

    uniqueSgs.forEach(sg => {
        if (!effectValues[sg.id]) {
            effectValues[sg.id] = [];
        }
    });

    return effectValues;
}

// Function to create an sgRNA table row considering a specific chunk of effects
function createSgRow(sg, effectsChunk) {
    const row = document.createElement('tr');
    row.setAttribute('data-id', sg.id);

    const locationCell = createTableCell(`${sg.chr || 'N/A'}:${sg.start || 'N/A'}-${sg.end || 'N/A'}_${sg.strand || 'N/A'}`);
    const sequenceCell = createTableCell(sg.sequence ? sg.sequence.slice(0, -3) : 'N/A');
    const pamCell = createTableCell(sg.sequence ? sg.sequence.slice(-3) : 'N/A');
    const effectCell = createEffectCell(effectsChunk);
    const detailCell = createDetailCell(sg.id, sg.sequence);

    row.append(locationCell, sequenceCell, pamCell, effectCell, detailCell);
    return row;
}

function createTableCell(content) {
    const cell = document.createElement('td');
    cell.textContent = content;
    return cell;
}

// Function to create the effect cell for a specific chunk of effects
function createEffectCell(effectsChunk) {
    const effectContainer = document.createElement('div');
    effectContainer.className = 'effect-container';

    effectsChunk.forEach(phen => {
        const effectSpan = document.createElement('span');
        effectSpan.textContent = phen.effect || 'N/A';
        effectSpan.className = 'effect-clickable';
        effectContainer.appendChild(effectSpan);
        effectSpan.addEventListener('click', () => showModal(phen));
    });

    return effectContainer;
}

function createDetailCell(sgId, sequence) {
    const detailContainer = document.createElement('div');
    detailContainer.className = 'detail-container';

    const detailLink = document.createElement('a');
    detailLink.href = '#';
    detailLink.textContent = 'Detail';
    detailLink.className = 'detail-clickable';
    detailLink.addEventListener('click', (event) => {
        event.preventDefault();
        showModalWithPlot(sgId, sequence);
    });

    detailContainer.appendChild(detailLink);

    const detailCell = document.createElement('td');
    detailCell.appendChild(detailContainer);
    return detailCell;
}

function showModal(phen) {
    const modal = document.getElementById('info-modal');
    const modalContent = document.getElementById('modal-content');

    modalContent.innerHTML = `
        <h3>Effect details for sgRNA</h3>
        <p><strong>Effect:</strong> ${phen.effect || 'N/A'}</p>
        <p><strong>Log2fc:</strong> ${phen.log2fc || 'N/A'}</p>
        <p><strong>RC Initial:</strong> ${phen.rc_initial || 'N/A'}</p>
        <p><strong>RC Final:</strong> ${phen.rc_final || 'N/A'}</p>
    `;

    modal.style.display = 'block';

    const closeModalButton = document.querySelector('#info-modal .close');
    if (closeModalButton) {
        closeModalButton.onclick = () => {
            modal.style.display = 'none';
        };
    } else {
        console.error('Close modal button not found in modal content.');
    }
}












// Function to show the modal with plot
function showModalWithPlot(sgId, sequence) {
    const modal = document.getElementById('info-modal');
    const modalContent = document.getElementById('modal-content');

    // Ensure the canvas is only created once and reset any existing content
    modalContent.innerHTML = `
        <canvas id="plot-container" width="400" height="200"></canvas>
        <button class="close">&times;</button>
    `;

    // Initialize the plot
    plotEffectVsScreen(sgId, sequence);

    // Show the modal
    modal.style.display = 'block';

    // Attach event listener to the close button
    const closeModalButton = modalContent.querySelector('.close');
    if (closeModalButton) {
        closeModalButton.onclick = () => {
            modal.style.display = 'none';
        };
    } else {
        console.error('Close modal button not found in modal content.');
    }
}


// Function to plot sgRNA effects as a bar chart
let effectChart = null; // Variable to hold the current Chart instance

async function plotSgEffects(genes) {
    console.log('Received genes:', genes);
    if (!genes || !Array.isArray(genes)) {
        console.error('Invalid genes data:', genes);
        return;
    }

    const effects = [];
    const labels = [];
    const sgIds = [];

    // Collect all sgRNA IDs from all genes
    genes.forEach(gene => {
        if (gene.sgs) {  // Check if `sgs` exists
            gene.sgs.forEach(sg => {
                sgIds.push(sg.id);
            });
        } else {
            console.warn(`No sgRNAs found for gene ${gene.symbol} (${gene.ensg})`);
        }
    });

    if (sgIds.length === 0) {
        console.error('No sgRNA IDs found for the provided genes.');
        return;
    }

    try {
        // Fetch phen data for all sgRNAs in a single request
        const response = await fetch(`/api/sg/phen?ids=${sgIds.join(',')}`);
        if (response.ok) {
            const phenData = await response.json();

            // Create a map for easy lookup
            const phenMap = new Map();
            phenData.forEach(phen => {
                phenMap.set(phen.sgId, phen.effect || 0);
            });

            // Populate effects and labels
            sgIds.forEach(sgId => {
                const effect = phenMap.get(sgId) || 0; // Default to 0 if not found
                effects.push(effect);
                labels.push(sgId); // Use sg.id as a label
            });
        } else {
            console.error('Failed to fetch phen data:', response.statusText);
            // Default to 0 in case of error
            sgIds.forEach(sgId => {
                effects.push(0);
                labels.push(sgId);
            });
        }
    } catch (error) {
        console.error('Error fetching phen data:', error);
        // Handle error by defaulting to 0
        sgIds.forEach(sgId => {
            effects.push(0);
            labels.push(sgId);
        });
    }

    const ctx = document.getElementById('effect-chart').getContext('2d');

    // Destroy the existing Chart if it exists
    if (effectChart) {
        effectChart.destroy();
    }

    // Create a new Chart
    effectChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: `Effect of sgRNAs on ${genes[0].symbol}`, // Use the gene symbol from the first gene
                data: effects,
                backgroundColor: 'rgba(0,87,149,255)',
                borderColor: 'rgba(0,87,149,255)', 
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: false,
                    min: -9,
                    max: 9,
                    ticks: {
                        stepSize: 1
                    },
                    title: {
                        display: true,
                        text: 'Effect'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'sgRNA ID'
                    }
                }
            }
        }
    });
}




// Plot the effect vs screen data
const charts = {}; // Object to store chart instances

async function plotEffectVsScreen(sgId, sequence) {
    const canvasId = 'plot-container';
    
    // Check if a chart already exists for this canvas
    if (charts[canvasId]) {
        charts[canvasId].destroy(); // Destroy the existing chart
    }

    const ctx = document.getElementById(canvasId).getContext('2d');
    try {
        const response = await fetch(`/api/sg/screeneffect?sgId=${sgId}&sequence=${encodeURIComponent(sequence)}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch data: ${response.statusText}`);
        }

        const data = await response.json();

        // Ensure data is in the expected format
        if (!Array.isArray(data) || data.length === 0) {
            throw new Error('Unexpected data format or empty data');
        }

        const labels = data.map(item => item.screen_id); // Array of screen IDs or names
        const effects = data.map(item => item.effect);   // Array of effect values

        // Create a new Chart
        charts[canvasId] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Effect of sgRNA in different screens',
                    data: effects,
                    backgroundColor: 'rgba(0,87,149,255)',
                    borderColor: 'rgba(0,87,149,255)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Screen ID'
                        }
                    },
                    y: {
                        beginAtZero: false,
                        min: -9,
                        max: 9,
                        ticks: {
                            stepSize: 1
                        },
                        title: {
                            display: true,
                            text: 'Effect'
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)', // Tooltip background color
                        titleFont: {
                            size: 16, // Font size for tooltip title
                            weight: 'bold',
                        },
                        bodyFont: {
                            size: 14, // Font size for tooltip body
                        },
                        padding: 12, // Padding around tooltip content
                        boxPadding: 10, // Padding between text and edge of tooltip
                        callbacks: {
                            label: function(context) {
                                const index = context.dataIndex;
                                const item = data[index];

                                // Tooltip content
                                return [
                                    `Effect: ${item.effect}`,
                                    `Log2fc: ${item.log2fc !== undefined ? item.log2fc : 'N/A'}`,
                                    `PubMed ID: ${item.pubmed !== undefined ? item.pubmed : 'N/A'}`,
                                    `Cellline: ${item.cellline !== undefined ? item.cellline : 'N/A'}`
                                ];
                            }
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error fetching or plotting effect vs screen data:', error);
        document.getElementById(canvasId).innerHTML = '<p>Error loading plot.</p>';
    }
}


// Handle modal close
document.querySelector('.close').addEventListener('click', function() {
    document.getElementById('info-modal').style.display = 'none';
});




function getInputValue(id) {
    return document.getElementById(id).value.toLowerCase().trim();
}

function filterTable(rows, queries) {
    rows.forEach((row) => {
        let matches = true;

        queries.forEach(({ column, value, isEffect }) => {
            if (isEffect) {
                const effectSpans = row.children[column].querySelectorAll('span.effect-clickable');
                matches = matches && (value === '' || Array.from(effectSpans).some(span => span.textContent.toLowerCase().trim() === value));
            } else {
                const cellValue = row.children[column].textContent.toLowerCase().trim();
                matches = matches && (value === '' || cellValue.includes(value));
            }
        });

        row.style.display = matches ? '' : 'none';
    });
}





// Function to filter the sgRNA table based on search queries from header inputs
function filterSg() {
    const queries = [
        { column: 1, value: getInputValue('search-sequence') },
        { column: 3, value: getInputValue('search-effect'), isEffect: true }
    ];

    const rows = document.querySelectorAll('#sg-results-body tr');
    filterTable(rows, queries);
}

// Function to filter the screen table based on search queries from header inputs
function filterScreen() {
    const queries = [
        { column: 0, value: getInputValue('search-pubmed') },
        { column: 1, value: getInputValue('search-screentype') },
        { column: 2, value: getInputValue('search-condition') },
        { column: 3, value: getInputValue('search-cas') },
        { column: 4, value: getInputValue('search-cellline') }
    ];

    const rows = document.querySelectorAll('#results-body tr');
    filterTable(rows, queries);
}

// Function to sort the table based on the specified column and order
function sortTable(tableId, column, order, isEffectColumn = false) {
    const table = document.getElementById(tableId);
    if (!table) return;
    const tbody = table.querySelector('tbody');
    if (!tbody) return;

    const rows = Array.from(tbody.querySelectorAll('tr'));
    const index = column === 'sequence' ? 1 : 3;

    rows.sort((a, b) => {
        let comparison = 0;

        if (isEffectColumn) {
            const effectsA = Array.from(a.cells[index].querySelectorAll('span.effect-clickable')).map(span => parseFloat(span.textContent.trim()));
            const effectsB = Array.from(b.cells[index].querySelectorAll('span.effect-clickable')).map(span => parseFloat(span.textContent.trim()));
            const extremeA = order === 'asc' ? Math.min(...effectsA) : Math.max(...effectsA);
            const extremeB = order === 'asc' ? Math.min(...effectsB) : Math.max(...effectsB);
            comparison = extremeA - extremeB;
        } else {
            const cellValueA = a.cells[index].textContent.trim();
            const cellValueB = b.cells[index].textContent.trim();
            comparison = cellValueA.localeCompare(cellValueB);
        }

        return order === 'asc' ? comparison : -comparison;
    });

    rows.forEach(row => tbody.appendChild(row));
}




document.addEventListener('DOMContentLoaded', () => {
    let sortOrder = {
        sequence: 'asc',
        effect: 'asc',
    };

    // Event listeners for sorting
    document.querySelectorAll('[data-sort]').forEach(sortButton => {
        sortButton.addEventListener('click', () => {
            const column = sortButton.getAttribute('data-sort');
            const order = sortButton.getAttribute('data-order');
            const isEffectColumn = column === 'effect';
            sortTable('sg-results-table', column, order, isEffectColumn);
            sortOrder[column] = order;
            sortButton.setAttribute('data-order', order === 'asc' ? 'desc' : 'asc');
        });
    });

    // Initialize event listeners for search inputs
    const searchFields = [
        { id: 'search-pubmed', filterFunction: filterScreen },
        { id: 'search-screentype', filterFunction: filterScreen },
        { id: 'search-condition', filterFunction: filterScreen },
        { id: 'search-cas', filterFunction: filterScreen },
        { id: 'search-cellline', filterFunction: filterScreen },
        { id: 'search-sequence', filterFunction: filterSg },
        { id: 'search-effect', filterFunction: filterSg },
    ];

    searchFields.forEach(({ id, filterFunction }) => {
        document.getElementById(id).addEventListener('input', filterFunction);
    });

    // Initial call to apply filters based on initial input values
    filterScreen();
    filterSg();

    // Debounce function to prevent multiple triggers
    function debounceSearch(callback, delay = 300) {
        let debounceTimeout;
        return function() {
            const context = this;
            const args = arguments;
            clearTimeout(debounceTimeout);
            debounceTimeout = setTimeout(() => callback.apply(context, args), delay);
        };
    }

    // Unified search trigger function
    function triggerSearch() {
        const screenLimit = parseInt(document.getElementById('screen-results-per-page').value, 10) || 10;
        const sgLimit = parseInt(document.getElementById('sg-results-per-page').value, 10) || 10;

        handleSearch(0, screenLimit, 0, sgLimit);
    }

    // Event listener for the search button click
    document.getElementById('search-button').addEventListener('click', debounceSearch(triggerSearch));

    // Event listener for the "Enter" key press
    document.getElementById('search-input').addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            debounceSearch(triggerSearch)();
        }
    });

    // Results per page event listeners
    document.getElementById('screen-results-per-page').addEventListener('change', () => {
        currentScreenLimit = parseInt(document.getElementById('screen-results-per-page').value, 10);
        currentScreenPage = 1;  // Reset to the first page for screens
        handleSearch(currentScreenPage, currentScreenLimit, currentSgPage, currentSgLimit)
            .then(() => updatePaginationControls('screen', currentScreenPage, totalScreenCount, currentScreenLimit));
    });

    document.getElementById('sg-results-per-page').addEventListener('change', () => {
        currentSgLimit = parseInt(document.getElementById('sg-results-per-page').value, 10);
        currentSgPage = 1;  // Reset to the first page for sgRNAs
    
        handleSearch(currentScreenPage, currentScreenLimit, currentSgPage, currentSgLimit)
            .then((response) => {
                const { totalSgCount } = response;  // Extract totalSgCount from the response
                updatePaginationControls('sg', currentSgPage, totalSgCount, currentSgLimit);
            })
            .catch(error => {
                console.error('Error during search:', error);
            });
    });
    

    // Event listeners for search and pagination
    document.getElementById('search-button').addEventListener('click', debounceSearch(triggerSearch));
});

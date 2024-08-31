let currentSgPage = 1;    // Default page for sgRNAs
let currentSgLimit = 10;      // Default limit for sgRNAs

let currentSgSortBy = 'sequence'; // Default sort for sgRNA
let currentSgSortOrder = 'asc';   // Default order for sgRNA
let currentScreenSortBy = 'pubmed'; // Default sort for screens
let currentScreenSortOrder = 'asc'; // Default order for screens


// Function to handle the search request using api/gene/search
async function handleSearch(
    sgPage = currentSgPage,
    sgLimit = currentSgLimit,
    sgSortBy = 'sequence',  // Default to 'sequence'
    sgSortOrder = 'asc',    // Default to 'asc'
    screenSortBy = 'pubmed', // Default to 'pubmed'
    screenSortOrder = 'asc'  // Default to 'asc'
) {
    const query = document.getElementById('search-input').value;

    const screenFilters = {
        pubmed: getInputValue('search-pubmed'),
        screentype: getInputValue('search-screentype'),
        condition: getInputValue('search-condition'),
        cas: getInputValue('search-cas'),
        cellline: getInputValue('search-cellline')
    };

    const sgFilters = {
        sequence: getInputValue('search-sequence'),
        effect: getInputValue('search-effect')
    };

    if (!query) {
        alert('Please enter a gene symbol or ENSEMBL ID.');
        return;
    }

    try {
        const url = new URL('/api/gene/search', window.location.origin);
        url.searchParams.append('query', query);
        url.searchParams.append('sgPage', sgPage);
        url.searchParams.append('sgLimit', sgLimit);
        url.searchParams.append('sgSortBy', sgSortBy);
        url.searchParams.append('sgSortOrder', sgSortOrder);
        url.searchParams.append('screenSortBy', screenSortBy);
        url.searchParams.append('screenSortOrder', screenSortOrder);

        // Add filters to the query string
        Object.keys(screenFilters).forEach(key => {
            if (screenFilters[key]) {
                url.searchParams.append(key, screenFilters[key]);
            }
        });
        Object.keys(sgFilters).forEach(key => {
            if (sgFilters[key]) {
                url.searchParams.append(key, sgFilters[key]);
            }
        });

        console.log('Request URL:', url.toString());

        const associatedResponse = await fetch(url.toString());
        const associatedData = await associatedResponse.json();

        console.log('API Response:', associatedData);

        if (associatedResponse.ok) {
            handleApiResponse(associatedData, sgPage !== currentSgPage);
            return associatedData; // Return the data for use in pagination updates
        } else {
            alert(associatedData.error || 'Error fetching associated data');
        }
    } catch (error) {
        console.error('Error fetching data:', error);
        alert('An error occurred while fetching data.');
    }
}

// Function to handle the API response
function handleApiResponse(response) {
    const { genes, totalSgCount, sgs, screens } = response;

    console.log('Genes:', genes);
    console.log('sgRNAs:', sgs);
    console.log('Screens:', screens);
    console.log('Total sgRNAs:', totalSgCount);

    displayGeneData(genes);

    // Update sgRNA table
    displaySgs(sgs, currentSgLimit, currentSgPage, totalSgCount);
  
    // Display screens
    displayScreens(screens);
}




// Utility function to create a table cell
function createTableCell(content) {
    const cell = document.createElement('td');
    cell.textContent = content;
    return cell;
}

// Utility function to create a table row
function createTableRow(data, columns) {
    const row = document.createElement('tr');
    columns.forEach(col => {
        row.appendChild(createTableCell(data[col] || 'N/A'));
    });
    return row;
}

// Utility function to create a pagination button
function createPaginationButton(page, isActive, isDisabled, updateFunction) {
    const button = document.createElement('button');
    button.textContent = page;
    button.classList.add('pagination-button');
    if (isActive) button.classList.add('active');
    if (isDisabled) button.disabled = true;
    button.addEventListener('click', () => updateFunction(page));
    return button;
}

// Function to update pagination controls
function updatePaginationControls(type, currentPage, totalCount, limit, updateFunction) {
    const totalPages = Math.ceil(totalCount / limit);
    const paginationContainer = document.getElementById(`${type}-pagination`);
    paginationContainer.innerHTML = ''; // Clear the previous pagination controls

    paginationContainer.appendChild(createPaginationButton('←', false, currentPage === 1, () => updateFunction(currentPage - 1, totalCount)));

    if (totalPages <= 7) {
        for (let page = 1; page <= totalPages; page++) {
            paginationContainer.appendChild(createPaginationButton(page, page === currentPage, false, () => updateFunction(page, totalCount)));
        }
    } else {
        if (currentPage <= 4) {
            for (let page = 1; page <= 5; page++) {
                paginationContainer.appendChild(createPaginationButton(page, page === currentPage, false, () => updateFunction(page, totalCount)));
            }
            paginationContainer.appendChild(createPaginationButton('...', false, true));
            paginationContainer.appendChild(createPaginationButton(totalPages, false, false, () => updateFunction(totalPages, totalCount)));
        } else if (currentPage >= totalPages - 3) {
            paginationContainer.appendChild(createPaginationButton(1, false, false, () => updateFunction(1, totalCount)));
            paginationContainer.appendChild(createPaginationButton('...', false, true));
            for (let page = totalPages - 4; page <= totalPages; page++) {
                paginationContainer.appendChild(createPaginationButton(page, page === currentPage, false, () => updateFunction(page, totalCount)));
            }
        } else {
            paginationContainer.appendChild(createPaginationButton(1, false, false, () => updateFunction(1, totalCount)));
            paginationContainer.appendChild(createPaginationButton('...', false, true));
            for (let page = currentPage - 2; page <= currentPage + 2; page++) {
                paginationContainer.appendChild(createPaginationButton(page, page === currentPage, false, () => updateFunction(page, totalCount)));
            }
            paginationContainer.appendChild(createPaginationButton('...', false, true));
            paginationContainer.appendChild(createPaginationButton(totalPages, false, false, () => updateFunction(totalPages, totalCount)));
        }
    }
    paginationContainer.appendChild(createPaginationButton('→', false, currentPage === totalPages, () => updateFunction(currentPage + 1, totalCount)));
}





// Function to display gene data, including all associated ENSG IDs
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


// Function to update sgRNA pagination
function updateSgPage(newPage) {
    currentSgPage = newPage;
    handleSearch(
        currentSgPage,
        currentSgLimit,
        currentSgSortBy,
        currentSgSortOrder,
        currentScreenSortBy,
        currentScreenSortOrder
    ).then(response => {
        const { sgs, totalSgCount, screens } = response;
        displaySgs(sgs, currentSgLimit, currentSgPage, totalSgCount);
        displayScreens(screens);
        updatePaginationControls('sg', currentSgPage, totalSgCount, currentSgLimit, updateSgPage);
    }).catch(error => console.error('Error updating sgRNA pagination:', error));
}


// TABLES
// Function to display screens
function displayScreens(screens) {
    const resultsBody = document.getElementById('results-body');
    resultsBody.innerHTML = ''; // Clear previous results

    console.log('Displaying screens:', screens);

    screens.forEach((screen) => {
        const columns = ['pubmed', 'screentype', 'condition', 'cas', 'cellline'];
        const row = createTableRow(screen, columns);
        resultsBody.appendChild(row);
    });
}


// Function to display sgRNAs with pagination
async function displaySgs(sgs, limit, page, totalSgCount) {
    const sgResultsBody = document.getElementById('sg-results-body');
    sgResultsBody.innerHTML = ''; // Clear previous results

    const uniqueSgs = getUniqueSgs(sgs);
    const effectValues = await fetchPhenData(uniqueSgs);

    uniqueSgs.slice(0, limit).forEach(sg => {
        const effects = effectValues[sg.id] || [];
        const row = createSgRow(sg, effects);
        sgResultsBody.appendChild(row);
    });

    updatePaginationControls('sg', page, totalSgCount, limit, updateSgPage);
}

// Function to get unique sgRNAs by ID
function getUniqueSgs(sgs) {
    const uniqueSgsMap = new Map();
    sgs.forEach(sg => uniqueSgsMap.set(sg.id, sg));
    return Array.from(uniqueSgsMap.values());
}

// Function to fetch phen data for unique sgRNAs
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
function createSgRow(sg, effects) {
    const row = document.createElement('tr');
    row.setAttribute('data-id', sg.id);

    const locationCell = createTableCell(`${sg.chr || 'N/A'}:${sg.start || 'N/A'}-${sg.end || 'N/A'}_${sg.strand || 'N/A'}`);
    const sequenceCell = createTableCell(sg.sequence ? sg.sequence.slice(0, -3) : 'N/A');
    const pamCell = createTableCell(sg.sequence ? sg.sequence.slice(-3) : 'N/A');
    const effectCell = createEffectCell(effects); // Pass all effects to be displayed in the same cell
    const detailCell = createDetailCell(sg.id, sg.sequence);

    row.append(locationCell, sequenceCell, pamCell, effectCell, detailCell);
    return row;
}



// Function to create the effect cell
function createEffectCell(effects) {
    const effectContainer = document.createElement('div');
    effectContainer.className = 'effect-container';

    effects.forEach(phen => {
        const effectSpan = document.createElement('span');
        effectSpan.textContent = phen.effect || 'N/A';
        effectSpan.className = 'effect-clickable';
        effectContainer.appendChild(effectSpan);
        effectSpan.addEventListener('click', () => showModal(phen));
    });

    return effectContainer;
}

// Function to create the detail cell for a specific sgRNA
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

// Function to show the modal with effect details
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




// PLOT
// Function to show the modal with plot
function showModalWithPlot(sgId, sequence) {
    const modal = document.getElementById('info-modal');
    const modalContent = document.getElementById('modal-content');

    // Ensure the canvas is only created once and reset any existing content
    modalContent.innerHTML = `
        <canvas id="plot-container" width="400" height="200"></canvas>
    `;

    // Initialize the plot
    plotEffectVsScreen(sgId, sequence);

    // Show the modal
    modal.style.display = 'block';
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


// Sorting and filtering
// Function to get the value of an input field
function getInputValue(id) {
    return document.getElementById(id).value.toLowerCase().trim();
}

document.addEventListener('DOMContentLoaded', () => {
    let sortOrder = {
        sg: { sequence: 'asc', effect: 'asc' },
        screen: { pubmed: 'asc', screentype: 'asc', condition: 'asc', cas: 'asc', cellline: 'asc' },
    };

    // Function to trigger a new search with sorting
function triggerSort(type, column) {
    const order = sortOrder[type][column];
    console.log(`Triggering sort for ${type} by ${column} in ${order} order`);
    if (type === 'sg') {
        currentSgSortBy = column;
        currentSgSortOrder = order;
        
        // Call handleSearch with the updated sort parameters, toggling the order
        handleSearch(
            currentSgPage,
            currentSgLimit,
            currentSgSortBy,  
            currentSgSortOrder, 
            currentScreenSortBy,
            currentScreenSortOrder
        ).then(() => {
            sortOrder[type][column] = order === 'asc' ? 'desc' : 'asc';
        });
    } else if (type === 'screen') {
        currentScreenSortBy = column;
        currentScreenSortOrder = order;

        handleSearch(
            currentSgPage,
            currentSgLimit,
            currentSgSortBy,
            currentSgSortOrder,
            currentScreenSortBy, 
            currentScreenSortOrder 
        ).then(() => {
            sortOrder[type][column] = order === 'asc' ? 'desc' : 'asc';
        });
    }
}

    
    
    
// SEARCHING
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
    const sgLimit = parseInt(document.getElementById('sg-results-per-page').value, 10) || 10;

    // Call handleSearch
    handleSearch(0, sgLimit)
        .then(response => {
            const { totalSgCount } = response || {};
            updatePaginationControls('sg', currentSgPage, totalSgCount, currentSgLimit);
        })
        .catch(error => {
            console.error('Error during search:', error);
        });
}


    // Event listeners for sorting
    document.querySelectorAll('[data-sort-sg]').forEach(sortButton => {
        sortButton.addEventListener('click', () => {
            const column = sortButton.getAttribute('data-sort-sg');
            triggerSort('sg', column);
        });
    });

    document.querySelectorAll('[data-sort-screen]').forEach(sortButton => {
        sortButton.addEventListener('click', () => {
            const column = sortButton.getAttribute('data-sort-screen');
            triggerSort('screen', column);
        });
    });

    // Initialize event listeners for search inputs
    const searchFields = [
        { id: 'search-pubmed', filterFunction: triggerSearch },
        { id: 'search-screentype', filterFunction: triggerSearch },
        { id: 'search-condition', filterFunction: triggerSearch },
        { id: 'search-cas', filterFunction: triggerSearch },
        { id: 'search-cellline', filterFunction: triggerSearch },
        { id: 'search-sequence', filterFunction: triggerSearch },
        { id: 'search-effect', filterFunction: triggerSearch },
    ];

    searchFields.forEach(({ id, filterFunction }) => {
        document.getElementById(id).addEventListener('input', debounceSearch(filterFunction));
    });

    // Event listener for the search button click
    document.getElementById('search-button').addEventListener('click', debounceSearch(triggerSearch));

    // Event listener for the "Enter" key press
    document.getElementById('search-input').addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            debounceSearch(triggerSearch)();
        }
    });

    // Handle separate pagination for sg data
    document.getElementById('sg-results-per-page').addEventListener('change', () => {
        currentSgLimit = parseInt(document.getElementById('sg-results-per-page').value, 10);
        currentSgPage = 1;  // Reset to the first page for sgRNAs
        handleSearch(currentSgPage, currentSgLimit);
    });
});

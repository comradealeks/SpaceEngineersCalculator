// Global state
let largeBlocksOnly = true;
let smallBlocksOnly = true;
let currentFileName = 'all'; // tracks the currently loaded category

// Utility function to fetch and handle JSON response
async function fetchData(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Error fetching data from ${url}`);
    return response.json();
}

// Fetch file names (categories) and blocks by fileName
const fetchFileNames = () => fetchData('/files');
const fetchBlocksByFileName = (fileName) => fetchData(`/blocks?filename=${encodeURIComponent(fileName)}`);
const fetchAllBlocks = () => fetchData('/blocks');
const fetchBlockDetails = (blockId) => fetchData(`/block/${blockId}`);
const fetchBlockComponents = (displayName, grid) => fetchData(`/block/${displayName}/${grid}/components`);

// Format display names for readability
function formatDisplayName(displayName) {
    return displayName
        .replace(/([A-Z])/g, ' $1')
        .replace(/(\d+)/g, ' $1 ')
        .replace(/(\d)x(\d)/g, ' $1 x $2 ')
        .trim();
}

// Display file names (categories) on the sidebar
function displayFileNames() {
    fetchFileNames().then(fileNames => {
        const fileList = document.getElementById('file-list');
        fileList.innerHTML = '<li data-filename="all">All Blocks</li>'; // All blocks category
        fileNames.forEach(file => {
            fileList.innerHTML += `<li data-filename="${file.FileName}">${file.FileName}</li>`;
        });
        addFileClickListeners(); // Attach event listeners to file names
    });
}

// Handle file/category clicks and changes
function addFileClickListeners() {
    document.querySelectorAll('#file-list li').forEach(item => {
        item.addEventListener('click', () => handleFileClick(item.getAttribute('data-filename')));
    });
}

function handleFileClick(fileName) {
    if (fileName === currentFileName) return;
    currentFileName = fileName;
    (fileName === 'all' ? fetchAllBlocks() : fetchBlocksByFileName(fileName))
        .then(displayBlocks)
        .catch(error => console.error(`Error fetching blocks for ${fileName}:`, error));
}

// Display blocks in the grid with filtering
function displayBlocks(blocks) {
    const blockGrid = document.getElementById('block-grid');
    blockGrid.innerHTML = '';

    const blockMap = new Map();
    blocks.forEach(block => {
        if (!blockMap.has(block.DisplayName)) blockMap.set(block.DisplayName, new Set());
        blockMap.get(block.DisplayName).add(block.CubeSize);
    });

    blocks
        .filter(block => (largeBlocksOnly && block.CubeSize === 'Large') || (smallBlocksOnly && block.CubeSize === 'Small'))
        .sort((a, b) => a.DisplayName.localeCompare(b.DisplayName))
        .forEach(block => {
            const blockElement = document.createElement('div');
            blockElement.classList.add('block');
            const hasAlternativeSize = blockMap.get(block.DisplayName).size > 1;
            blockElement.innerHTML = `
                <img src="data:image/png;base64,${block.Icon}" alt="${block.DisplayName}">
                <div>${formatDisplayName(block.DisplayName)}</div>
                ${hasAlternativeSize ? `<div>${block.CubeSize} Grid</div>` : ''}
            `;
            blockElement.addEventListener('click', () => displayBlockDetails(block.BlockID, block.DisplayName));
            blockGrid.appendChild(blockElement);
        });
}

// Display block details with components
function displayBlockDetails(blockId, displayName) {
    fetchBlockDetails(blockId).then(block => {
        const detailsSection = document.getElementById('block-details');
        detailsSection.innerHTML = `
            <h2>${block.DisplayName}</h2>
            <p>Type ID: ${block.TypeID}</p>
            <p>Subtype ID: ${block.SubtypeID}</p>
            <p>Cube Size: ${block.CubeSize}</p>
            <p>Dimensions: ${block.SizeX} x ${block.SizeY} x ${block.SizeZ}</p>
            <h3>Components Needed:</h3>
            <ul id="components-list"></ul>
        `;
        fetchBlockComponents(displayName, block.CubeSize)
            .then(components => {
                const componentsList = document.getElementById('components-list');
                componentsList.innerHTML = components.map(c => `<li>${c.ComponentName}: ${c.Quantity}</li>`).join('');
            })
            .catch(error => {
                console.error('Error fetching block components:', error);
                document.getElementById('components-list').innerHTML = '<li>Error loading components</li>';
            });
    }).catch(error => console.error('Error fetching block details:', error));
}

// Search functionality
document.getElementById('search-bar').addEventListener('input', event => {
    const searchTerm = event.target.value.toLowerCase();
    fetchAllBlocks().then(blocks => {
        const filteredBlocks = blocks.filter(block => formatDisplayName(block.DisplayName).toLowerCase().includes(searchTerm));
        displayBlocks(filteredBlocks);
    }).catch(error => console.error('Error fetching blocks for search:', error));
});

// Combined event listener for block size filtering
document.querySelectorAll('#large-blocks, #small-blocks').forEach(checkbox => {
    checkbox.addEventListener('change', () => {
        // Update global state based on checkbox values
        largeBlocksOnly = document.getElementById('large-blocks').checked;
        smallBlocksOnly = document.getElementById('small-blocks').checked;
        
        // Fetch and display blocks again based on the current file category and size filters
        (currentFileName === 'all' ? fetchAllBlocks() : fetchBlocksByFileName(currentFileName))
            .then(displayBlocks)
            .catch(error => console.error('Error reloading blocks after filter change:', error));
    });
});


// Initial page load setup
document.addEventListener('DOMContentLoaded', () => {
    displayFileNames();
    fetchAllBlocks().then(displayBlocks).catch(error => console.error('Error fetching all blocks on load:', error));
});

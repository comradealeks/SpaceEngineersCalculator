// public/databaseClient.js

// Fetch all FileNames (categories)
async function fetchFileNames() {
    const response = await fetch('/files');
    const data = await response.json();
    return data;
}

// Fetch blocks by FileName
async function fetchBlocksByFileName(fileName) {
    const response = await fetch(`/blocks?filename=${encodeURIComponent(fileName)}`);
    const data = await response.json();
    return data;
}

// Fetch block details by BlockID
async function fetchBlockDetails(blockId) {
    const response = await fetch(`/block/${blockId}`);
    const data = await response.json();
    return data;
}

// Display file names (categories) on the sidebar
function displayFileNames() {
    fetchFileNames().then(fileNames => {
        const fileList = document.getElementById('file-list');
        fileList.innerHTML = ''; // Clear existing items

        // Create "All Blocks" list item
        const allBlocksItem = document.createElement('li');
        allBlocksItem.textContent = 'All Blocks';
        allBlocksItem.setAttribute('data-filename', 'all');
        allBlocksItem.addEventListener('click', () => handleFileClick('all')); // Attach event listener
        fileList.appendChild(allBlocksItem);

        // Create list items for each file name (category)
        fileNames.forEach(file => {
            const fileItem = document.createElement('li');
            fileItem.textContent = file.FileName;
            fileItem.setAttribute('data-filename', file.FileName);
            fileItem.addEventListener('click', () => handleFileClick(file.FileName));
            fileList.appendChild(fileItem);
        });
    });
}



// Function to fetch all blocks
async function fetchAllBlocks() {
    try {
        const response = await fetch('/blocks'); // No filename query param is passed for "All Blocks"
        if (!response.ok) {
            throw new Error('Could not load blocks from the database.');
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error(error);
        alert('Error fetching all blocks.');
    }
}

// Handle clicking on a file name
let currentFileName = 'all'; // Track the currently loaded filename
function handleFileClick(fileName) {
    if (fileName == currentFileName) {
        // If the fileName clicked is already loaded, do nothing
        return;
    }
    currentFileName = fileName; // Update the current filename
    if (fileName == 'all') {
        // Fetch all blocks when "All Blocks" is clicked
        fetchAllBlocks().then(displayBlocks).catch(error => {
            console.error('Error fetching all blocks:', error);
        });
    } else {
        // Fetch blocks filtered by filename
        fetchBlocksByFileName(fileName).then(displayBlocks).catch(error => {
            console.error('Error fetching blocks by filename:', error);
        });
    }
}


// Display blocks in the grid
function displayBlocks(blocks) {
    const blockGrid = document.getElementById('block-grid');
    blockGrid.innerHTML = ''; // Clear current blocks
    
    blocks.forEach(block => {
        const blockElement = document.createElement('div');
        blockElement.classList.add('block');
        
        // Ensure the icon is in base64 and display it
        blockElement.innerHTML = `
            <img src="data:image/png;base64,${block.Icon}" alt="${block.DisplayName}">
            <p>${block.DisplayName}</p>
        `;
        blockElement.addEventListener('click', () => displayBlockDetails(block.BlockID, block.DisplayName));
        blockGrid.appendChild(blockElement);
    });
}


// Display block details
function displayBlockDetails(blockId, DisplayName) {
    // Fetch block details
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
        // Fetch and display components
        fetchBlockComponents(DisplayName).then(components => {
            const componentsList = document.getElementById('components-list');
            components.forEach(component => {
                const componentItem = document.createElement('li');
                componentItem.textContent = `${component.ComponentName}: ${component.Quantity}`;
                componentsList.appendChild(componentItem);
            });
        }).catch(error => {
            console.error('Error fetching block components:', error);
            const componentsList = document.getElementById('components-list');
            componentsList.innerHTML = '<li>Error loading components</li>';
        });
    }).catch(error => {
        console.error('Error fetching block details:', error);
    });
}

// Fetch block components by BlockID
async function fetchBlockComponents(DisplayName) {
    const response = await fetch(`/block/${DisplayName}/components`);
    if (!response.ok) {
        throw new Error('Could not load components from the database.');
    }
    const data = await response.json();
    return data;
}


// Initial call to display file names
document.addEventListener('DOMContentLoaded', () => {
    displayFileNames(); // Display the categories on page load
    fetchAllBlocks().then(displayBlocks).catch(error => {
        console.error('Error fetching all blocks:', error);
    });
});


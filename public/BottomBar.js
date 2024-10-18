var BottomList = [];
var activeButton = null;

// Entry function to determine what to display in the bottom list
function CompOrBlock() {
    const selectedList = checkActiveButton();
    BottomListDisplay(selectedList, activeButton == "components-button");
}

// Adds or removes a block and its components 
async function updateBottomList(BlockName, BlockGrid, Action, BlockID) {
    let blockExists = false;

    // Go through every list item until end or until you find a similar block
    for (let i = 0; i < BottomList.length; i++) {
        let block = BottomList[i];
        if (block.name == BlockName && block.grid == BlockGrid) {
            // If the block exists, update the quantity
            if (Action) {
                block.quantity += 1;
            } else {
                block.quantity -= 1;
            }

            // If the quantity is <= 0, remove the block from the list
            if (block.quantity <= 0) {
                console.log(`Removing block: ${BlockName}`);
                BottomList.splice(i, 1);
            }
            blockExists = true;
            break;
        }
    }

    // If the block is not in the list, fetch its components and add it
    if (Action == 1 && !blockExists) {   
        try {
            const components = await fetchBlockComponents(BlockName, BlockGrid);
            const blockDetails = await fetchBlockDetails(BlockID);
            
            BottomList.push({
                name: BlockName,
                grid: BlockGrid,
                quantity: 1,
                blockId: blockDetails.BlockID, 
                components: components.map(c => ({
                    name: c.ComponentName,
                    quantity: c.Quantity
                }))
            });
        } catch (error) {
            console.error(`Error fetching components for block ${BlockName}:`, error);
        }
    }
    CompOrBlock();
}

async function AddBPToBottomList(blockCounts) {
    BottomList = [];
    for (let id = 0; id < blockCounts.length; id++) {
        console.log(blockCounts[id].subtype)
        const blockDetails = await fetchBlockDetailsBySubtype(blockCounts[id].subtype);
        const components = await fetchBlockComponents(blockDetails.DisplayName, blockDetails.CubeSize);
        
        BottomList.push({
            name: blockDetails.DisplayName,
            grid: blockDetails.CubeSize,
            quantity: blockCounts[id].count,
            blockId: blockDetails.BlockID,
            components: components.map(c => ({
                name: c.ComponentName,
                quantity: c.Quantity
            }))
        });
    }
    CompOrBlock() 

}

// Checks which button is active and returns the corresponding list
function checkActiveButton() {
    return activeButton == "components-button" ? getComponentsFromBottomList() : BottomList;
}

// Extracts all components from blocks in the bottom list
function getComponentsFromBottomList() {
    let components = [];
    
    BottomList.forEach(block => {
        // Iterate through the block's components according to the block's quantity
        for (let i = 0; i < block.quantity; i++) {
            block.components.forEach(component => {
                const existingComponent = components.find(c => c.name === component.name);
                if (existingComponent) {
                    existingComponent.quantity += component.quantity;
                } else {
                    components.push({ name: component.name, quantity: component.quantity });
                }
            });
        }
    });
    return components;
}

// function to display blocks and components
function BottomListDisplay(list, isComponentList) {
    const ExpandedContentSection = document.getElementById('bottom-expanded-content');
    
    // Clear previous content
    ExpandedContentSection.innerHTML = '';

    // Check if the list is empty
    if (list.length == 0) {
        console.log("No items to display in the bottom list.");
        return;
    }
    // Iterate over the list and append elements
    list.forEach(entity => {
        const fetchDetails = isComponentList 
            ? fetchComponentDetails(entity.name)
            : fetchBlockDetails(entity.blockId); 

        fetchDetails.then(item => {
            const BottomBlockElement = createBottomListElement(item, entity.quantity, isComponentList, entity.blockId, entity.name);
            ExpandedContentSection.appendChild(BottomBlockElement); 
        }).catch(error => {
            console.error('Error fetching details:', error); 
        });
    });
}

// Ensure the createBottomListElement correctly handles the display
function createBottomListElement(item, quantity, isComponentList, blockId, name) {
    const BottomBlockElement = document.createElement('div');
    BottomBlockElement.classList.add('bottom-bar-block');

    const displayName = isComponentList ? item.ComponentName : item.DisplayName;
    const displayText = `${formatDisplayName(displayName)}: ${quantity}`; 

    // Create the HTML structure for each block/component
    BottomBlockElement.innerHTML = `
        <img src="data:image/png;base64,${item.Icon}" alt="${displayName}">
        <div>${displayText}</div>
    `;

    // Handle block-specific actions (only if it's a block, not a component)
    if (!isComponentList) {
        BottomBlockElement.addEventListener('contextmenu', (event) => {
            event.preventDefault();
            updateBottomList(name, item.CubeSize, false, blockId); 
        });
    }

    return BottomBlockElement;
}

// Handles setting the active button and toggling the active state class
function setActiveButton(activeId, inactiveId) {
    activeButton = activeId;
    document.getElementById(activeId).classList.add("active");
    document.getElementById(inactiveId).classList.remove("active");
    CompOrBlock();
}

// Function to sort the BottomList by name alphabetically
function sortBottomList() {
    console.log(BottomList);
    BottomList.sort((a, b) => {
        const nameA = a.name.toLowerCase();
        const nameB = b.name.toLowerCase();
        if (nameA < nameB) return -1;
        if (nameA > nameB) return 1;
        return 0;
    });
}


// Event listeners for buttons
document.getElementById("blocks-button").addEventListener("click", () => {
    setActiveButton("blocks-button", "components-button");
});

document.getElementById("components-button").addEventListener("click", () => {
    setActiveButton("components-button", "blocks-button");
});

// Event listener for search input to filter results
document.getElementById('bottom-bar-search').addEventListener('input', () => {
    // Re-display the list when the search query changes
    const selectedList = checkActiveButton();
    BottomListDisplay(selectedList, activeButton == "components-button");
});

// Toggle the bottom bar expansion
document.getElementById('bottom-bar-arrow').addEventListener('click', function() {
    const bottomBar = document.getElementById('bottom-bar');
    bottomBar.classList.toggle('expanded');

    // Wait for the CSS transition to finish before scrolling (e.g., 500ms to match CSS transition time)
    setTimeout(() => {
        if (bottomBar.classList.contains('expanded')) {
            bottomBar.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
    }, 500);
});

// Event listener for sort button to sort the list
document.getElementById('sort-button').addEventListener('click', () => {
    sortBottomList();
    CompOrBlock(); 
});



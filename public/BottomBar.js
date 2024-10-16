// Arrays to store block and component data
var BottomListArray = [];
var ComponentsListArray = [];
var activeButton = null;

// Entry function to determine what to display in the bottom list
function CompOrBlock() {
    const selectedList = checkActiveButton();
    if (activeButton === "components-button") {
        // Display components if the "Components" button is active
        BottomListComponents().then(components => {
            BottomListDisplay(components, true); // Pass 'true' to indicate it's a component list
        });
    } else {
        // Otherwise, display blocks
        BottomListDisplay(selectedList, false); // Pass 'false' to indicate it's a block list
    }
}

//Adds any block that is right clicked into the array
function BottomListBlocks(BlockName, BlockGrid, Action) {
    let IsNew = true;
    //go through every list item until end or until you find a similar one.
    BottomListArray.forEach((Block, index) => {
        //If block is found:
        if (Block[0] == BlockName && Block[1] == BlockGrid) {
            //Add or remove one
            if (Action) {
                Block[2] = Block[2] + 1; 
            } else if (!Action) {
                Block[2] = Block[2] - 1; 
            }

            //If less or equal to zero delete 
            if (Block[2] <= 0) {BottomListArray.splice(index, 1);};
            IsNew = false;
        };
    });
    //If not in list, push it in like: [[block, grid, number]]
    if (Action == 1 && IsNew) {
        BottomListArray.push([BlockName, BlockGrid, 1])
    };
    CompOrBlock()
}

// Checks which button is active and returns the corresponding list
function checkActiveButton() {
    return activeButton === "components-button" ? ComponentsListArray : BottomListArray;
}

// Fetches and displays the block or component list in the bottom section
function BottomListDisplay(list, isComponentList) {
    const ExpandedContentSection = document.getElementById('bottom-expanded-content');
    ExpandedContentSection.innerHTML = '';

    list.forEach((entity) => {
        const fetchDetails = isComponentList 
            ? fetchComponentDetails(entity[0]) 
            : fetchBlockDetails(entity[0]);

        fetchDetails.then(item => {
            const BottomBlockElement = createBottomListElement(item, isComponentList);
            ExpandedContentSection.appendChild(BottomBlockElement);
        }).catch(error => console.error('Error fetching details:', error));
    });
}

// Creates an element for the bottom list, either for a block or a component
function createBottomListElement(item, isComponentList) {
    const BottomBlockElement = document.createElement('div');
    BottomBlockElement.classList.add('bottom-bar-block');

    const icon = isComponentList ? item.Icon : item.Icon; // Adjust if needed
    const displayName = isComponentList ? item.ComponentName : item.DisplayName;

    BottomBlockElement.innerHTML = `
        <img src="data:image/png;base64,${icon}">
        <div>${formatDisplayName(displayName)}</div>
    `;

    // Attach event listeners for click and contextmenu actions
    BottomBlockElement.addEventListener('click', () => displayBlockDetails(item.BlockID, displayName));
    if (!isComponentList) {
        BottomBlockElement.addEventListener('contextmenu', (event) => {
            event.preventDefault();
            BottomListBlocks(item.BlockID, item.CubeSize, false);
        });
    }

    return BottomBlockElement;
}

// Fetches and aggregates all components for blocks in the bottom list
async function BottomListComponents() {
    ComponentsListArray = [];

    for (const entity of BottomListArray) {
        const blockId = entity[0];
        try {
            const block = await fetchBlockDetails(blockId);
            const { DisplayName, CubeSize } = block;
            const components = await fetchBlockComponents(DisplayName, CubeSize);

            components.forEach(component => {
                const existingComponent = ComponentsListArray.find(
                    (item) => item[0] === component.ComponentName
                );

                if (existingComponent) {
                    existingComponent[1] += component.Quantity;
                } else {
                    ComponentsListArray.push([component.ComponentName, component.Quantity]);
                }
            });
        } catch (error) {
            console.error('Error fetching block details or components:', error);
        }
    }

    return ComponentsListArray;
}

// Handles setting the active button and toggling the active state class
function setActiveButton(activeId, inactiveId) {
    activeButton = activeId;
    document.getElementById(activeId).classList.add("active");
    document.getElementById(inactiveId).classList.remove("active");
    CompOrBlock(); // Refresh the display when the active button changes
}

// Event listeners for buttons
document.getElementById("blocks-button").addEventListener("click", () => {
    setActiveButton("blocks-button", "components-button");
    console.log("Blocks button is active");
});

document.getElementById("components-button").addEventListener("click", () => {
    setActiveButton("components-button", "blocks-button");
    console.log("Components button is active");
});

// Toggle the bottom bar expansion
document.getElementById('bottom-bar-arrow').addEventListener('click', function() {
    document.getElementById('bottom-bar').classList.toggle('expanded');
});

let viewpoint = "side"; // Default viewpoint: right side view
let layeredView = false;
let currentLayer = 50; // Default layer is the middle layer
let xmlDoc = null; // Store the XML document globally
let minAxisValue = 0;
let maxAxisValue = -0;

// Function to handle blueprint file upload and process its content
async function handleBlueprintUpload(file) {
    const reader = new FileReader();
    reader.onload = function(event) {
        const blueprintContent = event.target.result;
        const parser = new DOMParser();
        xmlDoc = parser.parseFromString(blueprintContent, "text/xml");

        const blockCounts = getBlockCountsAndPositions(xmlDoc);
        console.log("Block counts by subtype:", blockCounts);
        AddBPToBottomList(blockCounts);

        visualizeBlockPositions();
    };
    reader.readAsText(file);
}

// Combine block counts and position extraction into one function
function getBlockCountsAndPositions(xmlDoc) {
    const blockCounts = {};
    const positions = [];
    const cubeGrids = xmlDoc.getElementsByTagName("CubeGrid");

    for (let i = 0; i < cubeGrids.length; i++) {
        const blocks = cubeGrids[i].getElementsByTagName("MyObjectBuilder_CubeBlock");

        for (let j = 0; j < blocks.length; j++) {
            const block = blocks[j];
            
            // Get block subtype and count
            const subtype = block.getElementsByTagName("SubtypeName")[0]?.textContent;
            if (subtype) blockCounts[subtype] = (blockCounts[subtype] || 0) + 1;

            // Extract position
            const minElement = block.getElementsByTagName("Min")[0];
            if (minElement) {
                const x = parseFloat(minElement.getAttribute("x"));
                const y = parseFloat(minElement.getAttribute("y"));
                const z = parseFloat(minElement.getAttribute("z"));
                positions.push({ x, y, z });
            }
        }
    }
    // Calculate axis range once during the extraction
    calculateAxisRange(positions);
    const blockArray = Object.entries(blockCounts).map(([subtype, count]) => ({ subtype, count }));
    return blockArray;
}

// Part 2: Visualize block positions in 2D with different viewpoints and layered mode
function visualizeBlockPositions() {
    const positions = extractPositions();
    const scaleFactor = calculateScaleFactor(positions);

    if (layeredView) {
        const rawLayerValue = currentLayer / 100 * (maxAxisValue - minAxisValue) + minAxisValue;
        const layerValue = findClosestAxisValue(positions, rawLayerValue);
        const filteredPositions = filterPositionsByExactLayer(positions, layerValue);
        draw2DVisualization(filteredPositions, scaleFactor);
    } else {
        draw2DVisualization(positions, scaleFactor);
    }
}

// Extract positions for visualization
function extractPositions() {
    const positions = [];
    const cubeGrids = xmlDoc.getElementsByTagName("CubeGrid");

    for (let i = 0; i < cubeGrids.length; i++) {
        const blocks = cubeGrids[i].getElementsByTagName("MyObjectBuilder_CubeBlock");
        for (let j = 0; j < blocks.length; j++) {
            const minElement = blocks[j].getElementsByTagName("Min")[0];
            if (minElement) {
                const x = parseFloat(minElement.getAttribute("x"));
                const y = parseFloat(minElement.getAttribute("y"));
                const z = parseFloat(minElement.getAttribute("z"));
                positions.push({ x, y, z });
            }
        }
    }
    return positions;
}

// Filter positions to show only those with the exact axis value corresponding to the "depth" axis
function filterPositionsByExactLayer(positions, layerValue) {
    return positions.filter(pos => {
        const axisValue = getAxisValue(pos);
        return Math.abs(axisValue - layerValue) < 0.001;
    });
}

// Get the axis value based on the viewpoint
function getAxisValue(pos) {
    switch (viewpoint) {
        case "side": return pos.z;
        case "front": return pos.x;
        case "top": return pos.y;
        default: return pos.z;
    }
}

// Function to find the closest axis value to the given rawLayerValue (for the depth axis)
function findClosestAxisValue(positions, rawLayerValue) {
    let closestValue = null;
    let minDifference = Infinity;

    for (const pos of positions) {
        const axisValue = getAxisValue(pos);
        const difference = Math.abs(axisValue - rawLayerValue);
        if (difference < minDifference) {
            minDifference = difference;
            closestValue = axisValue;
        }
    }

    return closestValue;
}

// Function to calculate min and max axis values based on the viewpoint (for the depth axis)
function calculateAxisRange(positions) {
    minAxisValue = 0;
    maxAxisValue = -0;

    for (const pos of positions) {
        const axisValue = getAxisValue(pos);
        if (axisValue < minAxisValue) minAxisValue = axisValue;
        if (axisValue > maxAxisValue) maxAxisValue = axisValue;
    }
}

// Helper function to calculate the scale factor dynamically
function calculateScaleFactor(positions) {
    let maxDistance = 0;

    positions.forEach(pos => {
        const distance = Math.sqrt(pos.x ** 2 + pos.y ** 2 + pos.z ** 2);
        if (distance > maxDistance) maxDistance = distance;
    });

    const maxCanvasSize = 650 / 2;
    return maxCanvasSize / maxDistance;
}

// Draws the 2d stuff
function draw2DVisualization(positions, scaleFactor) {
    const canvas = document.getElementById("blueprint-canvas");
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (!layeredView) positions.sort((a, b) => getAxisValue(a) - getAxisValue(b));

    const layerCount = positions.length;
    positions.forEach((pos, index) => {
        let grayShade = 255;
        if (!layeredView) grayShade = 255 - Math.floor(255 * (index / layerCount));

        ctx.fillStyle = `rgb(${grayShade}, ${grayShade}, ${grayShade})`;
        const [viewX, viewY] = transformCoordinates(pos);
        const x = canvas.width / 2 + viewX * scaleFactor;
        const y = canvas.height / 2 - viewY * scaleFactor;

        if (x >= 0 && x < canvas.width && y >= 0 && y < canvas.height) {
            ctx.fillRect(x, y, 5, 5);
        } else {
            console.warn(`Position (${x}, ${y}) is out of canvas bounds.`);
        }
    });
}

// Transform coordinates based on the selected viewpoint
function transformCoordinates(pos) {
    switch (viewpoint) {
        case "side": return [pos.x, pos.y];
        case "front": return [pos.z, pos.y];
        case "top": return [pos.x, pos.z];
        default: return [pos.x, pos.y];
    }
}

// Event Listeners for controls
document.getElementById("layered-view-checkbox").addEventListener("change", function(event) {
    layeredView = event.target.checked;
    document.getElementById("layer-slider").disabled = !layeredView;
    visualizeBlockPositions();
});

document.getElementById("layer-slider").addEventListener("input", function(event) {
    currentLayer = event.target.value;
    visualizeBlockPositions();
});

document.getElementById("viewpoint-select").addEventListener("change", function(event) {
    viewpoint = event.target.value;
    visualizeBlockPositions();
});

document.getElementById("blueprint-file-input").addEventListener("change", function(event) {
    const file = event.target.files[0];
    if (file) handleBlueprintUpload(file);
});

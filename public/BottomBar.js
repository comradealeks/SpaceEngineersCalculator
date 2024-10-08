const BottomListArray = [];

//Adds any block that is right clicked into the array
function BottomList(BlockName, BlockGrid, Action) {
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
    BottomListBlocks()
}

//function 1: gets block details:
function BottomListBlocks(){
    const ExpandedContentSection = document.getElementById('bottom-expanded-content');
    ExpandedContentSection.innerHTML = ''
    BottomListArray.forEach((entity) => {

        fetchBlockDetails(entity[0]).then(block => {


            const BottomBlockElement = document.createElement('div');
            BottomBlockElement.classList.add('block');

            BottomBlockElement.innerHTML = `
                <img src="data:image/png;base64,${block.Icon}">
                <div>${formatDisplayName(block.DisplayName)}</div>
            `;
            BottomBlockElement.addEventListener('click', () => displayBlockDetails(block.BlockID, block.DisplayName));
            BottomBlockElement.addEventListener('contextmenu', (event) => {
                event.preventDefault(); // Prevent the default context menu
                BottomList(block.BlockID, block.CubeSize, false);
            });
            ExpandedContentSection.appendChild(BottomBlockElement);
        }).catch(error => console.error('Error fetching block details:', error));
    });
}


//function 2: gets all components together:






document.getElementById('bottom-bar-arrow').addEventListener('click', function() {
    document.getElementById('bottom-bar').classList.toggle('expanded');
});

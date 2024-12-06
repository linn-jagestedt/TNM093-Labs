const svg = d3.select("#simulation-area");
const width = svg.attr("width");
const height = svg.attr("height");

const defs = svg.append("defs");

const nodeGrad = defs.append("radialGradient")
.attr("id", "nodegrad")//id of the gradient
.attr("cx", "25%")
.attr("cy", "25%");

nodeGrad.append("stop")
.attr("offset", "0%")
.style("stop-color", "#40a9f9")
.style("stop-opacity", 1);

nodeGrad.append("stop")
.attr("offset", "100%")
.style("stop-color", "#000972")
.style("stop-opacity", 1);


/*
/   Gather values from the input elements
*/

let rows = parseInt(document.getElementById("rows").value, 10);
let cols = parseInt(document.getElementById("cols").value, 10);
let restoreForce = parseFloat(document.getElementById("restore-force").value);
let damping = parseFloat(document.getElementById("damping").value);

/*
/ Variable delcarations
*/

const padding = 80;
const mass = 1;
const timeStep = 0.016;

let cursorRadius = 40;
let nodeRadius = 40;
let lineThickness = 8;

let xStep = (width - 2 * padding) / (cols - 1);
let yStep = (height - 2 * padding) / (rows - 1);

let positions = [];
let lastPositions = [];
let velocities = [];
let forces = [];
let isRunning = false;
let start = Date.now();
let frameTimes = []

/*
/   Main loop
*/

function simulationLoop() 
{
    if (!isRunning) return;

    calculateFrameTime();

    update();
    render();

    requestAnimationFrame(simulationLoop);
}

function calculateFrameTime() {

    let current = Date.now();

    frameTimes.push(current - start);

    start = current;

    if (frameTimes.length > 30) {
        frameTimes.shift();
    }

    let frameTime = 0;

    for (let i = 0; i < frameTimes.length; i++) {
        frameTime += frameTimes[i];
    }

    frameTime /= frameTimes.length + 1;

    document.getElementById("frame-time").innerHTML = (frameTime / 1000).toFixed(3);
}

/*
/   Initialization
*/

function initializeGrid() 
{
    positions = [];
    lastPositions = [];
    velocities = [];
    forces = [];

    xStep = (width - 2 * padding) / (cols - 1);
    yStep = (height - 2 * padding) / (rows - 1);

    nodeRadius = 250 / (rows + cols);
    lineThickness = 50 / (rows + cols);

    for (let i = 0; i < rows; i++) 
    {
        const positionRow = [];
        const lastPositionRow = [];
        const velocityRow = [];
        const forceRow = [];

        for (let j = 0; j < cols; j++) {
            positionRow.push([padding + xStep * j, padding + yStep * i]); 
            lastPositionRow.push([padding + xStep * j, padding + yStep * i]); 
            velocityRow.push([0, 0]); 
            forceRow.push([0, 0]); 
        }

        positions.push(positionRow);
        lastPositions.push(lastPositionRow);
        velocities.push(velocityRow);
        forces.push(forceRow);
    }

    svg.select("#structuralLines").selectAll("path").remove();
    svg.select("#shearLines").selectAll("path").remove();
    svg.select("#circles").selectAll("circle").remove();
    
    render();
}

/*
/   Rendering
*/

function render() 
{
    const lineData = prepareLineData();

    drawEdges("#structuralLines", lineData.structuralLinesData, "#000");
    //drawEdges("#shearLines", lineData.shearLinesData, "#1661bc");
    drawNodes("#circles", positions.flat(), "url(#nodegrad)");
}

function drawNodes(selector, data, color) 
{    
    // Bind data
    const nodes = svg
        .select(selector)
        .selectAll("circle")
        .data(data);

    // Init
    nodes
        .enter()
        .append("circle")
        .attr("r", nodeRadius)
        .attr("fill", color)
        .merge(nodes)
        .attr("cx", (d) => d[0])
        .attr("cy", (d) => d[1]);
    
    // Clear
    nodes.exit().remove();
}

function drawEdges(selector, data, color) 
{
    const lineGenerator = d3.line();
    
    // Bind data
    const lines = svg
        .select(selector)
        .selectAll("path")
        .data(data);    

    // Init
    lines
        .enter()
        .append("path")
        .attr("stroke", color)
        .attr("stroke-width", lineThickness)
        .merge(lines)
        .attr("d", lineGenerator);

    // Clear
    lines.exit().remove();
}

function drawCursor(selector, data, color) 
{    
    const cursor = svg.select(selector).selectAll("circle").data(data);

    // Init
    cursor
        .enter()
        .append("circle")
        .attr("r", cursorRadius)
        .attr("fill", color)
        .attr("opacity", 0.5)
        .attr("cx", (d) => d.x)
        .attr("cy", (d) => d.y);

    cursor
        .attr("r", cursorRadius)    
        .attr("cx", (d) => d.x)
        .attr("cy", (d) => d.y);

    // Clear
    cursor.exit().remove();
}

function prepareLineData() 
{
    const structuralLinesData = [];
    const shearLinesData = [];

    // Collect coordinates for the lines between nodes
    for (let i = 0; i < rows; i++) 
    {
        for (let j = 0; j < cols; j++) 
        {
            // From current node to the south node
            if (i < rows - 1) {
                structuralLinesData.push([
                    positions[i + 0][j],
                    positions[i + 1][j]
                ]);
            }

            // From current node to the east node
            if (j < cols - 1) {
                structuralLinesData.push([
                    positions[i][j + 0],
                    positions[i][j + 1]
                ]);
            }

            // From current node to the south-west node 
            if (j > 0 && i < rows - 1) {
                shearLinesData.push([
                    positions[i + 0][j],
                    positions[i + 1][j - 1]
                ]);
            }

            // From current node to the south-east node 
            if (j < cols - 1 && i < rows - 1) {
                shearLinesData.push([
                    positions[i + 0][j],
                    positions[i + 1][j + 1]
                ]);
            }
        }
    }

    return { structuralLinesData, shearLinesData };
}

/*
/   Update Positions
*/

function update() 
{
    for (let i = 0; i < rows; i++) 
    {
        for (let j = 0; j < cols; j++) 
        {
            let currentPos = [
                positions[i][j][0],
                positions[i][j][1]
            ];

            // Skip updating the position if the
            // node is being draged by the mouse.
            if (!selectedNodes.some(node => node.row == i && node.col == j)) 
            {                
                //updatePositionsEuler(i, j);
                updatePositionsVerlet(i, j);

                forces[i][j] = sumForces(i, j);
            }

            lastPositions[i][j] = currentPos;
        }
    }

}

function updatePositionsEuler(row, col) 
{ 
    velocities[row][col][0] += timeStep * (forces[row][col][0] / mass);
    velocities[row][col][1] += timeStep * (forces[row][col][1] / mass);

    positions[row][col][0] += timeStep * velocities[row][col][0];
    positions[row][col][1] += timeStep * velocities[row][col][1];
}

function updatePositionsVerlet(row, col)  
{    
    positions[row][col] = [
        2 * positions[row][col][0] - lastPositions[row][col][0] + (forces[row][col][0] / mass) * timeStep * timeStep,
        2 * positions[row][col][1] - lastPositions[row][col][1] + (forces[row][col][1] / mass) * timeStep * timeStep
    ]

    velocities[row][col][0] = (1 / (2 * timeStep)) * (positions[row][col][0] - lastPositions[row][col][0]);
    velocities[row][col][1] = (1 / (2 * timeStep)) * (positions[row][col][1] - lastPositions[row][col][1]);
}

/*
/   Force Calculations
*/

function sumForces(row, col) 
{
    let sum = [0, 0];
    
    // Loop through all nodes arround the current node
    for (let i = row - 1; i < row + 2; i++) 
    {
        for (let j = col - 1; j < col + 2; j++) 
        {
            // Bound checking
            if (i < 0 || j < 0 || i > rows - 1 || j > cols - 1) {
                continue;
            }

            // Skip if calculating forces from the current node
            if (i == row && j == col) {
                continue;
            }

            // Checks if nodes are vertically aligned, horizontally aligned or diagonal 
            // and sets the length of the spring.
            let len = i == row ? [xStep, 0] : j == col ? [0, yStep] : [xStep, yStep];

            let springForce = calculateSpringForce(
                positions[row][col], 
                positions[i][j], 
                len
            );
    
            let dampingForce = calculateDampingForce(
                velocities[row][col],
                velocities[i][j],
                len
            );
    
            sum[0] += (springForce[0] + dampingForce[0]);
            sum[1] += (springForce[1] + dampingForce[1]);
        }
    }  

    return sum;
}

function calculateSpringForce(p1, p2, len) 
{
    let diffx = p1[0] - p2[0];
    let diffy = p1[1] - p2[1];

    let force = [0, 0];

    if (diffx != 0) {
        force[0] = -40 * restoreForce * (Math.abs(diffx) - len[0]) * (diffx / Math.abs(diffx));
    }

    if (diffy != 0) {
        force[1] = -40 * restoreForce * (Math.abs(diffy) - len[1]) * (diffy / Math.abs(diffy));
    }

    return force;
} 

function calculateDampingForce(v1, v2) 
{
    return [
        -4 * damping * (v1[0] - v2[0]),
        -4 * damping * (v1[1] - v2[1])
    ]
} 

/*
/   Set initial values for the input labels
*/

let label = document.getElementById("restore-force").labels[0];
label.innerText = label.innerText.split(":")[0];
label.innerText += ": " + restoreForce.toFixed(2);

label = document.getElementById("damping").labels[0];
label.innerText = label.innerText.split(":")[0];
label.innerText += ": " + damping.toFixed(2);

/*
/   Add event listeners to input elemenrs
*/

document.getElementById("toggle-simulation").addEventListener("click", () => {
    isRunning = !isRunning;
    document.getElementById("toggle-simulation").innerText = isRunning ? "Stop Simulation" : "Start Simulation";
    if (isRunning) simulationLoop();
});

document.getElementById("rows").addEventListener("input", (e) => {
    rows = parseInt(e.target.value, 10);
    initializeGrid();
});

document.getElementById("cols").oninput = (e) => {
    cols = parseInt(e.target.value, 10);
    initializeGrid();
}

document.getElementById("restore-force").oninput = (e) => {
    restoreForce = parseFloat(e.target.value);

    let label = e.target.labels[0];
    label.innerText = label.innerText.split(":")[0];
    label.innerText += ": " + restoreForce.toFixed(2);
}

document.getElementById("damping").oninput = (e) => {
    damping = parseFloat(e.target.value);

    let label = e.target.labels[0];
    label.innerText = label.innerText.split(":")[0];
    label.innerText += ": " + damping.toFixed(2);
}

/*
/   Mouse events
*/

let selectedNodes = [];

const simulationArea = document.getElementById("simulation-area");

function getMousePos(e) {
    var rect = simulationArea.getBoundingClientRect();
    return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
    };
}

simulationArea.addEventListener("mousedown", (e) => 
{
    for (let i = 0; i < rows; i++) 
    {
        for (let j = 0; j < cols; j++) 
        {
            let mouse = getMousePos(e);

            let diffx = Math.abs(mouse.x - positions[i][j][0]);
            let diffy = Math.abs(mouse.y - positions[i][j][1]);

            let distance = Math.sqrt(diffx * diffx + diffy * diffy)

            let factor = -1 * distance / 300 + 1;

            if (Math.sqrt(diffx * diffx + diffy * diffy) < nodeRadius + cursorRadius) {
                selectedNodes.push({
                    row: i,
                    col: j,
                    factor: factor * factor
                });
            }
        }
    }
});

document.addEventListener("mousemove", (e) => 
{
    let mouse = getMousePos(e);
    drawCursor("#cursor", [mouse], "#FF0000");

    if (selectedNodes.length < 1) {
        return;
    }

    // Add the movement delta to the node position
    for (let i = 0; i < selectedNodes.length; i++) 
    {
        positions[selectedNodes[i].row][selectedNodes[i].col][0] += e.movementX * selectedNodes[i].factor;
        positions[selectedNodes[i].row][selectedNodes[i].col][1] += e.movementY * selectedNodes[i].factor;
        lastPositions[selectedNodes[i].row][selectedNodes[i].col][0] += e.movementX * selectedNodes[i].factor;
        lastPositions[selectedNodes[i].row][selectedNodes[i].col][1] += e.movementY * selectedNodes[i].factor;
    }

    if (!isRunning) {
        render();
    }
});

document.addEventListener("wheel", (e) => 
{
    cursorRadius += -0.1 * e.deltaY;

    if (cursorRadius > 200) cursorRadius = 200;
    if (cursorRadius < 20) cursorRadius = 20;

    let mouse = getMousePos(e);
    drawCursor("#cursor", [mouse], "#FF0000");
});

simulationArea.addEventListener("mouseleave", (e) => selectedNodes = []);
simulationArea.addEventListener("mouseup", (e) => selectedNodes = []);

// Entry point
initializeGrid();

const svg = d3.select("#simulation-area");
const width = svg.attr("width");
const height = svg.attr("height");

var gradient = svg.append("defs").append("radialGradient")
.attr("id", "mygrad")//id of the gradient
.attr("cx", "25%")
.attr("cy", "25%");

gradient.append("stop")
.attr("offset", "0%")
.style("stop-color", "#40a9f9")
.style("stop-opacity", 1);

gradient.append("stop")
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
let timeStep = parseFloat(document.getElementById("time-step").value)

/*
/   Set initial values for the input labels
*/

let label = document.getElementById("restore-force").labels[0];
label.innerText = label.innerText.split(":")[0];
label.innerText += ": " + restoreForce.toFixed(2);

label = document.getElementById("damping").labels[0];
label.innerText = label.innerText.split(":")[0];
label.innerText += ": " + damping.toFixed(2);

label = document.getElementById("time-step").labels[0];
label.innerText = label.innerText.split(":")[0];
label.innerText += ": " + timeStep.toFixed(2);

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

document.getElementById("time-step").oninput = (e) => {
    timeStep = parseFloat(e.target.value);

    let label = e.target.labels[0];
    label.innerText = label.innerText.split(":")[0];
    label.innerText += ": " + timeStep.toFixed(2);
}

/*
/   Add mouse events
*/

let selectedRow = -1;
let selectedCol = -1;

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

            if (Math.sqrt(diffx * diffx + diffy * diffy) < nodeRadius) {
                selectedRow = i;
                selectedCol = j;
            }
        }
    }
});

simulationArea.addEventListener("mouseup", (e) => selectedRow = selectedCol = -1);

simulationArea.addEventListener("mousemove", (e) => 
{
    if (selectedRow < 0 || selectedCol < 0) {
        return;
    }

    let mouse = getMousePos(e);

    positions[selectedRow][selectedCol][0] = mouse.x;
    positions[selectedRow][selectedCol][1] = mouse.y;
    
    drawEdges();
    drawNodes();
});

/*
/ Variable delcarations
*/

const nodeRadius = 40;
const lineThickness = 8;
const padding = 100;
const mass = 2;

let xStep = (width - 2 * padding) / (cols - 1);
let yStep = (height - 2 * padding) / (rows - 1);

let positions = [];
let lastPositions = [];
let velocities = [];
let forces = [];
let isRunning = false;

/*
/   Main loop
*/

function simulationLoop() 
{
    if (!isRunning) return;

    calculateForces() 
    updatePositions();

    drawEdges();
    drawNodes();

    requestAnimationFrame(simulationLoop);
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

    for (let i = 0; i < rows; i++) 
    {
        const positionRow = [];
        const velocityRow = [];
        const forceRow = [];

        for (let j = 0; j < cols; j++) {
            positionRow.push([padding + xStep * j, padding + yStep * i]); 
            velocityRow.push([0, 0]); // Initial velocity
            forceRow.push([0, 0]); // Initial force
        }

        positions.push(positionRow);
        lastPositions.push(positionRow);
        velocities.push(velocityRow);
        forces.push(forceRow);
    }

    drawEdges();
    drawNodes();
}

/*
/   Rendering
*/

function drawNodes() 
{
    const nodes = svg.selectAll("circle");
    
    nodes
        .data(positions.flat())
        .join("circle")
        .attr("r", nodeRadius)
        .attr("cx", (d) => d[0])
        .attr("cy", (d) => d[1])
        .attr("fill", "url(#mygrad)")

    nodes.exit().remove();
}

function drawEdges() 
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

    const lineGenerator = d3.line();
    
    const structuralLines = svg.select("#structuralLines");    

    structuralLines
        .selectAll("path")
        .data(structuralLinesData)
        .join("path")
        .attr("d", lineGenerator)
        .attr("stroke", "black")
        .attr("stroke-width", lineThickness);
    
    const shearLines = svg.select("#shearLines");

    shearLines
        .selectAll("path")
        .data(shearLinesData)
        .join("path")
        .attr("d", lineGenerator)
        .attr("stroke", "#1661bc")
        .attr("stroke-width", lineThickness);
}

/*
/   Update Positions
*/

function updatePositions() 
{
    for (let i = 0; i < rows; i++) 
    {
        for (let j = 0; j < cols; j++) 
        {
            // Skip updating the position if the
            // node is being draged by the mouse.
            if (i == selectedRow && j == selectedCol) {
                continue;
            }

            //updatePositionsEuler(i, j);
            updatePositionsVerlet(i, j);
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
    let lastPos = [lastPositions[row][col][0], lastPositions[row][col][1]];
    let currentPos = [positions[row][col][0], positions[row][col][1]];

    let newPos = [
        2 * currentPos[0] - lastPos[0] + (forces[row][col][0] / mass) * timeStep * timeStep,
        2 * currentPos[1] - lastPos[1] + (forces[row][col][1] / mass) * timeStep * timeStep
    ]

    let diffx = newPos[0] - lastPos[0];
    let diffy = newPos[1] - lastPos[1];

    velocities[row][col][0] = (1 / (2 * timeStep)) * diffx;
    velocities[row][col][1] = (1 / (2 * timeStep)) * diffy;

    lastPositions[row][col] = currentPos;
    positions[row][col] = newPos;
}

/*
/   Force Calculations
*/

function calculateForces() 
{
    for (let i = 0; i < rows; i++) 
    {
        for (let j = 0; j < cols; j++) 
        {
            forces[i][j][0] = 0;
            forces[i][j][1] = 0;

            forces[i][j] = sumForces(i, j);
        }
    }
}

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
        force[0] = -restoreForce * (Math.abs(diffx) - len[0]) * (diffx / Math.abs(diffx));
    }

    if (diffy != 0) {
        force[1] = -restoreForce * (Math.abs(diffy) - len[1]) * (diffy / Math.abs(diffy));
    }

    return force;
} 

function calculateDampingForce(v1, v2) 
{
    let diffx = v1[0] - v2[0];
    let diffy = v1[1] - v2[1];

    return [
        -damping * (diffx),
        -damping * (diffy)
    ]
} 

// Entry point
initializeGrid();

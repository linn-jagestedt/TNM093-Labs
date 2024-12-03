/**
 * A Starting Template for Lab in Vis Applications course module in TNM093
 * -------------------------------------
 *
 * IMPORTANT:
 * - This is a basic template serving as a starting template and NOT intended to cover all requirements.
 * - You are encouraged to implement the lab in your own way.
 * - Feel free to ignore this template if you prefer to start from scratch.
 *
 */


// Main simulation logic

// Select the SVG container
const svg = d3.select("#simulation-area");
const width = svg.attr("width");
const height = svg.attr("height");

// examples of default settings that can be changed later
let rows = parseInt(document.getElementById("rows").value, 10);
let cols = parseInt(document.getElementById("cols").value, 10);
let restoreForce = parseFloat(document.getElementById("restore-force").value);
let damping = parseFloat(document.getElementById("damping").value);
const nodeRadius = 15;
const timeStep = 0.16;
const padding = 50;
const mass = 2;

let xStep = (width - 2 * padding) / (cols - 1);
let yStep = (height - 2 * padding) / (rows - 1);

// Arrays to hold positions, velocities, and forces
let positions = [];
let lastPositions = [];
let velocities = [];
let forces = [];
let isRunning = false;

/**
 * Initialize the grid with nodes and reset their positions, velocities, and forces.
 */
function initializeGrid() {
    positions = [];
    velocities = [];
    forces = [];
    xStep = (width - 2 * padding) / (cols - 1);
    yStep = (height - 2 * padding) / (rows - 1);

    for (let i = 0; i < rows; i++) {
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

    svg.selectAll("*").remove();

    drawEdges();
    drawNodes();
}

/**
 * Draw the nodes (circles) on the SVG.
 */
function drawNodes() {
    // example of how to draw nodes on the svg
    const nodes = svg.selectAll("circle").data(positions.flat());
    nodes
        .enter()
        .append("circle")
        .attr("r", nodeRadius)
        .merge(nodes)
        .attr("cx", (d) => d[0])
        .attr("cy", (d) => d[1])
        .attr("fill", "blue")
        .attr("stroke", "white")
        .attr("stroke-width", 2);

    nodes.exit().remove();
}

/**
 * Draw the edges (lines) connecting the nodes.
 */
function drawEdges() 
{
    const linesData = [];

    for (let i = 0; i < rows; i++) 
    {
        for (let j = 0; j < cols; j++) 
        {
            // Right
            if (i < rows - 1) {
                linesData.push([
                    positions[i + 0][j],
                    positions[i + 1][j]
                ]);
            }

            // Upp
            if (j < cols - 1) {
                linesData.push([
                    positions[i][j + 0],
                    positions[i][j + 1]
                ]);
            }

            // Left Down
            if (j > 0 && i < rows - 1) {
                linesData.push([
                    positions[i + 0][j],
                    positions[i + 1][j - 1]
                ]);
            }

            //Right down
            if (j < cols - 1 && i < rows - 1) {
                linesData.push([
                    positions[i + 0][j],
                    positions[i + 1][j + 1]
                ]);
            }
        }
    }

    const lineGenerator = d3.line();

    const lines = svg.selectAll("path").data(linesData);
    
    lines
        .enter()
        .append("path")
        .merge(lines)
        .attr("d", lineGenerator)
        .attr("fill", "none")
        .attr("stroke", "black")
        .attr("thickness", 10);
}

/**
 * Calculate forces acting on each node.
 * This function is a placeholder for students to implement force calculations.
 */
function calculateForces() {
    // Reset forces
    for (let i = 0; i < rows; i++) 
    {
        for (let j = 0; j < cols; j++) 
        {
            forces[i][j][0] = 0;
            forces[i][j][1] = 0;
        }
    }

    for (let i = 0; i < rows; i++) 
    {
        for (let j = 0; j < cols; j++) 
        {
            if (i == selectedRow && j == selectedCol) {
                continue;
            }

            let springForce = sumForces(i, j);

            forces[i][j][0] += springForce[0];
            forces[i][j][1] += springForce[1];
        }
    }
}

function sumForces(row, col) 
{
    let sum = [0, 0];

    for (let i = row - 1; i < row + 2; i++) 
    {
        for (let j = col - 1; j < col + 2; j++) 
        {
            if (i < 0 || j < 0 || i > rows - 1 || j > cols - 1) {
                continue;
            }

            if (i == row && j == col) {
                continue;
            }

            let len = 0;

            if (i == row) {
                len = [xStep, 0];
            } else if (j == col) {
                len = [0, yStep];
            } else {
                //len = Math.sqrt(xStep * xStep + yStep * yStep);
                len = [xStep, yStep];
            }

            let springForce = calculateSpringForce(
                positions[row][col], 
                positions[i][j], 
                len
            );
    
            let damping = calculateDampingForce(
                velocities[row][col],
                velocities[i][j],
                len
            );
    
            sum[0] += springForce[0] + damping[0];
            sum[1] += springForce[1] + damping[1];
        }
    }  

    return sum;
}

function calculateSpringForce(p1, p2, len) 
{
    let diffx = p1[0] - p2[0];
    let diffy = p1[1] - p2[1];

    force = [0, 0];

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

function updatePositionsEuler() 
{
    for (let i = 0; i < rows; i++) 
    {
        for (let j = 0; j < cols; j++) 
        {
            if (i == selectedRow && j == selectedCol) {
                continue;
            }
 
            velocities[i][j][0] += timeStep * (forces[i][j][0] / mass);
            velocities[i][j][1] += timeStep * (forces[i][j][1] / mass);

            positions[i][j][0] += timeStep * velocities[i][j][0];
            positions[i][j][1] += timeStep * velocities[i][j][1];
        }
    }

    drawEdges();
    drawNodes();
}

function updatePositionsVerlet() 
{
    for (let i = 0; i < rows; i++) 
    {
        for (let j = 0; j < cols; j++) 
        {
            if (i == selectedRow && j == selectedCol) {
                continue;
            }

            let currentPos = positions[i][j];

            positions[i][j][0] = 2 * positions[i][j][0] - lastPositions[i][j][0] + (forces[i][j][0] / mass) * timeStep * timeStep;
            positions[i][j][1] = 2 * positions[i][j][1] - lastPositions[i][j][1] + (forces[i][j][1] / mass) * timeStep * timeStep;
        
            velocities[i][j][0] = (1 / (2 * timeStep)) * (positions[i][j][0] - lastPositions[i][j][0])
            velocities[i][j][1] = (1 / (2 * timeStep)) * (positions[i][j][1] - lastPositions[i][j][1])
        
            lastPositions[i][j] = currentPos;
        }
    }

    drawEdges();
    drawNodes();
}


/**
 * Main simulation loop.
 * Continuously updates the simulation as long as `isRunning` is true.
 */
function simulationLoop() {
    if (!isRunning) return;

    calculateForces() 
    updatePositionsVerlet();
    requestAnimationFrame(simulationLoop);
}


// ********** Event listeners examples for controls **********

// Start/Stop simulation
document.getElementById("toggle-simulation").addEventListener("click", () => {
    isRunning = !isRunning;
    document.getElementById("toggle-simulation").innerText = isRunning ? "Stop Simulation" : "Start Simulation";
    if (isRunning) simulationLoop();
});

// Update grid rows
document.getElementById("rows").addEventListener("input", (e) => {
    rows = parseInt(e.target.value, 10);
    initializeGrid();
});

// Update grid columns
document.getElementById("cols").addEventListener("input", (e) => {
    cols = parseInt(e.target.value, 10);
    initializeGrid();
});

// Update restore force
document.getElementById("restore-force").addEventListener("input", (e) => {
    restoreForce = parseFloat(e.target.value);
    document.getElementById("restore-force-value").textContent = restoreForce.toFixed(2);
});

// Update damping
document.getElementById("damping").addEventListener("input", (e) => {
    damping = parseFloat(e.target.value);
    document.getElementById("damping-value").textContent = damping.toFixed(2);
});

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

// Mouse event
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

simulationArea.addEventListener("mouseup", (e) => 
{
    selectedRow = -1;
    selectedCol = -1;
});

document.getElementById("simulation-area").addEventListener("mousemove", (e) => 
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
    


// Initialize the simulation
initializeGrid();
// additional functions 
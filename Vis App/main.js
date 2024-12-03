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
const timeStep = 0.016;
const padding = 50;

// Arrays to hold positions, velocities, and forces
let positions = [];
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
    const xStep = (width - 2 * padding) / (cols - 1);
    const yStep = (height - 2 * padding) / (rows - 1);

    for (let i = 0; i < rows; i++) {
        const positionRow = [];
        const velocityRow = [];
        const forceRow = [];
        for (let j = 0; j < cols; j++) {
            positionRow.push([padding + xStep * j, padding + yStep * i]); // ! TODO: think about how to calculate initial positions for the nodes
            velocityRow.push([0, 0]); // Initial velocity
            forceRow.push([0, 0]); // Initial force
        }
        positions.push(positionRow);
        velocities.push(velocityRow);
        forces.push(forceRow);
    }

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
    let linkGen = d3.linkHorizontal(); // Start horizontal link

    let linePositions = [];

    //
    // Add all the points as links to linePositions
    //

    for (let i = 0; i < rows; i++) 
    {
        for (let j = 0; j < cols; j++) 
        {
            if (i < rows - 1) {
                linePositions.push({
                    source: positions[i + 0][j],
                    target: positions[i + 1][j]
                });
            }

            if (j < cols - 1) {
                linePositions.push({
                    source: positions[i][j + 0],
                    target: positions[i][j + 1]
                });
            }
        }
    }

    // 
    // Add links ass paths to svg
    //

    svg
        .selectAll("path")
        .data(linePositions)
        .join("path")
        .attr("d", linkGen)
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
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            forces[i][j][0] = 0;
            forces[i][j][1] = 0;
        }
    }

    // TODO: add your implementation here.
    // Example:
    // - Calculate spring forces (horizontal, vertical, diagonal/sheer).
    // - Add restoring forces.
    // - Add damping forces.
}

function updatePositions() {
    // TODO: think about how to calculate positions and velocities. (e.g. Euler's method)
    //   calculateForces();

    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            // TODO: potentially implement position and velocity updates here.
            // Example:
            // velocities[i][j][0] += some calculation
            // velocities[i][j][1] += some calculation
            // positions[i][j][0] += some calculation;
            // positions[i][j][1] += some calculation;
        }
    }

    // TODO: Think about how to redraw nodes and edges with updated positions
    //   drawNodes();
    //   drawEdges();
}

/**
 * Main simulation loop.
 * Continuously updates the simulation as long as `isRunning` is true.
 */
function simulationLoop() {
    if (!isRunning) return;

    // TODO: think about how to implement the simulation loop. below are some functions that you might find useful.
    updatePositions();
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

// Initialize the simulation
initializeGrid();
// additional functions 
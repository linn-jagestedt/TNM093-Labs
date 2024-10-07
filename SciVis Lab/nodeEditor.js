const tfCanvas = document.getElementById('tfCanvas');
const ctx = tfCanvas.getContext("2d");

let nodeList = [];
let selectedNode = 0;
const nodeRadius = 10;

/*
 * Node class
 */

class node {
    constructor(x, y, r, g, b) { 
        this.x = x;
        this.y = y;
        this.r = r;
        this.g = g;
        this.b = b;
    }
};

function addNode() {
    newNode = new node(
        Math.random(),
        0.01,
        0,
        0,
        0
    );
    nodeList.push(newNode);
    draw();
}

function removeNode() {
    nodeList.pop();
    draw();
}

function nodeToWindowCoord(node) {
    return {
        x: node.x * (tfCanvas.clientWidth - 2 * nodeRadius) + nodeRadius, 
        y: (1.0 - node.y) * (tfCanvas.clientHeight - 2 * nodeRadius) + nodeRadius, 
    }
}

function windowToNodeCoord(coord) {
    return {
        x: (coord.x - nodeRadius) / (tfCanvas.clientWidth - 2 * nodeRadius), 
        y: 1.0 - (coord.y - nodeRadius) / (tfCanvas.clientHeight - 2 * nodeRadius), 
    }
}

function drawNode(node) 
{
    ctx.beginPath();
    
    nodeWindowCoord = nodeToWindowCoord(node);

    ctx.arc(
        nodeWindowCoord.x, 
        nodeWindowCoord.y, 
        nodeRadius, 
        0, 
        2 * Math.PI
    );

    ctx.fillStyle = 
        'rgb(' + node.r + ', ' + node.g + ', ' + node.b + ')';
    
    ctx.fill();
}

function draw() 
{
    genTranferFunc();

    nodeList = nodeList.sort((a, b) => a.x - b.x);
    
    ctx.reset();
    ctx.beginPath();
    ctx.moveTo(
        0, 
        tfCanvas.clientHeight - nodeRadius
    );  
    
    for (var i = 0; i < nodeList.length; i++) 
    {  
        nodeWindowCoord = nodeToWindowCoord(nodeList[i]);
        
        ctx.lineTo(nodeWindowCoord.x, nodeWindowCoord.y);

        ctx.lineWidth = 4;
        ctx.strokeStyle = "#555555";
        
        ctx.closePath();
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(nodeWindowCoord.x, nodeWindowCoord.y);
    }

    ctx.lineTo(
        tfCanvas.clientWidth - nodeRadius, 
        tfCanvas.clientHeight - nodeRadius
    );
    
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#555555";
    
    ctx.closePath();
    ctx.stroke();

    for (var i = 0; i < nodeList.length; i++) {
        drawNode(nodeList[i]);
        ctx.lineWidth = 5;
    }
}

/*
 * Mouse actions
 */

function getMousePos(e) {
    var rect = tfCanvas.getBoundingClientRect();
    return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
    };
}

window.addEventListener('mousemove', function(e) {
    let mouse = getMousePos(e);
    
    for (var i = 0; i < nodeList.length; i++) 
    {
        nodeWindowCoord = nodeToWindowCoord(nodeList[i]);

        if (
            mouse.x < tfCanvas.clientWidth - nodeRadius && 
            mouse.x > nodeRadius &&
            mouse.y < tfCanvas.clientHeight - nodeRadius && 
            mouse.y > nodeRadius &&
            mouse.x < (nodeWindowCoord.x + nodeRadius * 2.0) && 
            mouse.x > (nodeWindowCoord.x - nodeRadius * 2.0) &&
            mouse.y < (nodeWindowCoord.y + nodeRadius * 2.0) &&
            mouse.y > (nodeWindowCoord.y - nodeRadius * 2.0) 
        ) {
            if (e.buttons == 1) {
                nodeCoord = windowToNodeCoord(mouse);

                nodeList[i].x = nodeCoord.x;
                nodeList[i].y = nodeCoord.y;
                draw();
                break;
            }
        }
    }

}, false);

window.addEventListener('mouseup', function(e) {
    let mouse = getMousePos(e);

    for (var i = 0; i < nodeList.length; i++) 
    {
        nodeWindowCoord = nodeToWindowCoord(nodeList[i]);

        if (
            mouse.x < tfCanvas.clientWidth - nodeRadius && 
            mouse.x > nodeRadius &&
            mouse.y < tfCanvas.clientHeight - nodeRadius && 
            mouse.y > nodeRadius &&
            mouse.x < (nodeWindowCoord.x + nodeRadius * 2.0) && 
            mouse.x > (nodeWindowCoord.x - nodeRadius * 2.0) &&
            mouse.y < (nodeWindowCoord.y + nodeRadius * 2.0) &&
            mouse.y > (nodeWindowCoord.y - nodeRadius * 2.0)
        ) {
            selectedNode = i;
            updateColorPicker();
        }
    }


}, false);

/*
 * Color Picker
 */

const colorPicker = document.getElementById("colorPicker");

function updateColorPicker() 
{
    let hexColor = rgbToHex(
        nodeList[selectedNode].r,
        nodeList[selectedNode].g,
        nodeList[selectedNode].b
    );

    colorPicker.value = hexColor;
}

function changeColor(element) 
{
    let rgbColor = hexToRgb(element.value);

    nodeList[selectedNode].r = rgbColor.r
    nodeList[selectedNode].g = rgbColor.g
    nodeList[selectedNode].b = rgbColor.b

    draw();
}

function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
}  

function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}
  
function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

/*
 * Transfer function
 */

function getInterpolatedColor(x) 
{
    let node1 = -1;
    let node2 = -1;

    for (var i = 0; i < nodeList.length; i++) 
    {
        if (nodeList[i].x > x) 
        {
            node1 = i - 1;
            node2 = i;
            break
        }
    }

    r1 = node1 == -1 ? 0 : nodeList[node1].r;
    g1 = node1 == -1 ? 0 : nodeList[node1].g;
    b1 = node1 == -1 ? 0 : nodeList[node1].b;
    a1 = node1 == -1 ? 0 : nodeList[node1].y * 255;

    r2 = node2 == -1 ? 0 : nodeList[node2].r;
    g2 = node2 == -1 ? 0 : nodeList[node2].g;
    b2 = node2 == -1 ? 0 : nodeList[node2].b;
    a2 = node2 == -1 ? 0 : nodeList[node2].y * 255;

    lerp = x - (node1 == -1 ? 0 : nodeList[node1].x);
    lerp /= (node2 == -1 ? 0 : nodeList[node2].x) - (node1 == -1 ? 0 : nodeList[node1].x);

    return {    
        r: (1.0 - lerp) * r1 + lerp * r2,
        g: (1.0 - lerp) * g1 + lerp * g2,
        b: (1.0 - lerp) * b1 + lerp * b2,
        a: (1.0 - lerp) * a1 + lerp * a2,
    }; 
}

function genTranferFunc() 
{
    for (var i = 0; i < TransferFunctionTextureRes; i++) 
    {
        let color = getInterpolatedColor(i / TransferFunctionTextureRes);

        TransferFunctionTexture[(i * 4) + 0] = color.r;
        TransferFunctionTexture[(i * 4) + 1] = color.g;
        TransferFunctionTexture[(i * 4) + 2] = color.b;
        TransferFunctionTexture[(i * 4) + 3] = color.a;
        console.log(
            "color x = " + i / TransferFunctionTextureRes + ": " + 
            color.r + ", " + color.g + ", " + color.b + ", " + color.a
        );
    }
    
    TransferFunctionIsDirty = true;
}

nodeList.push(new node(0.15, 0,     0, 0, 0));
nodeList.push(new node(0.20, 0.8,   70, 220, 50));
nodeList.push(new node(0.25, 0,     0, 0, 0));

nodeList.push(new node(0.40, 0,     0, 0, 0));
nodeList.push(new node(0.45, 0.6,   255, 200, 0));
nodeList.push(new node(0.50, 0,     0, 0, 0));

nodeList.push(new node(0.70, 0,     0, 0, 0));
nodeList.push(new node(0.75, 0.7,   0, 150, 255));
nodeList.push(new node(0.85, 0.7,   0, 150, 255));
nodeList.push(new node(0.90, 0,     0, 0, 0));

draw();
genTranferFunc();
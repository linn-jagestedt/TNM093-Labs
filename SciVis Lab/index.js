let RenderingIsDirty = true;
let TransferFunctionIsDirty = true;

const TransferFunctionTextureRes = 256;
const TransferFunctionTexture = new Uint8Array(TransferFunctionTextureRes * 4);

const boundingBoxVertexSource = document.getElementById('boundingBoxVertexSource').innerHTML.trimStart();
const boundingBoxFragmentSource = document.getElementById('boundingBoxFragmentSource').innerHTML.trimStart();

const volumeRenderingVertexSource = document.getElementById('volumeRenderingVertexSource').innerHTML.trimStart();
const volumeRenderingFragmentSource = document.getElementById('volumeRenderingFragmentSource').innerHTML.trimStart();

function createProgram(gl, vertexSource, fragmentSource) 
{
  function loadShader(gl, type, source) 
  {
    let shader = gl.createShader(type);

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      postError("Failed to compile shader: " + gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    } else {
      return shader;
    }
  }

  let vertexShader = loadShader(gl, gl.VERTEX_SHADER, vertexSource);
  let fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fragmentSource);

  if (!vertexShader || !fragmentShader) {
    return;
  }

  let program = gl.createProgram();

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    postError('Failed to create program object: ' + gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return;
  }

  return program;
}

function updateTransferFunction(gl, transferFunctionTextureID) 
{
  console.log(117, "Updating the transfer function texture");

  gl.bindTexture(gl.TEXTURE_2D, transferFunctionTextureID);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, TransferFunctionTextureRes, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, TransferFunctionTexture);
}

function renderBoundingbox(gl, program, modelMatrix, viewMatrix, projectionMatrix, fbFront, fbBack)
{
  gl.enable(gl.CULL_FACE);
  gl.useProgram(program);

  {
    const location = gl.getUniformLocation(program, "modelMatrix");
    gl.uniformMatrix4fv(location, false, modelMatrix);
  }
  {
    const location = gl.getUniformLocation(program, "viewMatrix");
    gl.uniformMatrix4fv(location, false, viewMatrix);
  }
  {
    const location = gl.getUniformLocation(program, "projectionMatrix");
    gl.uniformMatrix4fv(location, false, projectionMatrix);
  }


  gl.bindFramebuffer(gl.FRAMEBUFFER, fbBack);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.cullFace(gl.FRONT);
  gl.drawArrays(gl.TRIANGLES, 0, 36);
 
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbFront);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.cullFace(gl.BACK);
  gl.drawArrays(gl.TRIANGLES, 0, 36);
}

function renderVolume(gl, program, volumeTexture, entryTexture, exitTexture,
                      transferFunctionTexture, stepSize, compositingType, renderType)
{
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.useProgram(program);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, entryTexture);
  gl.uniform1i(gl.getUniformLocation(program, "entryPoints"), 0);

  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, exitTexture);
  gl.uniform1i(gl.getUniformLocation(program, "exitPoints"), 1); // 1 == gl.TEXTURE1

  gl.activeTexture(gl.TEXTURE2);
  gl.bindTexture(gl.TEXTURE_3D, volumeTexture);
  gl.uniform1i(gl.getUniformLocation(program, "volume"), 2); // 2 == gl.TEXTURE2

  gl.activeTexture(gl.TEXTURE3);
  gl.bindTexture(gl.TEXTURE_2D, transferFunctionTexture);
  gl.uniform1i(gl.getUniformLocation(program, "transferFunction"), 3); // 3 == gl.TEXTURE3

  gl.uniform1f(gl.getUniformLocation(program, "stepSize"), stepSize);

  if (renderType == "volume") {
    gl.uniform1i(gl.getUniformLocation(program, "renderType"), 0);
  }
  else if (renderType == "entry") {
    gl.uniform1i(gl.getUniformLocation(program, "renderType"), 1);
  }
  else if (renderType == "exit") {
    gl.uniform1i(gl.getUniformLocation(program, "renderType"), 2);
  }
  else if (renderType == "direction") {
    gl.uniform1i(gl.getUniformLocation(program, "renderType"), 3);
  }
  else if (renderType == "transfer") {
    gl.uniform1i(gl.getUniformLocation(program, "renderType"), 4);
  }
  else if (renderType == "slice") {
    gl.uniform1i(gl.getUniformLocation(program, "renderType"), 5);
  }
  else if (renderType == "slice-transfer") {
    gl.uniform1i(gl.getUniformLocation(program, "renderType"), 6);
  }


  if (compositingType == "ftb") {
    gl.uniform1i(gl.getUniformLocation(program, "compositingMethod"), 0);
  }
  else if (compositingType == "fhp") {
    gl.uniform1i(gl.getUniformLocation(program, "compositingMethod"), 1);
  }
  else if (compositingType == "mip") {
    gl.uniform1i(gl.getUniformLocation(program, "compositingMethod"), 2);
  }

  gl.drawArrays(gl.TRIANGLES, 0, 6);
}

async function main() 
{
  let canvas = document.querySelector("#glCanvas");
  let gl = canvas.getContext("webgl2");

  if (!gl) {
    postError("Error initializing WebGL2 context");
    return;
  }

  console.log(100, "WebGL2 canvas created successfully");

  console.log(101, "Creating bounding box OpenGL program object");
  const boundingBoxProgram = createProgram(
    gl, boundingBoxVertexSource, boundingBoxFragmentSource
  );

  console.log(102, "Creating volume rendering OpenGL program object");
  const volumeRenderingProgram = createProgram(
    gl, volumeRenderingVertexSource, volumeRenderingFragmentSource
  );

  if (!boundingBoxProgram || !volumeRenderingProgram) {
    return;
  }

  console.log(103, "Both program objects were created successfully");
  
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  console.log(104, "Creating the entry point texture");

  const entryTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, entryTexture);
  gl.texImage2D(
    gl.TEXTURE_2D,    // texture type
    0,                // mip-map level
    gl.RGB,           // internal format
    canvas.width,     // texture width
    canvas.height,    // texture height
    0,                // border value
    gl.RGB,           // format
    gl.UNSIGNED_BYTE, // type
    null              // data
  );

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  console.log(105, "Creating the entry point frame buffer object");

  const entryFramebuffer = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, entryFramebuffer);
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,   // attachment position in the framebuffer
    gl.TEXTURE_2D,          // texture type
    entryTexture,           // target texture
    0                       // mip-map level at which to attach the texture
  );

  console.log(106, "Creating the exit point texture");

  const exitTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, exitTexture);
  gl.texImage2D(
    gl.TEXTURE_2D, 
    0, 
    gl.RGB, 
    canvas.width, 
    canvas.height, 
    0, 
    gl.RGB,
    gl.UNSIGNED_BYTE, null
  )
  ;
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  console.log(107, "Creating the exit point frame buffer");
  
  const exitFramebuffer = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, exitFramebuffer);
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER, 
    gl.COLOR_ATTACHMENT0, 
    gl.TEXTURE_2D,
    exitTexture, 0
  );

  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  console.log(108, "Creating the transfer function texture");

  const transferFunctionTextureID = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, transferFunctionTextureID);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, TransferFunctionTextureRes, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  console.log(109, "Creating the texture holding the volume");

  const volumeTexture = gl.createTexture();

  gl.bindTexture(gl.TEXTURE_3D, volumeTexture);

  let modelMatrix = mat4.create();
  {
    console.log(110, "Downloading 'pig.raw' from 'localhost'");

    let response;

    try {
      response = await fetch('pig.raw');
    } catch (error) {
      postError("Error accessing volume 'pig.raw': " + error);
      return;
    }

    if (!response.ok) {
      postError("Error accessing volume 'pig.raw'");
      return;
    }

    console.log(111, "Accessing the blob data from the response");

    const blob = await response.blob();

    console.log(112, "Cast the blob into an array buffer");

    const data = await blob.arrayBuffer();

    console.log(113, "Cast the array buffer into a Uint16 typed array");

    const typedData = new Uint16Array(data);

    console.log(114, "Convert the array into a Uint8 array");

    const convertedData = new Uint8Array(typedData.length)

    for (var i = 0; i < typedData.length; i++) {
      convertedData[i] = typedData[i] / 4096.0 * 256.0
    }

    const volumeSize = [ 512, 512, 134 ];

    console.log(115, "Upload the volume to the GPU");

    gl.texImage3D(
      gl.TEXTURE_3D,    // 3D texture -> volume
      0,                // the mipmap level, still 0
      gl.R8,            // the texture should only have a single component
      volumeSize[0],    // x dimension of the volume
      volumeSize[1],    // y dimension of the volume
      volumeSize[2],    // z dimension of the volume
      0,                // value used for the border voxels
      gl.RED,           // only a single component, and that is Red
      gl.UNSIGNED_BYTE, // each voxel is represented by a single unsigned byte
      convertedData     // the volume data
    );

    mat4.rotate(modelMatrix, modelMatrix, 3 * Math.PI / 2, [1.0, 0.0, 0.0]);
    mat4.scale(modelMatrix, modelMatrix, [1.0, 1.0, 0.7052631578947368]);
  }

  gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);

  let projectionMatrix = mat4.create();
  {
    const fieldOfView = 45 * 2.0 * Math.PI / 360.0;   // 45 degrees in radians
    const aspectRatio = gl.canvas.clientWidth / gl.canvas.clientHeight; // assuming > 1.0
    const zNear = 0.1;  // Near clipping plane
    const zFar = 100.0; // Far clipping plane

    mat4.perspective(projectionMatrix, fieldOfView, aspectRatio, zNear, zFar);
  }

  function internalRender() 
  {
    if (TransferFunctionIsDirty) {
      updateTransferFunction(gl, transferFunctionTextureID);
      TransferFunctionIsDirty = false;
      RenderingIsDirty = true;
    }

    if (!RenderingIsDirty) {
      requestAnimationFrame(internalRender);
      return;
    }

    let viewMatrix = mat4.create();
    {
      const r = document.getElementById("camera-r").value / 10.0;
      const phi = document.getElementById("camera-phi").value;

      const phiRad = phi * Math.PI / 180.0;
      const theta = document.getElementById("camera-theta").value;
      const thetaRad = theta * Math.PI / 180.0;

      const x = r * Math.sin(thetaRad) * Math.cos(phiRad);
      const y = r * Math.sin(thetaRad) * Math.sin(phiRad);
      const z = r * Math.cos(thetaRad);

      mat4.lookAt(viewMatrix, [x, y, z], [0,0,0], [0, 0, 1]);
    }

    renderBoundingbox(
      gl, 
      boundingBoxProgram, 
      modelMatrix, 
      viewMatrix, 
      projectionMatrix,
      entryFramebuffer, 
      exitFramebuffer
    );

    const stepSize = 0.1 - 0.000990 * document.getElementById("stepSize").value;
    const compositing = document.querySelector('input[name="compositing"]:checked').value;
    const renderType = document.querySelector('input[name="debug-output"]:checked').value;
    
    renderVolume(
      gl, 
      volumeRenderingProgram, 
      volumeTexture, 
      entryTexture, 
      exitTexture,
      transferFunctionTextureID, 
      stepSize, 
      compositing, 
      renderType
    );

    requestAnimationFrame(internalRender);

    RenderingIsDirty = false;
  }

  console.log(116, "Trigger the initial rendering");

  requestAnimationFrame(internalRender);
}

function triggerRendering() {
  RenderingIsDirty = true;
}

function triggerTransferFunctionUpdate() {
  TransferFunctionIsDirty = true;
}

function postError(msg) {
  document.getElementById("error").innerHTML =
   document.getElementById("error").innerHTML + "<p>" + msg + "</p>";
}
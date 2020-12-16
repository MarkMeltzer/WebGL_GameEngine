var time = 0.0;
var mouseChange = [0, 0];
var cameraGlobal = null;

function main(sceneJSON) {
    // Find our webGL canvas
    const canvas = document.querySelector("#glCanvas");
    const gl = canvas.getContext("webgl");

    // Make sure gl could be initialized
    if (gl == null) {
        alert("Unable to initialize WebGL. Your browser or machine may not support it.");
        return;
    }

    // Set up pointer lock and mouse tracking
    canvas.requestPointerLock = canvas.requestPointerLock || canvas.mozRequestPointerLock;
    canvas.onclick = function() {
        canvas.requestPointerLock();
    }
    document.addEventListener('pointerlockchange', function() {
        lockChangeAlert(canvas);
    }, false);
    document.addEventListener('mozpointerlockchange', function() {
        lockChangeAlert(canvas);
    }, false);

    // Create camera and save it in the global
    let playerCamera = new Camera();
    cameraGlobal = playerCamera;
    
    // Set up input tracking
    const keyTracker = {
        'a' : {pressed: false, func: cameraGlobal.moveLeft},
        'd' : {pressed: false, func: cameraGlobal.moveRight},
        'w' : {pressed: false, func: cameraGlobal.moveForward},
        's' : {pressed: false, func: cameraGlobal.moveBackward}
    }
    canvas.addEventListener('keydown', function() {
        if (keyTracker[event.key.toLowerCase()]) {
            keyTracker[event.key.toLowerCase()].pressed = true;
        }
    });
    canvas.addEventListener('keyup', function() {
        if (keyTracker[event.key.toLowerCase()]) {
            keyTracker[event.key.toLowerCase()].pressed = false;
        }
    });

    // Shader source code in GLSL
    const vsSource = `
        attribute vec4 aVertexPosition;
        attribute vec3 aVertexNormal;
        attribute vec4 aVertexColor;

        uniform mat4 uNormalMatrix;
        uniform mat4 uModelViewMatrix;
        uniform mat4 uProjectionMatrix;
        uniform vec3 uLightDirection;

        varying highp vec4 vColor;
        varying highp vec3 vLighting;

        void main() {
            gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;

            highp vec3 ambientLight = vec3(0.3, 0.3, 0.3);
            highp vec3 directionalLightColor = vec3(1, 1, 1);
            highp vec3 directionalVector = normalize(uLightDirection);

            highp vec4 transformedNormal = uNormalMatrix * vec4(aVertexNormal, 1.0);

            highp float directional = max(dot(transformedNormal.xyz, directionalVector), 0.0);
            vLighting = ambientLight + (directionalLightColor * directional);

            vColor = aVertexColor;
        }
    `;

    const fsSource = `
        varying highp vec4 vColor;
        varying highp vec3 vLighting;

        void main() {
            highp vec4 color = vColor;
            gl_FragColor = vec4(color.xyz * vLighting, color.w);
        }
    `;

    // Load and compile the shaders
    const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

    const programInfo = {
        program: shaderProgram,
        attribLocations: {
            vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
            vertexNormal: gl.getAttribLocation(shaderProgram, 'aVertexNormal'),
            vertexColor: gl.getAttribLocation(shaderProgram, 'aVertexColor')
        },
        uniformLocations: {
            projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
            modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
            normalMatrix: gl.getUniformLocation(shaderProgram, 'uNormalMatrix'),
            lightDirection: gl.getUniformLocation(shaderProgram, 'uLightDirection')
        }
    };

    var objectArray = parseSceneJSON(gl, sceneJSON);

    // load texture
    const texture = loadTexture(gl, 'texture.png');

    // Draw the scene
    var then = 0;
    var counter = 0;
    function render(now) {
        now *= 0.001;
        const deltaTime = now - then;
        then = now;

        // counter++;
        // if (counter == 60) {
        //     console.log(1 / deltaTime);
        //     counter = 0;
        // }

        // handle input
        handleKeyboardInput(keyTracker);
        handleMouseInput();

        drawScene(gl, programInfo, objectArray);
        
        time += deltaTime;
        
        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

    console.log("DONE!");
}

function handleMouseInput() {
    var currentMouseChange = mouseChange;
    mouseChange = [0, 0];
    cameraGlobal.turnCamera(currentMouseChange);
}

function handleKeyboardInput(keyTracker) {
    for (var key in keyTracker) {
        if (keyTracker[key].pressed) {
            keyTracker[key].func();
        }
    }
}

function lockChangeAlert(canvas) {
    if (document.pointerLockElement === canvas ||
        document.mozPointerLockElement === canvas) {
            document.addEventListener("mousemove", updateMousePosition, false);
        } else {
            document.removeEventListener("mousemove", updateMousePosition, false);
        }
}

function updateMousePosition() {
    mouseChange[0] += event.movementX;
    mouseChange[1] += event.movementY;
}

function lerp(a, b, x) {
    return (1 - x) * a + x * b;
}

function initShaderProgram(gl, vsSource, fsSource) {
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);


    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert('Unable to intialize shader program: ' + gl.getProgramInfoLog(shaderProgram));
        return null;
    }

    return shaderProgram;
}

function loadShader(gl, type, source) {
    const shader = gl.createShader(type);

    gl.shaderSource(shader, source);

    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert('An error occured compiling the shaders: ' + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }

    return shader;
}

function createBox(width, height, depth) {
    const positions = [
        // Front face
        -width / 2, -height / 2,  depth / 2,
        -width / 2, height / 2, depth / 2,
        width / 2, height / 2, depth / 2,
        width / 2, -height / 2, depth / 2,
        
        // Back face
        -width / 2, -height / 2, -depth / 2,
        width / 2, -height / 2, -depth / 2,
        width / 2, height / 2, -depth / 2,
        -width / 2, height / 2, -depth / 2,
        
        // Top face
        -width / 2, height / 2, -depth / 2,
        width / 2, height / 2, -depth / 2,
        width / 2, height / 2, depth / 2,
        -width / 2, height / 2, depth / 2,
        
        // Bottom face
        -width / 2, -height / 2, -depth / 2,
        -width / 2, -height / 2, depth / 2,
        width / 2, -height / 2, depth / 2,
        width / 2, -height / 2, -depth / 2,
        
        // Right face
        width / 2, height / 2, -depth / 2,
        width / 2, -height / 2, -depth / 2,
        width / 2, -height / 2, depth / 2,
        width / 2, height / 2, depth / 2,
        
        // Left face
        -width / 2, height / 2, -depth / 2,
        -width / 2, height / 2, depth / 2,
        -width / 2, -height / 2, depth / 2,
        -width / 2, -height / 2, -depth / 2,
    ];

    // Vertex normals
    const normals = [
        // Front
         0.0,  0.0,  1.0,
         0.0,  0.0,  1.0,
         0.0,  0.0,  1.0,
         0.0,  0.0,  1.0,
    
        // Back
         0.0,  0.0, -1.0,
         0.0,  0.0, -1.0,
         0.0,  0.0, -1.0,
         0.0,  0.0, -1.0,
    
        // Top
         0.0,  1.0,  0.0,
         0.0,  1.0,  0.0,
         0.0,  1.0,  0.0,
         0.0,  1.0,  0.0,
    
        // Bottom
         0.0, -1.0,  0.0,
         0.0, -1.0,  0.0,
         0.0, -1.0,  0.0,
         0.0, -1.0,  0.0,
    
        // Right
         1.0,  0.0,  0.0,
         1.0,  0.0,  0.0,
         1.0,  0.0,  0.0,
         1.0,  0.0,  0.0,
    
        // Left
        -1.0,  0.0,  0.0,
        -1.0,  0.0,  0.0,
        -1.0,  0.0,  0.0,
        -1.0,  0.0,  0.0
    ];

    const color = [Math.random(), Math.random(), Math.random()];
    var colors = [];
    for (var i=0; i<24; i++) {
        colors.push(color[0]);
        colors.push(color[1]);
        colors.push(color[2]);
        colors.push(1.0);
    }

    // Vertex colors
    // const colors = [
    //     // Front
    //     1.0, 0.0, 0.0, 1.0,
    //     1.0, 0.0, 0.0, 1.0,
    //     1.0, 0.0, 0.0, 1.0,
    //     1.0, 0.0, 0.0, 1.0,
    //     // Back
    //     0.0, 1.0, 0.0, 1.0,
    //     0.0, 1.0, 0.0, 1.0,
    //     0.0, 1.0, 0.0, 1.0,
    //     0.0, 1.0, 0.0, 1.0,
    //     // Top
    //     0.0, 0.0, 1.0, 1.0,
    //     0.0, 0.0, 1.0, 1.0,
    //     0.0, 0.0, 1.0, 1.0,
    //     0.0, 0.0, 1.0, 1.0,
    //     // Bottom
    //     1.0, 0.0, 1.0, 1.0,
    //     1.0, 0.0, 1.0, 1.0,
    //     1.0, 0.0, 1.0, 1.0,
    //     1.0, 0.0, 1.0, 1.0,
    //     // Right
    //     0.0, 1.0, 1.0, 1.0,
    //     0.0, 1.0, 1.0, 1.0,
    //     0.0, 1.0, 1.0, 1.0,
    //     0.0, 1.0, 1.0, 1.0,
    //     // Left
    //     1.0, 1.0, 0.0, 1.0,
    //     1.0, 1.0, 0.0, 1.0,
    //     1.0, 1.0, 0.0, 1.0,
    //     1.0, 1.0, 0.0, 1.0,
    // ];

    // Face->vertex indices
    const indices = [
        0,  1,  2,      0,  2,  3,    // front
        4,  5,  6,      4,  6,  7,    // back
        8,  9,  10,     8,  10, 11,   // top
        12, 13, 14,     12, 14, 15,   // bottom
        16, 17, 18,     16, 18, 19,   // right
        20, 21, 22,     20, 22, 23,   // left
    ];

    return {
        vertexPositions: positions,
        vertexNormals: normals,
        vertexIndices: indices,
        vertexColors: colors
    };
}

function createBuffersFromObjectData(gl, objectData) {    
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(objectData.vertexPositions), gl.STATIC_DRAW);

    const normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(objectData.vertexNormals), gl.STATIC_DRAW);


    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(objectData.vertexColors), gl.STATIC_DRAW);

    
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(objectData.vertexIndices), gl.STATIC_DRAW);

    return {
        position: positionBuffer,
        normal: normalBuffer,
        colors: colorBuffer,
        indices: indexBuffer
    };
}

function drawScene(gl, programInfo, objectArray) {
    // Set settings
    gl.clearColor(0.75, 0.88, 0.92, 1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    // Clear screen
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Create projection matrix
    const fieldOfView = 45 * Math.PI / 180;
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const zNear = 0.1;
    const zFar = 100.0;
    const projectionMatrix = mat4.create();
    mat4.perspective(projectionMatrix,
                     fieldOfView,
                     aspect,
                     zNear,
                     zFar);

    var sinAnim = Math.sin(time) / 2 + 0.5;
    var cosAnim = Math.cos(time) / 2 + 0.5;

    // create camera matrix
    const cameraMatrix = mat4.create();
    cameraGlobal.getViewMatrix(cameraMatrix);
    
    // mat4.rotate(cameraMatrix,
    //             cameraMatrix,
    //             cameraAngleX,
    //             [0, 1, 0]);
    // mat4.translate(cameraMatrix,
    //                 cameraMatrix,
    //                 [cameraPos[0],0,cameraPos[1]]);

    // mat4.invert(cameraMatrix,
    //             cameraMatrix);

    // create projectionCameraMatrix
    mat4.mul(projectionMatrix,
            projectionMatrix,
            cameraMatrix);


    // loop over all objects in the scene
    for (var i=0; i<objectArray.length; i++) {
        object = objectArray[i];

        // Create view matrix
        const modelViewMatrix = mat4.create();
        
        // Translate the object to its position
        mat4.translate(modelViewMatrix,
            modelViewMatrix,
            object.position);

        // animate the object
        if (object.animate) {
            mat4.translate(modelViewMatrix,
                            modelViewMatrix,
                            [6 * sinAnim - 3, 0, 6 * cosAnim - 3]);

            // rotate the viewmatrix
            mat4.rotate(modelViewMatrix,
                        modelViewMatrix,
                        time * object.rotSpeedFactor,
                        object.rotAxis);
        }

        // Tell WebGL how to pull out the positions from the position
        // buffer into the vertexPosition attribute
        {
            const numComponents = 3;
            const type = gl.FLOAT;
            const normalize = false;
            const stride = 0;
            const offset = 0;
            gl.bindBuffer(gl.ARRAY_BUFFER, object.buffers.position);
            gl.vertexAttribPointer(
                programInfo.attribLocations.vertexPosition, 
                numComponents, 
                type, 
                normalize, 
                stride, 
                offset);
            gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
        }

        // Tell webgl how to pull vertexnormals out of buffer
        {
            const numComponents = 3;
            const type = gl.FLOAT;
            const normalize = false;
            const stride = 0;
            const offset = 0;
            gl.bindBuffer(gl.ARRAY_BUFFER, object.buffers.normal);
            gl.vertexAttribPointer(
                programInfo.attribLocations.vertexNormal, 
                numComponents, 
                type, 
                normalize, 
                stride, 
                offset);
            gl.enableVertexAttribArray(programInfo.attribLocations.vertexNormal);
        }

        // Tell WebGL how to pull out the colors from the colorbuffer
        {
            const numComponents = 4;
            const type = gl.FLOAT;
            const normalize = false;
            const stride = 0;
            const offset = 0;
            gl.bindBuffer(gl.ARRAY_BUFFER, object.buffers.colors);
            gl.vertexAttribPointer(
                programInfo.attribLocations.vertexColor, 
                numComponents, 
                type, 
                normalize, 
                stride, 
                offset);
            gl.enableVertexAttribArray(programInfo.attribLocations.vertexColor);
        }

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, object.buffers.indices);
        gl.useProgram(programInfo.program);

        // Set the shader uniforms
        gl.uniformMatrix4fv(
            programInfo.uniformLocations.projectionMatrix, 
            false, 
            projectionMatrix);

        gl.uniformMatrix4fv(
            programInfo.uniformLocations.modelViewMatrix, 
            false, 
            modelViewMatrix);

        gl.uniform3fv(
            programInfo.uniformLocations.lightDirection, 
            [0.85, 0.8, 0.75]);

        const normalMatrix = mat4.create();
        mat4.invert(normalMatrix, modelViewMatrix);
        mat4.transpose(normalMatrix, normalMatrix);
        gl.uniformMatrix4fv(
            programInfo.uniformLocations.normalMatrix,
            false,
            normalMatrix);

        // issue a draw call for the current object
        {
            const offset = 0;
            const type = gl.UNSIGNED_SHORT;
            const vertexCount = object.numVertices;
            gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
        }
    }
}

function loadTexture(gl, url) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // fill texture with temporary blue pixel until texture is loaded
    const level = 0;
    const internalFormat = gl.RGBA;
    const width = 1;
    const height = 1;
    const border = 0;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;
    const pixel = new Uint8Array([0,0,255,255]);
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, width, height, border, srcFormat, srcType, pixel);

    const image = new Image();
    image.onload = function() {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, srcFormat, srcType, image);
        
        if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
            gl.generateMipmap(gl.TEXTURE_2D);
        } else {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        }
    };
    image.crossOrigin = "";
    image.src = url;


    return texture
}

function isPowerOf2(value) {
    return (value & (value - 1)) == 0;
}

function loadJSON() {
    const path = "objects.json";

    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function() {
        if (this.readyState == 4) {
            if (this.status == 200) {
                main(JSON.parse(this.responseText));
            } else {
                console.log("Error loading JSON! :( " + this.statusText);
            }
        }
    };
    xmlhttp.open("GET", path, true);
    xmlhttp.send(); 
}

function parseSceneJSON(gl, JSON_obj) {
    var objectArray = [];

    for (var i = 0; i < JSON_obj.objects.length; i++) {
        var object = JSON_obj.objects[i];

        var boxData = createBox(object.sizes[0], object.sizes[1], object.sizes[2]);
        var boxBuffers = createBuffersFromObjectData(gl, boxData);
        var box = {
            numVertices: boxData.vertexIndices.length,
            buffers: boxBuffers,
            position: object.position,
            rotAxis: object.rotAxis,
            rotSpeedFactor: object.rotSpeedFactor,
            animate: object.animate
        }
        objectArray.push(box);
    }

    return objectArray;
}

function degToRadians(deg) {
    return deg * Math.PI / 180;
}

var Camera = function() {
    this.position = [0,0,10];
    this.worldUp = [0,1,0];
    this.yaw = -90;
    this.pitch = 0;
    this.front = [0,0,-1];
    this.movementSpeed = 0.1;
    this.turnSpeed = 2.5;

    // Bind 'this' in the methods to this camera object because javascript
    this.moveLeft = this.moveLeft.bind(this);
    this.moveRight = this.moveRight.bind(this);
    this.moveForward = this.moveForward.bind(this);
    this.moveBackward = this.moveBackward.bind(this);
    this.turnCamera = this.turnCamera.bind(this);

    this.updateVectors();
}

Camera.prototype.updateVectors = function() {
    const front = vec3.create();
    front[0] = Math.cos(degToRadians(this.yaw)) * Math.cos(degToRadians(this.pitch));
    front[1] = Math.sin(degToRadians(this.pitch));
    front[2] = Math.sin(degToRadians(this.yaw)) * Math.cos(degToRadians(this.pitch));
    vec3.normalize(front, front);
    this.front = front;

    const right = vec3.create();
    vec3.cross(right, this.front, this.worldUp);
    vec3.normalize(right, right);
    this.right = right;

    const up = vec3.create();
    vec3.cross(up, this.right, this.front);
    vec3.normalize(up, up);
    this.up = up;
}

Camera.prototype.getViewMatrix = function(out) {
    const target = vec3.create();
    vec3.add(target, this.position, this.front);
    mat4.lookAt(out, this.position, target, this.up);
}

Camera.prototype.moveForward = function() {
    this.position[0] += this.front[0] * this.movementSpeed;
    this.position[1] += this.front[1] * this.movementSpeed;
    this.position[2] += this.front[2] * this.movementSpeed;
}

Camera.prototype.moveBackward = function() {
    this.position[0] -= this.front[0] * this.movementSpeed;
    this.position[1] -= this.front[1] * this.movementSpeed;
    this.position[2] -= this.front[2] * this.movementSpeed;
}

Camera.prototype.moveRight = function() {
    this.position[0] += this.right[0] * this.movementSpeed;
    this.position[1] += this.right[1] * this.movementSpeed;
    this.position[2] += this.right[2] * this.movementSpeed;
}

Camera.prototype.moveLeft = function() {
    this.position[0] -= this.right[0] * this.movementSpeed;
    this.position[1] -= this.right[1] * this.movementSpeed;
    this.position[2] -= this.right[2] * this.movementSpeed;
}

Camera.prototype.turnCamera = function(mouseChange) {
    const xChange = mouseChange[0] * this.turnSpeed * 0.05;
    const yChange = mouseChange[1] * this.turnSpeed * 0.05;

    this.yaw += xChange;
    this.pitch -= yChange;
    if (this.pitch < -89) {
        this.pitch = -89;
    }

    this.updateVectors();
}
window.onload = loadJSON;
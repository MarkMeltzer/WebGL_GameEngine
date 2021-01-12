var Shader = function(
    gl,
    vsSource,
    fsSource,
    attributeNames,
    uniformNames,
) {
    this.gl = gl;
    this.vsSource = vsSource;
    this.fsSource = fsSource;

    this.program = this.initShaderProgram(vsSource, fsSource);

    // get and save the shader variable locations
    this.attribLocations = this.getAttribLocations(attributeNames);
    this.uniformLocations = this.getUniformLocations(uniformNames);
}

Shader.prototype.initShaderProgram = function(vsSource, fsSource) {
    const gl = this.gl;
    
    // load shaders
    const vertexShader = this.loadShader(gl.VERTEX_SHADER, vsSource);
    const fragmentShader = this.loadShader(gl.FRAGMENT_SHADER, fsSource);

    // create program and attach shaders
    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    // check for linking success
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert('Unable to initialize shader program: ' + gl.getProgramInfoLog(shaderProgram));
        return null;
    }

    return shaderProgram;    
}

Shader.prototype.loadShader = function(type, source) {
    const gl = this.gl;

    // create shader and compile from source
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    // check for compilation success
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert('An error occured while compiling the shader: ' + gl.getShaderInfoLog(shader) + source);
        gl.deleteShader(shader);
        return null;
    }

    return shader;
}

Shader.prototype.getAttribLocations = function(attributeNames) {
    const gl = this.gl;

    if (!this.program) {
        alert("Shaderprogram not set while getting attribute locations!");
        return;
    }

    var attribLocations = {};
    for (var i = 0; i < attributeNames.length; i++) {
        const attributeName = attributeNames[i];
        attribLocations[attributeName] = gl.getAttribLocation(
            this.program,
            attributeName
        );
    }
    return attribLocations;
}

Shader.prototype.getUniformLocations = function(uniformNames) {
    const gl = this.gl;

    if (!this.program) {
        alert("Shaderprogram not set while getting uniform locations!");
        return;
    }

    var uniformLocations = {};
    for (var i = 0; i < uniformNames.length; i++) {
        const uniformName = uniformNames[i];
        uniformLocations[uniformName] = gl.getUniformLocation(
            this.program,
            uniformName
        );
    }
    return uniformLocations;
}
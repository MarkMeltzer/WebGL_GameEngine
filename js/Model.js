var Model = function(
    gl,
    filePath,
    texturePath,
    castShadow = true,
    rotAxis = [0, 0, 0],
    animateTrans = false,
    animateRot = false,
    rotSpeedFactor = 1
) {
    this.gl = gl;

    this.filePath = filePath; // TODO change to meshPath
    this.mesh = null;
    
    this.texturePath = texturePath;
    this.material = null;

    // this.modelSpaceAABB = null;

    this.buffers = {
        index: null,
        normal: null,
        position: null,
        texCoord: null,
        texture: null,
        // AABBVerts: null
    };

    this.renderSettings = {
        render: true,
        castShadow: castShadow
    };

    this.animation = {
        animateRot: animateRot,
        rotAxis: rotAxis,
        rotSpeedFactor: rotSpeedFactor,
        animateTrans: animateTrans
    };
}

Model.prototype.setMeshBuffers = function() {
    if (!this.mesh) {
        console.log("Error while setting mesh buffers for model: no mesh set");
        return;
    }

    const gl = this.gl;
    
    // vertex positions
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(this.mesh.vertPositions),
        gl.STATIC_DRAW
    );
    this.buffers.position = positionBuffer;

    // vertex normals
    const normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(this.mesh.vertNormals),
        gl.STATIC_DRAW
    );
    this.buffers.normal = normalBuffer;

    // texture coordinates
    const textureCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(this.mesh.texCoords),
        gl.STATIC_DRAW
    );
    this.buffers.texCoord = textureCoordBuffer;

    // vertex indices
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(
        gl.ELEMENT_ARRAY_BUFFER,
        new Uint16Array(this.mesh.vertIndices),
        gl.STATIC_DRAW
    );
    this.buffers.index = indexBuffer;
}

Model.prototype.setTextureBuffer = function() {
    if (!this.material) {
        console.log("Error while setting texture buffer for model: no material set");
        return;
    }

    const gl = this.gl;

    const texture = this.material.diffuseTexture;

    // create a new buffer and set the new texture
    const textureBuffer = gl.createTexture();
    this.buffers.texture = textureBuffer;
    gl.bindTexture(gl.TEXTURE_2D, this.buffers.texture);
    gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        texture
    );
    
    // No power of 2? No mipmap for you!
    if (isPowerOf2(texture.width) && isPowerOf2(texture.height)) {
        gl.generateMipmap(gl.TEXTURE_2D);
    } else {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }
}

// Model.prototype.setAABBBuffer = function() {
//     const gl = this.gl;

//     // create the modelspace AABB bounds
//     this.createModelSpaceAABB();

//     // convert the bounds into vertices for drawing
//     const AABBVerts = getAABBVertsFromBounds(this.modelSpaceAABB);

//     // fill the buffer with the vertices
//     if (!this.buffers.AABBVerts) {
//         // if theres no buffer yet, create one.
//         const AABBBuffer = gl.createBuffer();
//         gl.bindBuffer(gl.ARRAY_BUFFER, AABBBuffer);
//         gl.bufferData(
//             gl.ARRAY_BUFFER,
//             new Float32Array(AABBVerts),
//             gl.STATIC_DRAW
//         );
    
//         this.buffers.AABBVerts = AABBBuffer;
//     } else {
//         gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.AABBVerts);
//         gl.bufferSubData(
//             gl.ARRAY_BUFFER,
//             0,
//             new Float32Array(AABBVerts)
//         );
//     }
// }

/**
 * Creates Axis-aligned bounding box from the mesh of the current mesh in
 * model space.
 */
Model.prototype.getModelAABB = function() {
    if (!this.mesh) {
        console.log("Error while creating AABB for model: No" + 
                    " mesh set.")
        return;
    }

    var minX = Infinity;
    var maxX = -Infinity;
    var minY = Infinity;
    var maxY = -Infinity;
    var minZ = Infinity;
    var maxZ = -Infinity;
    
    for (var i = 0; i < this.mesh.vertPositions.length; i += 3) {
        const x = this.mesh.vertPositions[i];
        const y = this.mesh.vertPositions[i+1];
        const z = this.mesh.vertPositions[i+2];

        if (x < minX) {
            minX = x;
        } else if (x > maxX) {
            maxX = x;
        }

        if (y < minY) {
            minY = y;
        } else if (y > maxY) {
            maxY = y;
        }

        if (z < minZ) {
            minZ = z;
        } else if (z > maxZ) {
            maxZ = z;
        }
    }

    return {
        "minX" : minX,
        "maxX" : maxX,
        "minY" : minY,
        "maxY" : maxY,
        "minZ" : minZ,
        "maxZ" : maxZ,
    }
}
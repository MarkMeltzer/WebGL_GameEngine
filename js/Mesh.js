class Mesh {
    constructor(
        gl,
        id,
        path,
        vertPositions,
        vertNormals,
        vertTangents,
        vertBitangents,
        vertIndices,
        texCoords
    ) {
        this.gl = gl;
        this.id = id;
        this.path = path;
        this.vertPositions = vertPositions;
        this.vertNormals = vertNormals;
        this.vertTangents = vertTangents;
        this.vertBitangents = vertBitangents;
        this.vertIndices = vertIndices;
        this.texCoords = texCoords;

        this.buffers = {
            index: null,
            normal: null,
            position: null,
            tangent: null,
            bitangent: null,
            texCoord: null
        };
        this.setBuffers();
    }

    // TODO: add function comment
    getNumVerts() {
        return this.vertIndices.length;
    }

    // TODO: add function comment
    setBuffers() {
        const gl = this.gl;

        // vertex positions
        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array(this.vertPositions),
            gl.STATIC_DRAW
        );
        this.buffers.position = positionBuffer;

        // vertex normals
        const normalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array(this.vertNormals),
            gl.STATIC_DRAW
        );
        this.buffers.normal = normalBuffer;

        // texture coordinates
        const textureCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array(this.texCoords),
            gl.STATIC_DRAW
        );
        this.buffers.texCoord = textureCoordBuffer;

        // vertex tangents
        const tangentBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, tangentBuffer);
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array(this.vertTangents),
            gl.STATIC_DRAW
        );
        this.buffers.tangent = tangentBuffer;

        // vertex bitangents
        const bitangentBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, bitangentBuffer);
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array(this.vertBitangents),
            gl.STATIC_DRAW
        );
        this.buffers.bitangent = bitangentBuffer;

        // vertex indices
        const indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(
            gl.ELEMENT_ARRAY_BUFFER,
            new Uint16Array(this.vertIndices),
            gl.STATIC_DRAW
        );
        this.buffers.index = indexBuffer;
    }

    // TODO: add function comment
    toJSON() {
        return {
            "id" : this.id,
            "path" : this.path
        }
    }
}
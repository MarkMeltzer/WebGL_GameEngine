class Mesh {
    constructor(
        gl,
        id,
        vertPositions,
        vertNormals,
        vertIndices,
        texCoords
    ) {
        this.gl = gl;
        this.id = id;
        this.vertPositions = vertPositions;
        this.vertNormals = vertNormals;
        this.vertIndices = vertIndices;
        this.texCoords = texCoords;

        this.buffers = {
            index: null,
            normal: null,
            position: null,
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
}
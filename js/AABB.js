class AABB {
    constructor(gl, minX = -1, maxX = 1, minY = -1, maxY = 1, minZ = -1, maxZ = 1) {
        this.gl = gl;
        
        this.bounds = {
            "minX" : minX,
            "maxX" : maxX,
            "minY" : minY,
            "maxY" : maxY,
            "minZ" : minZ,
            "maxZ" : maxZ,
        }

        this.render = false;

        this.renderBuffer = null;
        this.createRenderBuffer();
    }
    
    // TODO: add function comment
    createRenderBuffer() {
        const gl = this.gl;

        // convert the bounds into vertices for drawing
        const AABBVerts = getAABBVertsFromBounds(this.bounds);

        // fill the buffer with the vertices
        if (!this.renderBuffer) {
            // if theres no buffer yet, create one.
            const AABBBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, AABBBuffer);
            gl.bufferData(
                gl.ARRAY_BUFFER,
                new Float32Array(AABBVerts),
                gl.STATIC_DRAW
            );
        
            this.renderBuffer = AABBBuffer;
        } else {
            gl.bindBuffer(gl.ARRAY_BUFFER, this.renderBuffer);
            gl.bufferSubData(
                gl.ARRAY_BUFFER,
                0,
                new Float32Array(AABBVerts)
            );
        }
    }
    
    // TODO: add function comment
    setBounds(AABBBounds) {
        this.bounds = AABBBounds;
        this.createRenderBuffer();
    }

    toJSON() {
        return this.bounds;
    }
}
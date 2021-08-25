class Texture {
    constructor(gl, id, path, type, data) {
        this.gl = gl;
        this.id = id;
        this.path = path;
        this.type = type;   // diffuse, normal
        this.data = data;

        this.buffer = null;
        this.setBuffer();
    }

    // TODO: add function comment
    setBuffer() {
        const gl = this.gl;

        // create a new buffer and set the new texture
        const textureBuffer = gl.createTexture();
        this.buffer = textureBuffer;
        gl.bindTexture(gl.TEXTURE_2D, this.buffer);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            this.data
        );
        
        // No power of 2? No mipmap for you!
        if (isPowerOf2(this.data.width) && isPowerOf2(this.data.height)) {
            gl.generateMipmap(gl.TEXTURE_2D);
        } else {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        }
    }

    toJSON() {
        return {
            "id" : this.id,
            "type" : this.type,
            "path" : this.path
        }
    }
}
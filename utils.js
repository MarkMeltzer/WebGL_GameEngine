function loadJSON(path, callback) {
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function() {
        if (this.readyState == 4) {
            if (this.status == 200) {
                callback(JSON.parse(this.responseText));
            } else {
                console.log("Error loading JSON! :(, status: " + this.statusText);
            }
        }
    };
    xmlhttp.open("GET", path, true);
    xmlhttp.send(); 
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
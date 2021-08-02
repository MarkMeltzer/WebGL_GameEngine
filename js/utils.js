// TODO: add comments and function comments to this file
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

function loadOBJ(path, callback) {
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function() {
        if (this.readyState == 4) {
            if (this.status == 200) {
                callback(this.responseText);
            } else {
                console.log("Error loading OBJ file! :( \n\tstatus: " + this.statusText
                            + "\n\tfile path: " + path);
            }
        }
    };
    xmlhttp.open("GET", path, true);
    xmlhttp.send(); 
}


function createBoxMeshData(width, height, depth) {
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

    // Texture coordinates
    const textureCoords = [
        // Front
        1.0,  1.0,
        1.0,  0.0,
        0.0,  0.0,  
        0.0,  1.0,
    
        // Back
        0.0,  0.0,  
        1.0,  0.0,
        1.0,  1.0,
        0.0,  1.0,
    
        // Top
        0.0,  0.0,  
        1.0,  0.0,
        1.0,  1.0,
        0.0,  1.0,
    
        // Bottom
        0.0,  0.0,  
        1.0,  0.0,
        1.0,  1.0,
        0.0,  1.0,
    
        // Right
        0.0,  0.0,  
        1.0,  0.0,
        1.0,  1.0,
        0.0,  1.0,
    
        // Left
        0.0,  0.0,  
        1.0,  0.0,
        1.0,  1.0,
        0.0,  1.0,
    ];

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
        textureCoords: textureCoords
    };
}

function parseOBJFile(OBJFile) {
    // Assumptions and limitations:
    // - Each face consists of a single triangle.
    // - For each vertex in a coord a vertex, texcoord and normal is defined (so v/vt/n).
    // - No actual support for materials.

    // Step 1: load the v, vt's and vn
    // Go over the vertices (v), vertex texture coordinates (vt) and vertex normals (vn)
    // and add these to their respective arrays (convert them to float arrays). Lets call
    // these input arrays
    //
    // Step 2: create and fill the index array
    // Have new empty vertex, texcoord, normal and index array.
    // Have a index counter start at 0.
    // Have an dict to keep track of identical vertex/texCoord/normal triplet and it's associated index.
    // For each v/vt/vn triplet in a face:
        // if (triplet in dict):
            // append the associated index into the index array
        // else:
            // Use the v/vt/vn to index into the input arrays (remember to convert from 1 indexed to 0 indexed),
            // and append the v, vt and vn to their respective output arrays.
            //
            // Append the index to the index array.
            //
            // Add the v/vt/vn triplet to the dict and associate it with an index (the index counter).
            //
            // Increment the index counter. 

    const lines = OBJFile.toString().split("\n");

    // Iterate over the file and collect vertices, texture coordinates and
    // vertex normals.
    var inputVertices = [];
    var inputTexCoords = [];
    var inputNormals = [];
    var counter = 0;
    for (var i = 0; i < lines.length; i++) {
        const line = lines[i].split(" ");

        switch (line[0]) {
            case "v":
                counter++;
                inputVertices.push(line.slice(1).map(x => parseFloat(x)));
                break
            case "vt":
                inputTexCoords.push(line.slice(1).map(x => parseFloat(x)));
                break;
            case "vn":
                inputNormals.push(line.slice(1).map(x => parseFloat(x)));
                break;
        }
    }

    // Iterate of the faces and process the vertex triplets
    var outputVertices = [];
    var outputTexCoords = [];
    var outputNormals = [];
    var outputIndices = [];
    var indexCounter = 0;
    var indexDict = {};
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i].split(" ");

        if (line[0] == "f") {
            line = line.slice(1);

            // iterate over vertices in face
            for (var j = 0; j < line.length; j++) {
                const tripletStr = line[j];

                if (tripletStr in indexDict) {
                    // If triplet is associated with index already use that
                    outputIndices.push(indexDict[tripletStr]);
                } else {
                    const triplet = tripletStr.split("/").map(x => parseInt(x));
                    
                    // Add the v, vt, vn and index to output arrays
                    outputVertices.push(inputVertices[triplet[0] - 1]);
                    outputTexCoords.push(inputTexCoords[triplet[1] - 1]);
                    outputNormals.push(inputNormals[triplet[2] - 1]);
                    outputIndices.push(indexCounter);

                    // Associate triplet with index and increment index
                    indexDict[tripletStr] = indexCounter;
                    indexCounter++;
                }   
            }
        }
    }
    
    return {
        vertexPositions: outputVertices.flat(),
        vertexNormals: outputNormals.flat(),
        vertexIndices: outputIndices.flat(),
        textureCoords: outputTexCoords.flat()
    };
}

function isPowerOf2(value) {
    // source: https://webglfundamentals.org/webgl/lessons/webgl-3d-textures.html
    return (value & (value - 1)) == 0;
}

function getAABBVertsFromBounds(AABB) {
    const vertices = [
        AABB.minX, AABB.minY, AABB.minZ,
        AABB.minX, AABB.minY, AABB.maxZ,

        AABB.minX, AABB.minY, AABB.minZ,
        AABB.minX, AABB.maxY, AABB.minZ,

        AABB.minX, AABB.minY, AABB.minZ,
        AABB.maxX, AABB.minY, AABB.minZ,

        AABB.minX, AABB.maxY, AABB.minZ,
        AABB.minX, AABB.maxY, AABB.maxZ,

        AABB.minX, AABB.maxY, AABB.minZ,
        AABB.maxX, AABB.maxY, AABB.minZ,

        AABB.minX, AABB.maxY, AABB.maxZ,
        AABB.maxX, AABB.maxY, AABB.maxZ,

        AABB.minX, AABB.maxY, AABB.maxZ,
        AABB.minX, AABB.minY, AABB.maxZ,

        AABB.maxX, AABB.minY, AABB.maxZ,
        AABB.minX, AABB.minY, AABB.maxZ,

        AABB.maxX, AABB.minY, AABB.maxZ,
        AABB.maxX, AABB.maxY, AABB.maxZ,

        AABB.maxX, AABB.minY, AABB.maxZ,
        AABB.maxX, AABB.minY, AABB.minZ,

        AABB.maxX, AABB.maxY, AABB.minZ,
        AABB.maxX, AABB.maxY, AABB.maxZ,

        AABB.maxX, AABB.maxY, AABB.minZ,
        AABB.maxX, AABB.minY, AABB.minZ
    ];

    return vertices;
}

function arrayEquals(a, b) {
    if (a.length != b.length) {
        return false;
    }

    for (var i = 0; i < a.length; i++) {
        if (a[i] != b[i]) {
            return false;
        }
    }

    return true;
}
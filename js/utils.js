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
    // Vertex coordinates
    const positions = [
        -width / 2, height / 2, -depth / 2,
        width / 2, height / 2, depth / 2,
        width / 2, height / 2, -depth / 2,
        width / 2, height / 2, depth / 2,
        -width / 2, -height / 2, depth / 2,
        width / 2, -height / 2, depth / 2,
        -width / 2, height / 2, depth / 2,
        -width / 2, -height / 2, -depth / 2,
        -width / 2, -height / 2, depth / 2,
        width / 2, -height / 2, -depth / 2,
        -width / 2, -height / 2, depth / 2,
        -width / 2, -height / 2, -depth / 2,
        width / 2, height / 2, -depth / 2,
        width / 2, -height / 2, depth / 2,
        width / 2, -height / 2, -depth / 2,
        -width / 2, height / 2, -depth / 2,
        width / 2, -height / 2, -depth / 2,
        -width / 2, -height / 2, -depth / 2,
        -width / 2, height / 2, depth / 2,
        -width / 2, height / 2, depth / 2,
        -width / 2, height / 2, -depth / 2,
        width / 2, -height / 2, depth / 2,
        width / 2, height / 2, depth / 2,
        width / 2, height / 2, -depth / 2
    ]

    // vertex normals
    const normals = [
        0, 1, 0,
        0, 1, 0,
        0, 1, 0,
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,
        -1, 0, 0,
        -1, 0, 0,
        -1, 0, 0,
        0, -1, 0,
        0, -1, 0,
        0, -1, 0,
        1, 0, 0,
        1, 0, 0,
        1, 0, 0,
        0, 0, -1,
        0, 0, -1,
        0, 0, -1,
        0, 1, 0,
        0, 0, 1,
        -1, 0, 0,
        0, -1, 0,
        1, 0, 0,
        0, 0, -1
    ]

    // Texture coordinates
    const textureCoords = [
        0.875, 0.5,
        0.625, 0.75,
        0.625, 0.5,
        0.625, 0.75,
        0.375, 1,
        0.375, 0.75,
        0.625, 0,
        0.375, 0.25,
        0.375, 0,
        0.375, 0.5,
        0.125, 0.75,
        0.125, 0.5,
        0.625, 0.5,
        0.375, 0.75,
        0.375, 0.5,
        0.625, 0.25,
        0.375, 0.5,
        0.375, 0.25,
        0.875, 0.75,
        0.625, 1,
        0.625, 0.25,
        0.375, 0.75,
        0.625, 0.75,
        0.625, 0.5
    ]

    // vertex indices, each index represents a vertex and each 3 represent a triangle
    const indices = [
        0, 1, 2,
        3, 4, 5,
        6, 7, 8,
        9, 10, 11,
        12, 13, 14,
        15, 16, 17,
        0, 18, 1,
        3, 19, 4,
        6, 20, 7,
        9, 21, 10,
        12, 22, 13,
        15, 23, 16
    ]
    
    const tangents = [
        -8, 0, 0,
        -8, 0, 0,
        -8, 0, 0,
        0, 8, 0,
        0, 8, 0,
        0, 8, 0,
        0, 8, 0,
        0, 8, 0,
        0, 8, 0,
        8, 0, 0,
        8, 0, 0,
        8, 0, 0,
        0, 8, 0,
        0, 8, 0,
        0, 8, 0,
        0, 8, 0,
        0, 8, 0,
        0, 8, 0,
        -8, 0, 0,
        0, 8, 0,
        0, 8, 0,
        8, 0, 0,
        0, 8, 0,
        0, 8, 0
    ]

    const bitangents = [
        16, 0, 8,
        16, 0, 8,
        16, 0, 8,
        -8, -16, 0,
        -8, -16, 0,
        -8, -16, 0,
        0, -16, -8,
        0, -16, -8,
        0, -16, -8,
        -16, 0, 8,
        -16, 0, 8,
        -16, 0, 8,
        0, -16, 8,
        0, -16, 8,
        0, -16, 8,
        8, -16, 0,
        8, -16, 0,
        8, -16, 0,
        0, 0, 8,
        -8, 0, 0,
        0, 0, -8,
        0, 0, 8,
        0, 0, 8,
        8, 0, 0
    ]

    return {
        vertexPositions: positions,
        vertexNormals: normals,
        vertexIndices: indices,
        textureCoords: textureCoords,
        tangents: tangents,
        bitangents: bitangents
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
    var outputTangents = [];
    var outputBitangents = [];
    var indexCounter = 0;
    var indexDict = {};
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i].split(" ");

        // assumption: each face is a triangle
        if (line[0] == "f") {
            line = line.slice(1);

            // iterate over vertices in face
            // TODO: split this up to first collect all verts/vert information
            //       of a triangle, then calculate the tangent and bitangent,
            //       then add the same tan and bitan for each vertex
            const triplet1 = line[0].split("/").map(x => parseInt(x));
            const triplet2 = line[1].split("/").map(x => parseInt(x));
            const triplet3 = line[2].split("/").map(x => parseInt(x));

            const verts = [
                arrayToVec3(inputVertices[triplet1[0] - 1]),
                arrayToVec3(inputVertices[triplet2[0] - 1]),
                arrayToVec3(inputVertices[triplet3[0] - 1])
            ]
            const texCoords = [
                arrayToVec2(inputTexCoords[triplet1[1] - 1]),
                arrayToVec2(inputTexCoords[triplet2[1] - 1]),
                arrayToVec2(inputTexCoords[triplet3[1] - 1])
            ]

            // calculate the tangent and bitangent
            const tangents = calculateTangents(verts, texCoords);

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
                    outputTangents.push(tangents[0]);
                    outputBitangents.push(tangents[1]);
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
        textureCoords: outputTexCoords.flat(),
        tangents: outputTangents.flat(),
        bitangents: outputBitangents.flat()
    };
}

function calculateTangents(verts, texCoords) {
    // src: https://learnopengl.com/Advanced-Lighting/Normal-Mapping
    let edge1 = vec3.create();
    vec3.sub(edge1, verts[1], verts[0]);
    let edge2 = vec3.create();
    vec3.sub(edge2, verts[2], verts[0]);
    let deltaUV1 = vec2.create();
    vec2.sub(deltaUV1, texCoords[1], texCoords[0]);
    let deltaUV2 = vec2.create();
    vec2.sub(deltaUV2, texCoords[2], texCoords[0]);

    const f = 1.0 / (deltaUV1[0] * deltaUV2[1] - deltaUV2[0] * deltaUV1[1]);
    const tangent = [
        f * (deltaUV2[1] * edge1[0] - deltaUV1[1] * edge2[0]),
        f * (deltaUV2[1] * edge1[1] - deltaUV1[1] * edge2[1]),
        f * (deltaUV2[1] * edge1[2] - deltaUV1[1] * edge2[2])
    ];

    const bitangent = [
        f * (-deltaUV2[0] * edge1[0] - deltaUV1[0] * edge2[0]),
        f * (-deltaUV2[0] * edge1[1] - deltaUV1[0] * edge2[1]),
        f * (-deltaUV2[0] * edge1[2] - deltaUV1[0] * edge2[2])
    ];

    return [tangent, bitangent];
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

function arrayToVec3(arr) {
    return vec3.fromValues(arr[0], arr[1], arr[2]);
}

function arrayToVec2(arr) {
    return vec2.fromValues(arr[0], arr[1]);
}
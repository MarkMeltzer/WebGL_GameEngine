var Mesh = function(
    vertPositions,
    vertNormals,
    vertIndices,
    texCoords
) {
    this.vertPositions = vertPositions;
    this.vertNormals = vertNormals;
    this.vertIndices = vertIndices;
    this.texCoords = texCoords;
}

Mesh.prototype.getNumVerts = function() {
    return this.vertIndices.length;
}
var Camera = function(position, fieldOfView, aspect, zNear, zFar) {
    this.position = position;

    this.front = [0,0,-1];
    this.up = [0,1,0];

    this.projectionType = "perspective";
    this.fieldOfView = fieldOfView;
    this.aspect = aspect;
    this.zNear = zNear;
    this.zFar = zFar;
}

Camera.prototype.getProjectionMatrix = function(out) {
    mat4.perspective(
        out,
        glMatrix.toRadian(this.fieldOfView),
        this.aspect,
        this.zNear,
        this.zFar
    );
}

Camera.prototype.getViewMatrix = function(out) {
    const target = vec3.create();
    vec3.add(target, this.position, this.front);
    mat4.lookAt(out, this.position, target, this.up);
}

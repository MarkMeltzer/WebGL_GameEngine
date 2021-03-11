class Camera extends WorldObject {
    constructor(position, fieldOfView, aspect, zNear, zFar) {
        super("Camera", "camera", position=[0, 0, 10]); // Call worldObject contructor
        this.isImmovable = false;

        // this.front = [0,0,-1];
        // this.up = [0,1,0];


        this.projectionType = "perspective";
        this.fieldOfView = fieldOfView;
        this.aspect = aspect;
        this.zNear = zNear;
        this.zFar = zFar;
    }

    getProjectionMatrix(out) {
        mat4.perspective(
            out,
            glMatrix.toRadian(this.fieldOfView),
            this.aspect,
            this.zNear,
            this.zFar
        );
    }

    getViewMatrix = function(out) {
        const target = vec3.create();
        vec3.add(target, this.position, this.front);
        mat4.lookAt(out, this.position, target, this.up);
    }
}
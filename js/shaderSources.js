/**
 * The GLSL source code for the vertex shader used to render to the canvas.
 */
const mainVsSource = `
    attribute vec4 aVertexPosition;
    attribute vec3 aVertexNormal;
    attribute vec2 aTextureCoord;

    uniform mat4 uProjectionMatrix;
    uniform mat4 uCameraMatrix;
    uniform mat4 uModelViewMatrix;

    uniform mat4 uLightSpaceProjection;
    uniform mat4 uLightSpaceCamera;

    uniform mat4 uNormalMatrix;

    uniform vec3 uLightDirection;

    varying highp vec2 vTextureCoord;
    varying highp vec3 vLighting;
    varying highp vec4 vLightSpaceVertex;

    void main() {
        gl_Position = uProjectionMatrix * uCameraMatrix * uModelViewMatrix * aVertexPosition;

        highp vec3 ambientLight = vec3(0.2, 0.2, 0.2);
        highp vec3 directionalLightColor = vec3(1, 1, 1);
        highp vec3 directionalVector = normalize(uLightDirection);

        highp vec4 transformedNormal = uNormalMatrix * vec4(aVertexNormal, 1.0);

        highp float directional = max(dot(transformedNormal.xyz, directionalVector), 0.0);
        vLighting = ambientLight + (directionalLightColor * directional);
        
        vLightSpaceVertex = uLightSpaceProjection * uLightSpaceCamera * uModelViewMatrix * aVertexPosition;

        vTextureCoord = aTextureCoord;
    }
`;


/**
 * The GLSL source code for the fragment shader used to render to the canvas.
 */
const mainFsSource = `
    uniform sampler2D uTexture;
    uniform sampler2D uShadowmap;
    uniform highp float uShadowBias;
    uniform highp float uTexScale;
    uniform bool uRecieveShadow;
    uniform bool uRecieveLighting;

    varying highp vec3 vLighting;
    varying highp vec2 vTextureCoord;
    varying highp vec4 vLightSpaceVertex;

    bool inShadow() {
        // Manually do the perspective division
        highp vec3 vLightSpaceVertex = vLightSpaceVertex.xyz / vLightSpaceVertex.w;

        // shift the values from NDC to [0,1] range
        vLightSpaceVertex = vLightSpaceVertex * 0.5 + 0.5;

        // set everything outside the the shadowmap to not be in shadow
        if (
            vLightSpaceVertex.x > 1.0 ||
            vLightSpaceVertex.x < 0.0 ||
            vLightSpaceVertex.y > 1.0 ||
            vLightSpaceVertex.y < 0.0
        ) {
            return false;
        }

        // sample the shadow map
        highp vec4 shadowmapSample = texture2D(uShadowmap, vLightSpaceVertex.xy);
        
        // the distance to the closest fragment from the pov of the light
        highp float closestDist = shadowmapSample.r;

        // the distance of the current fragment from the pov of the light
        highp float currentDist = vLightSpaceVertex.z;

        return (closestDist + uShadowBias <= currentDist);
    }

    void main() {
        highp vec4 color = texture2D(uTexture, vTextureCoord * uTexScale);
        
        highp float shadowFactor;
        if (uRecieveShadow) {
            shadowFactor = inShadow() ? 0.3 : 1.0;
        } else {
            shadowFactor = 1.0;
        }

        highp vec3 Lighting = uRecieveLighting ? vLighting : vec3(1.0, 1.0, 1.0);

        gl_FragColor = vec4(color.xyz * Lighting * shadowFactor, color.w);
    }
`;

const mainAttributeNames = [
    "aVertexPosition",
    "aVertexNormal",
    "aTextureCoord",
];

const mainUniformNames = [
    "uProjectionMatrix",
    "uCameraMatrix",
    "uModelViewMatrix",
    "uLightSpaceProjection",
    "uLightSpaceCamera",
    "uNormalMatrix",
    "uLightDirection",
    "uTexture",
    "uShadowmap",
    "uShadowBias",
    "uRecieveShadow",
    "uRecieveLighting",
    "uTexScale"
];

/**
 * The GLSL source code for the vertex shader used to render to a depth texture.
 */
const depthMapVsSource = `
    attribute vec4 aVertexPosition;

    uniform mat4 uProjectionMatrix;
    uniform mat4 uCameraMatrix;
    uniform mat4 uModelViewMatrix;

    void main() {
        gl_Position = uProjectionMatrix * uCameraMatrix * uModelViewMatrix * aVertexPosition;
    }
`;

/**
 * The GLSL source code for the fragment shader used to render to a depth texture.
 */
const depthMapFsSource = `
    void main() {
        gl_FragColor = vec4(gl_FragCoord.z);
    }
`;

const depthMapAttributeNames = [
    "aVertexPosition"
];

const depthMapUniformNames = [
    "uProjectionMatrix",
    "uCameraMatrix",
    "uModelViewMatrix"
];

const AABBVsSource = `
    attribute vec4 aVertexPosition;

    uniform mat4 uProjectionMatrix;
    uniform mat4 uCameraMatrix;
    uniform mat4 uModelViewMatrix;

    void main() {
        gl_Position = uProjectionMatrix * uCameraMatrix * uModelViewMatrix * aVertexPosition;
    }
`;

const AABBFsSource = `
    uniform mediump vec3 AABBRenderColor;

    void main() {
        gl_FragColor = vec4(AABBRenderColor, 1);
    }
`;

const AABBAttributeNames = [
    "aVertexPosition"
];

const AABBUniformNames = [
    "uProjectionMatrix",
    "uCameraMatrix",
    "uModelViewMatrix",
    "AABBRenderColor"
];
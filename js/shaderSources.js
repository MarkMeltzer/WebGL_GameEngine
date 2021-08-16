/**
 * The GLSL source code for the vertex shader used to render to the canvas.
 */
const mainVsSource = `
    // vertex attributes
    attribute vec4 aVertexPosition;
    attribute vec3 aVertexNormal;
    attribute vec2 aTextureCoord;
    attribute vec3 aVertexTangent;
    attribute vec3 aVertexBitangent;

    // transformations
    uniform mat4 uProjectionMatrix;
    uniform mat4 uCameraMatrix;
    uniform mat4 uModelViewMatrix;
    uniform mat4 uLightSpaceProjection;
    uniform mat4 uLightSpaceCamera;
    uniform mat4 uNormalMatrix;

    varying highp vec2 vTextureCoord;
    varying highp vec4 vLightSpaceVertex;
    varying highp vec3 vNormal;
    varying highp vec3 vTangent;
    varying highp vec3 vBitangent;
    varying highp vec3 vFragWorldSpacePos;

    void main() {
        // transform the vertex position
        gl_Position = uProjectionMatrix * uCameraMatrix * uModelViewMatrix * aVertexPosition;

        // transform the normal
        vNormal = (uNormalMatrix * vec4(aVertexNormal, 1.0)).xyz;

        // pass through the tangents    
        vTangent = (uNormalMatrix * vec4(aVertexTangent, 0.0)).xyz;
        vBitangent = (uNormalMatrix * vec4(aVertexBitangent, 0.0)).xyz;
        
        // transform the vertex to lightspace
        vLightSpaceVertex = uLightSpaceProjection * uLightSpaceCamera * uModelViewMatrix * aVertexPosition;

        // transform and pass the world space position
        vFragWorldSpacePos = (uModelViewMatrix * aVertexPosition).xyz;

        // pass through the texture coordinate
        vTextureCoord = aTextureCoord;
    }
`;


/**
 * The GLSL source code for the fragment shader used to render to the canvas.
 */
const mainFsSource = `
    // textures
    uniform sampler2D uTexDiffuse;
    uniform sampler2D uTexNormal;
    uniform sampler2D uShadowmap;

    // settings
    uniform highp float uShadowBias;
    uniform highp float uTexScale;
    uniform highp float uSpecStrength;
    uniform highp float uSpecExp;
    uniform highp float uDiffStrength;
    uniform bool uRecieveShadow;
    uniform bool uRecieveLighting;

    // light
    uniform highp vec3 uLightDirection;

    // camera
    uniform highp vec3 uCameraPos;

    varying highp vec2 vTextureCoord;
    varying highp vec4 vLightSpaceVertex;
    varying highp vec3 vNormal;
    varying highp vec3 vTangent;
    varying highp vec3 vBitangent;
    varying highp vec3 vFragWorldSpacePos;

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
        // diffuse color
        highp vec4 color = texture2D(uTexDiffuse, vTextureCoord * uTexScale);

        // normal
        highp vec3 normal = texture2D(uTexNormal, vTextureCoord * uTexScale).xyz;
        normal = (normal * 2.0 - 1.0);
        highp mat3 TBN = mat3(normalize(vTangent), normalize(vBitangent), normalize(vNormal));
        normal = normalize(TBN * normal);

        /* ============== lighting ============== */
        // ambient
        highp vec3 ambientLight = vec3(0.2, 0.2, 0.2);

        // diffuse
        highp vec3 directionalLightColor = vec3(1, 1, 1);
        highp vec3 directionalVector = normalize(uLightDirection);
        highp float diffuseAmmount = max(dot(normal, directionalVector), 0.0);
        highp vec3 diffuse = uDiffStrength * diffuseAmmount * directionalLightColor;

        // specular
        highp vec3 viewDir = normalize(uCameraPos - vFragWorldSpacePos);
        highp vec3 reflectedLightDir = reflect(-directionalVector, normal);
        highp float specAmount = pow(max(dot(viewDir, reflectedLightDir),0.0), uSpecExp);
        highp vec3 specular = uSpecStrength * specAmount * directionalLightColor;

        // final
        highp vec3 totalLight = ambientLight + diffuse + specular;
        highp vec3 Lighting = uRecieveLighting ? totalLight : vec3(1.0, 1.0, 1.0);

        /* ============== shadow ============== */
        highp float shadowFactor;
        if (uRecieveShadow) {
            shadowFactor = inShadow() ? 0.3 : 1.0;
        } else {
            shadowFactor = 1.0;
        }

        gl_FragColor = vec4(color.xyz * Lighting * shadowFactor, color.w);
    }
`;

const mainAttributeNames = [
    "aVertexPosition",
    "aVertexNormal",
    "aTextureCoord",
    "aVertexTangent",
    "aVertexBitangent"
];

const mainUniformNames = [
    "uProjectionMatrix",
    "uCameraMatrix",
    "uModelViewMatrix",
    "uLightSpaceProjection",
    "uLightSpaceCamera",
    "uNormalMatrix",
    "uLightDirection",
    "uTexDiffuse",
    "uTexNormal",
    "uShadowmap",
    "uShadowBias",
    "uRecieveShadow",
    "uRecieveLighting",
    "uTexScale",
    "uCameraPos",
    "uSpecExp",
    "uSpecStrength",
    "uDiffStrength"
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
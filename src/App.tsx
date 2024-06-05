import React, { useRef, useEffect, useState } from "react";
import { Canvas, useFrame,  extend } from "@react-three/fiber";
import { OrbitControls, useTexture, Plane } from "@react-three/drei";
import { GUI } from "lil-gui";
//@ts-ignore
import { PLYLoader } from "three/examples/jsm/loaders/PLYLoader";
import * as THREE from "three";
import { Texture } from "three";
import { SpotLightHelper } from "three";

extend({ OrbitControls });

interface SpotLightParams {
  color: number;
  intensity: number;
  distance: number;
  angle: number;
  penumbra: number;
  decay: number;
  focus: number;
  shadows: boolean;
}

const Scene: React.FC = () => {
  const lightRef = useRef<THREE.SpotLight>(null);
  const lightHelperRef = useRef<SpotLightHelper | null>(null);
  const [textures, setTextures] = useState<{ [key: string]: Texture | null }>(
    {}
  );
  const [spotLightParams, setSpotLightParams] = useState<SpotLightParams>({
    color: 0xffffff,
    intensity: 100,
    distance: 0,
    angle: Math.PI / 6,
    penumbra: 1,
    decay: 2,
    focus: 1,
    shadows: true,
  });

  const disturbTexture = useTexture("textures/disturb.jpg");
  const colorsTexture = useTexture("textures/colors.png");
  const uvGridTexture = useTexture("textures/uv_grid_opengl.jpg");

  useEffect(() => {
    setTextures({
      none: null,
      "disturb.jpg": disturbTexture,
      "colors.png": colorsTexture,
      "uv_grid_opengl.jpg": uvGridTexture,
    });
  }, [disturbTexture, colorsTexture, uvGridTexture]);

  useEffect(() => {
    const gui = new GUI();

    gui
      .add({ map: "disturb.jpg" }, "map", Object.keys(textures))
      .onChange((val: string) => {
        if (lightRef.current) {
          lightRef.current.map = textures[val];
        }
      });

    gui.addColor(spotLightParams, "color").onChange((val: number) => {
      setSpotLightParams((params) => ({ ...params, color: val }));
      if (lightRef.current) {
        lightRef.current.color.setHex(val);
      }
    });

    gui.add(spotLightParams, "intensity", 0, 500).onChange((val: number) => {
      setSpotLightParams((params) => ({ ...params, intensity: val }));
      if (lightRef.current) {
        lightRef.current.intensity = val;
      }
    });

    gui.add(spotLightParams, "distance", 0, 20).onChange((val: number) => {
      setSpotLightParams((params) => ({ ...params, distance: val }));
      if (lightRef.current) {
        lightRef.current.distance = val;
      }
    });

    gui
      .add(spotLightParams, "angle", 0, Math.PI / 3)
      .onChange((val: number) => {
        setSpotLightParams((params) => ({ ...params, angle: val }));
        if (lightRef.current) {
          lightRef.current.angle = val;
        }
      });

    gui.add(spotLightParams, "penumbra", 0, 1).onChange((val: number) => {
      setSpotLightParams((params) => ({ ...params, penumbra: val }));
      if (lightRef.current) {
        lightRef.current.penumbra = val;
      }
    });

    gui.add(spotLightParams, "decay", 1, 2).onChange((val: number) => {
      setSpotLightParams((params) => ({ ...params, decay: val }));
      if (lightRef.current) {
        lightRef.current.decay = val;
      }
    });

    gui.add(spotLightParams, "focus", 0, 1).onChange((val: number) => {
      setSpotLightParams((params) => ({ ...params, focus: val }));
      if (lightRef.current) {
        lightRef.current.shadow.focus = val;
      }
    });

    gui.add(spotLightParams, "shadows").onChange((val: boolean) => {
      setSpotLightParams((params) => ({ ...params, shadows: val }));
      if (lightRef.current) {
        const renderer = lightRef.current.parent?.children.find(
          (child) => (child as any).type === "WebGLRenderer"
        ) as unknown as THREE.WebGLRenderer;
        if (renderer) {
          renderer.shadowMap.enabled = val;
          lightRef.current.parent?.traverse((child) => {
            const material = (child as THREE.Mesh).material;
            if (material && !Array.isArray(material)) {
              (material as THREE.Material).needsUpdate = true;
            }
          });
        }
      }
    });

    return () => gui.destroy();
  }, [textures, spotLightParams]);

  useEffect(() => {
    if (lightRef.current) {
      lightHelperRef.current = new SpotLightHelper(lightRef.current);
      lightRef.current.add(lightHelperRef.current);
    }
    return () => {
      if (lightHelperRef.current) {
        lightRef.current?.remove(lightHelperRef.current);
        lightHelperRef.current.dispose();
      }
    };
  }, []);

  useFrame(() => {
    const time = performance.now() / 3000;
    if (lightRef.current) {
      lightRef.current.position.x = Math.cos(time) * 2.5;
      lightRef.current.position.z = Math.sin(time) * 2.5;
    }
    if (lightHelperRef.current) lightHelperRef.current.update();
  });

  return (
    <>
      <ambientLight intensity={0.15} />
      <spotLight
        ref={lightRef}
        color={spotLightParams.color}
        intensity={spotLightParams.intensity}
        distance={spotLightParams.distance}
        angle={spotLightParams.angle}
        penumbra={spotLightParams.penumbra}
        decay={spotLightParams.decay}
        castShadow
        position={[2.5, 5, 2.5]}
        map={textures["disturb.jpg"]}
      />
      <Plane args={[200, 200]} rotation-x={-Math.PI / 2} position={[0, -1, 0]}>
        <meshLambertMaterial attach="material" color="#bcbcbc" />
      </Plane>
      <LucyModel />
    </>
  );
};

const LucyModel: React.FC = () => {
  const ref = useRef<THREE.Mesh>(null);
  const [geometry, setGeometry] = useState<THREE.BufferGeometry>();

  useEffect(() => {
    new PLYLoader().load(
      "models/ply/binary/Lucy100k.ply",
      (geometry: THREE.BufferGeometry) => {
        geometry.scale(0.0024, 0.0024, 0.0024);
        geometry.computeVertexNormals();
        setGeometry(geometry);
      }
    );
  }, []);

  return geometry ? (
    <mesh
      ref={ref}
      geometry={geometry}
      rotation-y={-Math.PI / 2}
      position={[0, 0.8, 0]}
      castShadow
      receiveShadow
    >
      <meshLambertMaterial attach="material" />
    </mesh>
  ) : null;
};

const App: React.FC = () => {
  return (
    <Canvas shadows camera={{ position: [7, 4, 1], fov: 40 }}>
      <OrbitControls
        minDistance={2}
        maxDistance={10}
        maxPolarAngle={Math.PI / 2}
        target={[0, 1, 0]}
      />
      <Scene />
    </Canvas>
  );
};

export default App;

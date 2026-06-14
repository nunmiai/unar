"use client";

import { useEffect, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";

export default function GoldenPollenParticles() {
  const [init, setInit] = useState(false);

  // This should be run only once per application lifetime
  useEffect(() => {
    initParticlesEngine(async (engine) => {
      // you can initiate the tsParticles instance (engine) here, adding custom shapes or presets
      // this loads the tsparticles package bundle, it's the easiest method for getting everything ready
      // starting from v2 you can add only the features you need reducing the bundle size
      await loadSlim(engine);
    }).then(() => {
      setInit(true);
    });
  }, []);

  const options = {
    background: {
      color: {
        value: "transparent",
      },
    },
    fpsLimit: 60,
    interactivity: {
      events: {
        onHover: {
          enable: true,
          mode: "bubble", // subtle reaction to mouse
        },
      },
      modes: {
        bubble: {
          distance: 150,
          duration: 2,
          opacity: 0.8,
          size: 4,
        },
      },
    },
    particles: {
      color: {
        value: "#d4a574", // Unar's golden earthy tone
      },
      move: {
        direction: "top", // Drift upwards like pollen/dust
        enable: true,
        outModes: {
          default: "out",
        },
        random: true,
        speed: 0.3, // Very slow
        straight: false,
      },
      number: {
        density: {
          enable: true,
          area: 800,
        },
        value: 40, // Low density so it doesn't look busy
      },
      opacity: {
        value: { min: 0.2, max: 0.6 },
        animation: {
          enable: true,
          speed: 0.5,
          sync: false,
        },
      },
      shape: {
        type: "circle",
      },
      size: {
        value: { min: 1, max: 3 },
      },
      links: {
        enable: false, // NO lines connecting particles! This avoids the "crypto/tech" look
      },
    },
    detectRetina: true,
    fullScreen: { enable: false }, // Let it be constrained to the parent div
  };

  if (init) {
    return (
      <Particles
        id="tsparticles-pollen"
        options={options}
        className="absolute inset-0 z-0 pointer-events-none"
      />
    );
  }

  return null;
}


"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, X, ImagePlus, Copy, Check } from "lucide-react";
import { getPaletteSync } from "colorthief";

type ExtractedColor = {
  hex: string;
  rgb: {
    r: number;
    g: number;
    b: number;
  };
};

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState("");
  const [colors, setColors] = useState<ExtractedColor[]>([]);
  const [copiedHex, setCopiedHex] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
          },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setIsReady(true);
        }
      } catch {
        setError("Unable to access camera. Check your permissions.");
      }
    }

    startCamera();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setIsReady(false);
    };
  }, [isOpen]);

  const capturePhoto = () => {
    const video = videoRef.current;

    if (!video || !video.videoWidth) return;

    try {
      const canvas = document.createElement("canvas");

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const context = canvas.getContext("2d");

      if (!context) return;

      context.drawImage(video, 0, 0);

      // Extract 5 dominant colors
      const palette = getPaletteSync(canvas, {
        colorCount: 5,
        quality: 10,
      });

      const extractedColors = palette.map((color) => ({
        hex: color.hex(),
        rgb: color.rgb(),
      }));

      setColors(extractedColors);
      closeCamera();
    } catch (err) {
      console.error("Color extraction failed:", err);
      setError("Failed to extract colors from this image.");
    }
  };

  const closeCamera = () => {
    setIsOpen(false);
  };

  const copyColor = async (hex: string) => {
    try {
      await navigator.clipboard.writeText(hex);
      setCopiedHex(hex);

      setTimeout(() => {
        setCopiedHex("");
      }, 1500);
    } catch {
      console.error("Clipboard access failed");
    }
  };

  return (
    <main className="min-h-dvh flex flex-col items-center px-6 py-8 bg-background">

      {/* Main camera button */}
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <button
          onClick={() => {
            setError("");
            setIsOpen(true);
          }}
          className="w-64 aspect-square max-w-[75vw] rounded-3xl bg-primary text-primary-foreground flex flex-col items-center justify-center shadow-xl active:scale-95 transition-transform"
        >
          <Camera size={80} strokeWidth={1.5} />
          <span className="mt-4 font-semibold">Open Camera</span>
        </button>

        {/* <p className="text-sm text-gray-500">
          Take a photo to identify its colors
        </p> */}
      </div>

      {/* Gallery button */}
      {/* <button className="w-full max-w-md py-4 rounded-2xl border border-gray-300 flex items-center justify-center gap-3 font-semibold">
        <ImagePlus size={22} />
        Upload from Gallery
      </button> */}

      {/* Extracted colors */}
      {colors.length > 0 && (
        <section className="w-full max-w-md mt-10 mb-8 bg-surface rounded-2xl px-7 py-5">
          <h2 className="text-xl font-bold mb-2 text-foreground">
            Extracted Colors
          </h2>

          <p className="text-sm text-gray-500 mb-5 text-text-secondary">
            Dominant colors found in your image.
          </p>

          <div className="grid grid-cols-2 gap-4">
            {colors.map((color, index) => (
              <div
                key={color.hex + index}
                className="overflow-hidden rounded-2xl border border-gray-200 bg-white"
              >
                <div
                  className="h-28 w-full"
                  style={{ backgroundColor: color.hex }}
                />

                <div className="p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-sm uppercase">
                      {color.hex}
                    </span>

                    <button
                      onClick={() => copyColor(color.hex)}
                      className="p-2 rounded-lg hover:bg-gray-100"
                      aria-label={`Copy ${color.hex}`}
                    >
                      {copiedHex === color.hex ? (
                        <Check size={16} className="text-green-600" />
                      ) : (
                        <Copy size={16} />
                      )}
                    </button>
                  </div>

                  <p className="text-xs text-gray-500 mt-1">
                    RGB({color.rgb.r}, {color.rgb.g}, {color.rgb.b})
                  </p>

                  {index === 0 && (
                    <span className="inline-block mt-2 text-xs font-medium text-indigo-600">
                      Dominant color
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Camera overlay */}
      <div
        aria-hidden={!isOpen}
        className={`fixed inset-0 z-50 bg-black transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isOpen
            ? "opacity-100 scale-100 visible"
            : "opacity-0 scale-95 invisible pointer-events-none"
        }`}
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
        />

        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 pointer-events-none" />

        <button
          onClick={closeCamera}
          className="absolute top-6 left-6 z-10 p-3 rounded-full bg-black/30 text-white backdrop-blur-md"
        >
          <X size={26} />
        </button>

        <div className="absolute top-8 left-0 right-0 text-center text-white">
          <p className="font-medium">Identify Colors</p>
          <p className="text-sm text-white/70 mt-1">
            Point your camera at something
          </p>
        </div>

        {error && (
          <div className="absolute inset-0 flex items-center justify-center p-8 text-white text-center">
            {error}
          </div>
        )}

        {!isReady && !error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        )}

        <div className="absolute bottom-12 left-0 right-0 flex justify-center">
          <button
            onClick={capturePhoto}
            disabled={!isReady}
            aria-label="Capture photo"
            className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center active:scale-90 transition-transform disabled:opacity-40"
          >
            <div className="w-16 h-16 rounded-full bg-white border-4 border-black/20" />
          </button>
        </div>
      </div>
    </main>
  );
}

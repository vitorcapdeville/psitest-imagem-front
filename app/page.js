"use client";

import React, { useRef, useState, useEffect } from "react";
import FileInput from "@/app/components/FileInput";
import ImagePreview from "@/app/components/ImagePreview";
import ThresholdSlider from "@/app/components/ThresholdSlider";
import { useImageProcessing } from "@/app/hooks/useImageProcessing";
import { calculateScaledCoordinates } from "@/app/utils/imageUtils";
import { Layer, Rect, Stage } from "react-konva";

const IMAGE_HEIGHT = 500;

export default function Home() {
  const [threshold, setThreshold] = useState(0.5);
  const [imageDimensions, setImageDimensions] = useState({
    width: 0,
    height: 0,
  });
  const [scaledDimensions, setScaledDimensions] = useState({
    width: 0,
    height: IMAGE_HEIGHT,
  });
  const imageRef = useRef(null);

  const {
    selectedFiles,
    objects,
    loading,
    error,
    previewImages,
    handleFileChange,
    processImages,
  } = useImageProcessing(threshold);

  const handleSubmit = async (event) => {
    event.preventDefault();
    processImages("find_answers");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-10xl p-8 bg-white shadow-lg rounded-lg flex">
        <div className="w-1/5 flex flex-col space-y-3">
          <h2 className="text-2xl font-bold mb-6 text-center">
            Escolha um teste e um template
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FileInput name="image1" onChange={handleFileChange} />
            <FileInput name="image2" onChange={handleFileChange} multiple />
            <ThresholdSlider
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
            />
            <button
              type="submit"
              disabled={
                !selectedFiles.image1 ||
                selectedFiles.image2.length === 0 ||
                loading
              }
              className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            >
              {loading ? "Processando..." : "Processar"}
            </button>
          </form>
          {error && (
            <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-lg">
              {error}
            </div>
          )}
        </div>

        <div className="flex flex-col space-y-3 w-2/3 items-center">
          <h2 className="text-lg font-semibold">Teste:</h2>
          {!previewImages.image1 && (
            <div className={`flex h-[${IMAGE_HEIGHT}px] items-center`}>
              <p>Selecione um teste para exibir a visualização.</p>
            </div>
          )}
          {previewImages.image1 && (
            <div
              style={{
                position: "relative",
                width: scaledDimensions.width,
                height: scaledDimensions.height,
              }}
            >
              <ImagePreview
                ref={imageRef}
                src={previewImages.image1}
                alt="Teste"
                width={scaledDimensions.width}
                height={`${IMAGE_HEIGHT}px`}
                onLoad={({ naturalWidth, naturalHeight }) => {
                  setImageDimensions({
                    width: naturalWidth,
                    height: naturalHeight,
                  });
                  const aspectRatio = naturalWidth / naturalHeight;
                  setScaledDimensions({
                    width: IMAGE_HEIGHT * aspectRatio,
                    height: IMAGE_HEIGHT,
                  });
                }}
              />
              {objects.length > 0 && (
                <Stage
                  width={scaledDimensions.width}
                  height={scaledDimensions.height}
                  style={{ position: "absolute", top: 0, left: 0 }}
                >
                  <Layer>
                    {objects.map((obj, index) => {
                      const scaledCoord = calculateScaledCoordinates(
                        obj.bounding_box,
                        scaledDimensions,
                        imageDimensions
                      );
                      return (
                        <Rect
                          key={index}
                          x={scaledCoord.x}
                          y={scaledCoord.y}
                          width={scaledCoord.width}
                          height={scaledCoord.height}
                          stroke={obj.name === "empty" ? "red" : "green"}
                          strokeWidth={2}
                        />
                      );
                    })}
                  </Layer>
                </Stage>
              )}
            </div>
          )}
          <h2 className="text-lg font-semibold">Templates:</h2>
          {previewImages.image2.length === 0 && (
            <div className="flex h-[100px] items-center">
              <p>Selecione um template para exibir a visualização.</p>
            </div>
          )}
          {previewImages.image2.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {previewImages.image2.map((src, index) => (
                <ImagePreview
                  key={index}
                  src={src}
                  alt={`Template ${index + 1}`}
                  width="auto"
                  height="100px"
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

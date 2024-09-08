"use client";

import FileInput from "@/app/components/FileInput";
import ThresholdSlider from "@/app/components/ThresholdSlider";
import { createImage, findAnswers, findBoxes } from "@/app/lib/api";
import { calculateScaledCoordinates, getColor } from "@/app/utils/imageUtils";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { Layer, Rect, Stage } from "react-konva";
import ImagePreview from "@/app/components/ImagePreview";

function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

const DEBOUNCE_MS = 500;
const FIXED_IMAGE_HEIGHT = 600;
const FIXED_TEMPLATE_HEIGHT = 50;

export default function Home() {
  const [threshold, setThreshold] = useState(0.5);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedTemplates, setSelectedTemplates] = useState([]);
  const [imageSrc, setImageSrc] = useState("");
  const [templatesSrc, setTemplatesSrc] = useState([]);
  const [imageId, setImageId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [objects, setObjects] = useState([]);
  const [scaledDimensions, setScaledDimensions] = useState({
    width: 0,
    height: FIXED_IMAGE_HEIGHT,
  });
  const [imageDimensions, setImageDimensions] = useState({
    width: 0,
    height: 0,
  });

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    setSelectedImage(file);
    const imageSrc = URL.createObjectURL(file);
    setImageSrc(imageSrc);
  };

  const handleTemplateChange = (event) => {
    const fileArray = Array.from(event.target.files);
    setSelectedTemplates(fileArray);
    setTemplatesSrc(fileArray.map((file) => URL.createObjectURL(file)));
  };

  useEffect(() => {
    if (!selectedImage) return;
    const fetchImage = async () => {
      setLoading(true);
      setError(null);

      try {
        const createImageResponse = await createImage(selectedImage);
        setImageId(createImageResponse.data._id);
        const sizes = createImageResponse.data.size;
        setImageDimensions({
          width: sizes.width,
          height: sizes.height,
        });
        console.log(sizes);
        const aspectRatio = sizes.width / sizes.height;
        setScaledDimensions({
          width: FIXED_IMAGE_HEIGHT * aspectRatio,
          height: FIXED_IMAGE_HEIGHT,
        });

        setObjects(createImageResponse.data.objects);
      } catch (error) {
        console.error("Erro ao enviar as imagens:", error);
        setError("Falha ao processar as imagens. Tente novamente.");
      } finally {
        setLoading(false);
      }
    };

    fetchImage();
  }, [selectedImage]);

  const fetchBoxes = useCallback(
    debounce(async (imageId, selectedTemplates, threshold) => {
      setLoading(true);
      setError(null);

      try {
        const imageAnnotations = await findBoxes(
          imageId,
          selectedTemplates,
          threshold
        );
        const sizes = imageAnnotations.data.size;
        setImageDimensions({
          width: sizes.width,
          height: sizes.height,
        });
        const aspectRatio = sizes.width / sizes.height;
        setScaledDimensions({
          width: FIXED_IMAGE_HEIGHT * aspectRatio,
          height: FIXED_IMAGE_HEIGHT,
        });
        console.log(aspectRatio);
        console.log(FIXED_IMAGE_HEIGHT * aspectRatio);
        setObjects(imageAnnotations.data.objects);
      } catch (error) {
        console.error("Erro ao enviar as imagens:", error);
        setError("Falha ao processar as imagens. Tente novamente.");
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS),
    []
  );

  useEffect(() => {
    if (!threshold || selectedTemplates.length === 0 || !imageId) return;
    setTemplatesSrc(
      selectedTemplates.map((template) => URL.createObjectURL(template))
    );
    fetchBoxes(imageId, selectedTemplates, threshold);
  }, [imageId, selectedTemplates, threshold, fetchBoxes]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    const imageAnnotations = await findAnswers(imageId);
    const sizes = imageAnnotations.data.size;
    setImageDimensions({
      width: sizes.width,
      height: sizes.height,
    });
    const aspectRatio = sizes.width / sizes.height;
    setScaledDimensions({
      width: FIXED_IMAGE_HEIGHT * aspectRatio,
      height: FIXED_IMAGE_HEIGHT,
    });
    setObjects(imageAnnotations.data.objects);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-10xl h-[800px] p-8 bg-white shadow-lg rounded-lg flex">
        <div className="w-1/5 flex flex-col space-y-3">
          <h2 className="text-2xl font-bold mb-6 text-center">
            Escolha um teste e um template
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FileInput name="image" onChange={handleImageChange} />
            <FileInput name="image2" onChange={handleTemplateChange} multiple />
            <ThresholdSlider
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
            />
            <button
              type="submit"
              disabled={!imageSrc || templatesSrc.length === 0 || loading}
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
          {!imageSrc && (
            <div className={`flex h-[${FIXED_IMAGE_HEIGHT}px] items-center`}>
              <p>Selecione um teste para exibir a visualização.</p>
            </div>
          )}
          {imageSrc && (
            <div
              style={{
                position: "relative",
                width: scaledDimensions.width,
                height: scaledDimensions.height,
              }}
            >
              <ImagePreview
                src={imageSrc}
                alt="Teste"
                className="rounded-lg shadow-lg"
                width={scaledDimensions.width}
                height={`${FIXED_IMAGE_HEIGHT}px`}
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
                          stroke={getColor(obj.name)}
                          strokeWidth={1}
                        />
                      );
                    })}
                  </Layer>
                </Stage>
              )}
            </div>
          )}
          <h2 className="text-lg font-semibold">Templates:</h2>
          {templatesSrc.length === 0 && (
            <div className={`flex h-[${FIXED_TEMPLATE_HEIGHT}px] items-center`}>
              <p>Selecione um template para exibir a visualização.</p>
            </div>
          )}
          {templatesSrc.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {templatesSrc.map((src, index) => (
                <Image
                  key={index}
                  src={src}
                  alt={`Template ${index + 1}`}
                  height={0}
                  width={0}
                  style={{
                    width: "auto",
                    height: `${FIXED_TEMPLATE_HEIGHT}px`,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

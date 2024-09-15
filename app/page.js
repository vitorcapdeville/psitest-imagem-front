"use client";

import FileInput from "@/app/components/FileInput";
import ThresholdSlider from "@/app/components/ThresholdSlider";
import {
  createImage,
  findAnswers,
  findBoxes,
  getQa,
  updateImageObjects,
} from "@/app/lib/api";
import { getColor } from "@/app/utils/imageUtils";
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
  const [qa, setQa] = useState({});
  const [scaledDimensions, setScaledDimensions] = useState({
    width: 0,
    height: FIXED_IMAGE_HEIGHT,
  });
  const [imageDimensions, setImageDimensions] = useState({
    width: 0,
    height: 0,
  });
  const [rects, setRects] = useState([]);

  // facilitar o desenvolvimento já colocando uma imagem na tela, remover dps!!
  useEffect(() => {
    const DEFAULT_FILE_SRC = "exam0_1_1.png";
    const DEFAULT_TEMPLATES_SRC = ["box1.png", "box2.png"];
    // Função para carregar a imagem padrão como um File
    const loadDefaultImage = async () => {
      try {
        // Faz uma requisição HTTP para obter a imagem como um Blob
        const response = await fetch(DEFAULT_FILE_SRC);
        const blob = await response.blob();

        // Cria um File a partir do Blob
        const defaultFile = new File([blob], DEFAULT_FILE_SRC, {
          type: blob.type,
        });

        // Atualiza o estado com o File e o src
        setSelectedImage(defaultFile);
        setImageSrc(URL.createObjectURL(defaultFile));
      } catch (error) {
        console.error("Erro ao carregar a imagem padrão", error);
      }
    };
    const loadDefaultTemplates = async () => {
      try {
        const selected = await Promise.all(
          DEFAULT_TEMPLATES_SRC.map(async (templateSrc) => {
            const response = await fetch(templateSrc);
            const blob = await response.blob();
            const defaultTemplate = new File([blob], templateSrc, {
              type: blob.type,
            });
            return defaultTemplate;
          })
        );
        const selectedArray = Array.from(selected);

        setSelectedTemplates(selectedArray);
        setTemplatesSrc(selectedArray.map((file) => URL.createObjectURL(file)));
      } catch (error) {
        console.error("Erro ao carregar a imagem padrão", error);
      }
    };

    loadDefaultImage();
    loadDefaultTemplates();
  }, []);
  // facilitar o desenvolvimento já colocando uma imagem na tela, remover dps!!

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
        setImageId(createImageResponse._id);
        const sizes = createImageResponse.size;
        setImageDimensions({
          width: sizes.width,
          height: sizes.height,
        });
        const aspectRatio = sizes.width / sizes.height;
        setScaledDimensions({
          width: FIXED_IMAGE_HEIGHT * aspectRatio,
          height: FIXED_IMAGE_HEIGHT,
        });
        setQa({});
        setObjects(createImageResponse.objects);
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
        const sizes = imageAnnotations.size;
        setImageDimensions({
          width: sizes.width,
          height: sizes.height,
        });
        const aspectRatio = sizes.width / sizes.height;
        setScaledDimensions({
          width: FIXED_IMAGE_HEIGHT * aspectRatio,
          height: FIXED_IMAGE_HEIGHT,
        });
        setObjects(imageAnnotations.objects);
        setQa({});
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
    const qaResponse = await getQa(imageId);
    const sizes = imageAnnotations.size;
    setImageDimensions({
      width: sizes.width,
      height: sizes.height,
    });
    const aspectRatio = sizes.width / sizes.height;
    setScaledDimensions({
      width: FIXED_IMAGE_HEIGHT * aspectRatio,
      height: FIXED_IMAGE_HEIGHT,
    });
    setObjects(imageAnnotations.objects);
    setQa(qaResponse);
    setLoading(false);
  };

  const objectsToRects = (objects) => {
    const scaleX = scaledDimensions.width / imageDimensions.width;
    const scaleY = scaledDimensions.height / imageDimensions.height;
    return objects.map((obj, index) => {
      return {
        id: index,
        x: obj.bounding_box.x_min * scaleX,
        y: obj.bounding_box.y_min * scaleY,
        width: (obj.bounding_box.x_max - obj.bounding_box.x_min) * scaleX,
        height: (obj.bounding_box.y_max - obj.bounding_box.y_min) * scaleY,
        name: obj.name,
        confidence: obj.confidence,
        scaleX: scaleX,
        scaleY: scaleY,
      };
    });
  };

  const rectsToObjects = (rects) => {
    return rects.map((rect) => {
      return {
        bounding_box: {
          x_min: parseInt(rect.x / rect.scaleX),
          y_min: parseInt(rect.y / rect.scaleY),
          x_max: parseInt((rect.x + rect.width) / rect.scaleX),
          y_max: parseInt((rect.y + rect.height) / rect.scaleY),
        },
        name: rect.name,
        confidence: rect.confidence,
      };
    });
  };

  useEffect(() => {
    setRects(objectsToRects(objects));
  }, [objects, scaledDimensions, imageDimensions]);

  const handleResetRect = () => {
    const newRects = objectsToRects(objects);
    setRects(newRects);
  };

  const handleSaveRects = async () => {
    const newObjects = rectsToObjects(rects);
    try {
      const updatedImageAnnotations = await updateImageObjects(
        imageId,
        newObjects
      );
      const sizes = updatedImageAnnotations.size;
      setImageDimensions({
        width: sizes.width,
        height: sizes.height,
      });
      const aspectRatio = sizes.width / sizes.height;
      setScaledDimensions({
        width: FIXED_IMAGE_HEIGHT * aspectRatio,
        height: FIXED_IMAGE_HEIGHT,
      });
      setObjects(updatedImageAnnotations.objects);
    } catch (error) {
      console.error("Erro ao enviar as imagens:", error);
      setError("Falha ao processar as imagens. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = (e) => {
    const id = e.target.id();
    setRects(
      rects.map((rect) => {
        if (rect.id === id) {
          return {
            ...rect,
            x: e.target.attrs.x,
            y: e.target.attrs.y,
            width: e.target.attrs.width,
            height: e.target.attrs.height,
            confidence: null,
            name: "unpredicted",
          };
        }
        return rect;
      })
    );
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
          <button
            onClick={handleResetRect}
            disabled={rects.length === 0 || loading}
            className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          >
            Resetar
          </button>
          <button
            onClick={handleSaveRects}
            disabled={rects.length === 0 || loading}
            className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          >
            Salvar
          </button>
          {error && (
            <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-lg">
              {error}
            </div>
          )}
        </div>

        <div className="flex flex-col space-y-3 w-3/5 items-center">
          <h2 className="text-lg font-semibold">Teste:</h2>
          {!imageSrc && (
            <div className={`flex h-[600px] items-center`}>
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
                    {rects.map((rect) => {
                      return (
                        <Rect
                          key={rect.id}
                          id={rect.id}
                          x={rect.x}
                          y={rect.y}
                          width={rect.width}
                          height={rect.height}
                          stroke={getColor(rect.name)}
                          strokeWidth={1}
                          draggable
                          onDragEnd={handleDragEnd}
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
            <div className={`flex h-[50px] items-center`}>
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
        <div className="flex flex-col space-y-3 w-1/5 items-left overflow-y-scroll">
          <pre>{JSON.stringify(qa, null, 2)}</pre>
        </div>
      </div>
    </div>
  );
}

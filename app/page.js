"use client";

import FileInput from "@/app/components/FileInput";
import ImageWithAnnotations from "@/app/components/ImageWithAnnotations";
import ThresholdSlider from "@/app/components/ThresholdSlider";
import {
  createImage,
  findAnswers,
  findBoxes,
  getQa,
  updateImageObjects,
} from "@/app/lib/api";
import { objectsToRects, rectsToObjects } from "@/app/utils/objects";
import { useCallback, useEffect, useRef, useState } from "react";

function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}
import { FaTrashAlt } from "react-icons/fa";

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
  const canvasRefs = useRef([]);
  const [image, setImage] = useState(null);

  useEffect(() => {
    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      setImage(img);
    };
  }, [imageSrc, scaledDimensions]);

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
  // facilitar o desenvolvimento já colocando uma imagem na tela, remover dps!!\

  useEffect(() => {
    if (image) {
      const scaleX = scaledDimensions.width / imageDimensions.width;
      const scaleY = scaledDimensions.height / imageDimensions.height;
      rects.forEach((rect, index) => {
        const { x, y, width, height } = rect;

        const canvas = canvasRefs.current[index];
        const context = canvas.getContext("2d");

        // Set canvas size to the dimensions of the bounding box
        canvas.width = 65;
        canvas.height = 45;
        // Draw the portion of the image defined by the bounding box
        context.drawImage(
          image,
          x / scaleX,
          y / scaleY,
          width / scaleX,
          height / scaleY,
          0,
          0,
          65,
          45
        );
      });
    }
  }, [image, rects]);

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

  useEffect(() => {
    const scaleX = scaledDimensions.width / imageDimensions.width;
    const scaleY = scaledDimensions.height / imageDimensions.height;
    setRects(objectsToRects(objects, scaleX, scaleY));
  }, [objects, scaledDimensions, imageDimensions]);

  const handleResetRect = () => {
    const scaleX = scaledDimensions.width / imageDimensions.width;
    const scaleY = scaledDimensions.height / imageDimensions.height;
    const newRects = objectsToRects(objects, scaleX, scaleY);
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

  const handleSelectChange = (event, index) => {
    const updatedRects = [...rects];
    updatedRects[index].name = event.target.value;
    updatedRects[index].confidence = null;
    setRects(updatedRects);
  };

  const onChange = (newAttrs) => {
    const rectangles = rects.slice();
    rectangles[newAttrs.id] = {
      ...rectangles[newAttrs.id],
      x: newAttrs.x,
      y: newAttrs.y,
      width: newAttrs.width,
      height: newAttrs.height,
    };
    setRects(rectangles);
  };

  const handleNewRect = () => {
    const scaleX = scaledDimensions.width / imageDimensions.width;
    const scaleY = scaledDimensions.height / imageDimensions.height;
    const x = 10;
    const y = 10;
    const width = 21;
    const height = 15;

    const newRects = rects.concat({
      id: parseInt(
        (rects.length > 0 ? rects[rects.length - 1].id : 0) + 1
      ).toString(),
      x,
      y,
      width,
      height,
      confidence: null,
      name: "unpredicted",
      scaleX,
      scaleY,
    });
    setRects(newRects);
  };

  const handleDeleteRect = (index) => {
    const newRects = rects.filter((rect) => rect.id !== index);
    setRects(newRects);
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
          <hr></hr>
          <button
            onClick={handleNewRect}
            disabled={loading}
            className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          >
            Adicionar caixa
          </button>
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
          <ImageWithAnnotations
            imageSrc={imageSrc}
            templatesSrc={templatesSrc}
            scaledWidth={scaledDimensions.width}
            scaledHeight={scaledDimensions.height}
            fixedHeight={FIXED_IMAGE_HEIGHT}
            rects={rects}
            templateHeight={FIXED_TEMPLATE_HEIGHT}
            handleDragMove={handleDragEnd}
            onChange={onChange}
          />
        </div>
        <div className="flex flex-col space-y-3 w-1/5 items-left overflow-y-scroll">
          {rects.map((rect, index) => {
            return (
              <div key={index} className="flex items-center space-x-4 mb-4">
                <canvas
                  key={index}
                  ref={(el) => (canvasRefs.current[index] = el)}
                  style={{
                    border: "1px solid black",
                    marginBottom: "10px",
                  }}
                />
                <select
                  name="cars"
                  id={`label-${index}`}
                  value={rect.name}
                  onChange={(e) => handleSelectChange(e, index)} // Lida com a mudança
                >
                  <option value="unpredicted">Unpredicted</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="crossedout">Crossed out</option>
                  <option value="empty">Empty</option>
                </select>
                <button
                  onClick={() => {
                    handleDeleteRect(rect.id);
                  }}
                >
                  <FaTrashAlt />
                </button>
              </div>
            );
          })}
        </div>
        {/* <div className="flex flex-col space-y-3 w-1/5 items-left overflow-y-scroll">
          <pre>{JSON.stringify(qa, null, 2)}</pre>
        </div> */}
      </div>
    </div>
  );
}

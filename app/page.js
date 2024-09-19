"use client";

import AnnotationEdit from "@/app/components/AnnotationEdit";
import FileInput from "@/app/components/FileInput";
import ImageWithAnnotations from "@/app/components/ImageWithAnnotations";
import RectControls from "@/app/components/RectControls";
import ThresholdSlider from "@/app/components/ThresholdSlider";
import {
  createImage,
  findAnswers,
  findBoxes,
  getQa,
  updateImageObjects,
} from "@/app/lib/api";
import { objectsToRects, rectsToObjects } from "@/app/utils/objects";
import { useCallback, useEffect, useState } from "react";

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
  const [image, setImage] = useState(null);
  const [selectedId, selectShape] = useState(null);

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
        const qaResponse = await getQa(createImageResponse._id);
        setImageDimensions({
          width: sizes.width,
          height: sizes.height,
        });
        const aspectRatio = sizes.width / sizes.height;
        setScaledDimensions({
          width: FIXED_IMAGE_HEIGHT * aspectRatio,
          height: FIXED_IMAGE_HEIGHT,
        });
        setQa(qaResponse);
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

  const handleSaveRects = async () => {
    const newObjects = rectsToObjects(rects);
    try {
      const updatedImageAnnotations = await updateImageObjects(
        imageId,
        newObjects
      );
      const qaResponse = await getQa(imageId);
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
      setQa(qaResponse);
    } catch (error) {
      console.error("Erro ao enviar as imagens:", error);
      setError("Falha ao processar as imagens. Tente novamente.");
    } finally {
      setLoading(false);
    }
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
          <RectControls
            rects={rects}
            setRects={setRects}
            loading={loading}
            scaleX={scaledDimensions.width / imageDimensions.width}
            scaleY={scaledDimensions.height / imageDimensions.height}
            handleSaveRects={handleSaveRects}
            objects={objects}
          />

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
            setRects={setRects}
            selectedId={selectedId}
            selectShape={selectShape}
          />
        </div>
        <div className="flex flex-col space-y-3 w-1/5 items-left overflow-y-scroll">
          <pre>{JSON.stringify(qa, null, 2)}</pre>
          <AnnotationEdit
            image={image}
            rects={rects}
            setRects={setRects}
            scaleX={scaledDimensions.width / imageDimensions.width}
            scaleY={scaledDimensions.height / imageDimensions.height}
            selectedId={selectedId}
          />
        </div>
      </div>
    </div>
  );
}

"use client";

import AnnotationEdit from "@/app/components/AnnotationEdit";
import FileInput from "@/app/components/FileInput";
import ImageWithAnnotations from "@/app/components/ImageWithAnnotations";
import RectControls from "@/app/components/RectControls";
import {
  findBoxesAction,
  saveImageAction,
  findAnswersAction,
  updateImageAnnotationsAction,
} from "@/app/lib/actions";
import { objectsToRects, rectsToObjects } from "@/app/utils/objects";
import { useEffect, useState } from "react";

const FIXED_IMAGE_HEIGHT = 600;
const FIXED_TEMPLATE_HEIGHT = 50;
const THRESHOLD_TEMPLATE = 0.5;

export default function Home() {
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
  const [selectedId, selectShape] = useState(null);

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
        const result = await saveImageAction(selectedImage, FIXED_IMAGE_HEIGHT);
        setImageId(result.imageId);
        setImageDimensions(result.imageDimensions);
        setScaledDimensions(result.scaledDimensions);
        setQa(result.qaResponse);
        setObjects(result.objects);
      } catch (error) {
        console.error("Erro ao enviar as imagens:", error);
        setError("Falha ao processar as imagens. Tente novamente.");
      } finally {
        setLoading(false);
      }
    };

    fetchImage();
  }, [selectedImage]);

  useEffect(() => {
    const fetchBoxes = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await findBoxesAction(
          imageId,
          selectedTemplates,
          THRESHOLD_TEMPLATE,
          FIXED_IMAGE_HEIGHT
        );
        setImageDimensions(result.imageDimensions);
        setScaledDimensions(result.scaledDimensions);
        setObjects(result.objects);
        setQa(result.qaResponse);
      } catch (error) {
        console.error("Erro ao enviar as imagens:", error);
        setError("Falha ao processar as imagens. Tente novamente.");
      } finally {
        setLoading(false);
      }
    };

    if (selectedTemplates.length === 0 || !imageId) return;

    setTemplatesSrc(
      selectedTemplates.map((template) => URL.createObjectURL(template))
    );
    fetchBoxes();
  }, [imageId, selectedTemplates]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    const result = await findAnswersAction(imageId, FIXED_IMAGE_HEIGHT);
    setImageDimensions(result.imageDimensions);
    setScaledDimensions(result.scaledDimensions);
    setObjects(result.objects);
    setQa(result.qaResponse);
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
      const result = await updateImageAnnotationsAction(
        imageId,
        newObjects,
        FIXED_IMAGE_HEIGHT
      );
      setImageDimensions(result.imageDimensions);
      setScaledDimensions(result.scaledDimensions);
      setObjects(result.objects);
      setQa(result.qaResponse);
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
            imageSrc={imageSrc}
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

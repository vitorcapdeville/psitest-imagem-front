"use client";

import FileInput from "@/app/components/FileInput";
import ThresholdSlider from "@/app/components/ThresholdSlider";
import { createImage, findAnswers, findBoxes, showImage } from "@/app/lib/api";
import Image from "next/image";
import { useEffect, useState, useCallback } from "react";

function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

export default function Home() {
  const [threshold, setThreshold] = useState(0.5);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedTemplates, setSelectedTemplates] = useState([]);
  const [imageSrc, setImageSrc] = useState("");
  const [templatesSrc, setTemplatesSrc] = useState([]);
  const [imageId, setImageId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    setSelectedImage(file);
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
        const imageUrl = await showImage(createImageResponse.data._id);
        setImageSrc(imageUrl);
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
        await findBoxes(imageId, selectedTemplates, threshold);
        const imageUrl = await showImage(imageId);
        setImageSrc(imageUrl);
      } catch (error) {
        console.error("Erro ao enviar as imagens:", error);
        setError("Falha ao processar as imagens. Tente novamente.");
      } finally {
        setLoading(false);
      }
    }, 500), // 500ms de debounce
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
    await findAnswers(imageId, 0.9);
    const imageUrl = await showImage(imageId);
    setImageSrc(imageUrl);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-10xl p-8 bg-white shadow-lg rounded-lg flex">
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
            <div className="flex h-[500px] items-center">
              <p>Selecione um teste para exibir a visualização.</p>
            </div>
          )}
          {imageSrc && (
            <Image
              src={imageSrc}
              alt="Teste"
              className="rounded-lg shadow-lg"
              height={0}
              width={0}
              style={{
                width: "auto",
                height: "500px",
              }}
            />
          )}
          <h2 className="text-lg font-semibold">Templates:</h2>
          {templatesSrc.length === 0 && (
            <div className="flex h-[100px] items-center">
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
                  style={{ width: "auto", height: "100px" }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

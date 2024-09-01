"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import Image from "next/image";

export default function Home() {
  const [selectedFiles, setSelectedFiles] = useState({
    image1: null,
    image2: [],
  });
  const [editedImage, setEditedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [previewImages, setPreviewImages] = useState({
    image1: null,
    image2: [],
  });
  const [threshold, setThreshold] = useState(0.5);

  const handleFileChange = (event) => {
    const { name, files } = event.target;
    if (name === "image1") {
      setSelectedFiles((prevFiles) => ({
        ...prevFiles,
        [name]: files[0],
      }));
      setPreviewImages((prevImages) => ({
        ...prevImages,
        [name]: URL.createObjectURL(files[0]),
      }));
    } else if (name === "image2") {
      const fileArray = Array.from(files);
      setSelectedFiles((prevFiles) => ({
        ...prevFiles,
        [name]: fileArray,
      }));
      setPreviewImages((prevImages) => ({
        ...prevImages,
        [name]: fileArray.map((file) => URL.createObjectURL(file)),
      }));
    }
    setEditedImage(null);
    setError(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedFiles.image1 || selectedFiles.image2.length === 0) {
      setError("Falha ao processar as imagens. Tente novamente.");
      return;
    }

    const formData = new FormData();
    formData.append("test_image", selectedFiles.image1);
    selectedFiles.image2.forEach((file, index) => {
      formData.append(`box_images`, file);
    });

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        `http://127.0.0.1:8000/mark_answers/?threshold=${threshold}&prediction_threshold=0.9`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          responseType: "blob",
        }
      );
      const imageUrl = URL.createObjectURL(response.data);
      setEditedImage(imageUrl);
    } catch (error) {
      console.error("Erro ao enviar as imagens:", error);
      setError("Falha ao processar as imagens. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setEditedImage(null);
  }, [threshold]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-10xl p-8 bg-white shadow-lg rounded-lg flex">
        <div className="w-1/5 flex flex-col space-y-3">
          <h2 className="text-2xl font-bold mb-6 text-center">
            Escolha um teste e um template
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="file"
              name="image1"
              onChange={handleFileChange}
              accept="image/*"
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <input
              type="file"
              name="image2"
              onChange={handleFileChange}
              accept="image/*"
              multiple
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <div className="flex flex-col space-y-2">
              <label htmlFor="threshold" className="text-sm font-semibold">
                Threshold: {threshold}
              </label>
              <input
                type="range"
                id="threshold"
                name="threshold"
                min="0"
                max="1"
                step="0.01"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                className="w-full"
              />
            </div>
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

        <div className="flex flex-col space-y-3 w-2/5 items-center">
          <h2 className="text-lg font-semibold">Teste:</h2>
          {!previewImages.image1 && (
            <div className="flex h-[500px] items-center">
              <p>Selecione um teste para exibir a visualização.</p>
            </div>
          )}
          {previewImages.image1 && (
            <Image
              src={previewImages.image1}
              alt="Imagem carregada 1"
              className="rounded-lg shadow-lg"
              height={0}
              width={0}
              style={{ width: "auto", height: "500px" }}
            />
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
                <Image
                  key={index}
                  src={src}
                  alt={`Imagem carregada ${index + 2}`}
                  className="rounded-lg shadow-lg"
                  width={0}
                  height={0}
                  style={{ width: "auto", height: "100px" }}
                />
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col space-y-3 w-2/5 items-center">
          <h2 className="text-lg font-semibold">Teste corrigido:</h2>
          {!editedImage && (
            <div className="flex h-[500px] items-center">
              <p>
                Quando o input for processado, a imagem marcada será exibida
                aqui.
              </p>
            </div>
          )}
          {editedImage && (
            <Image
              src={editedImage}
              alt="Imagem editada"
              className="rounded-lg shadow-lg"
              width={0}
              height={0}
              style={{ width: "auto", height: "500px" }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

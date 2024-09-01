"use client"; // Ativa o modo client-side para o componente

import React, { useState } from "react";
import axios from "axios";
import Image from "next/image";

export default function Home() {
  const [selectedFiles, setSelectedFiles] = useState({
    image1: null,
    image2: null,
  });
  const [editedImage, setEditedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null); // Estado para gerenciar erros
  const [previewImages, setPreviewImages] = useState({
    image1: null,
    image2: null,
  });

  const handleFileChange = (event) => {
    const { name, files } = event.target;
    setSelectedFiles((prevFiles) => ({
      ...prevFiles,
      [name]: files[0],
    }));
    setPreviewImages((prevImages) => ({
      ...prevImages,
      [name]: URL.createObjectURL(files[0]),
    }));
    setEditedImage(null); // Limpa a imagem processada quando um novo arquivo é selecionado
    setError(null); // Limpa o erro ao selecionar um novo arquivo
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedFiles.image1 || !selectedFiles.image2) return;

    const formData = new FormData();
    formData.append("test_image", selectedFiles.image1);
    formData.append("box_image", selectedFiles.image2);

    setLoading(true);
    setError(null); // Reseta o erro ao começar a requisição

    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/mark_answers/?threshold=0.5&prediction_threshold=0.9",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          responseType: "blob",
        }
      );
      console.log("Resposta do servidor:", response);
      const imageUrl = URL.createObjectURL(response.data);
      setEditedImage(imageUrl);
    } catch (error) {
      console.error("Erro ao enviar as imagens:", error);
      setError("Falha ao processar as imagens. Tente novamente."); // Define a mensagem de erro
    } finally {
      setLoading(false);
    }
  };

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
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <button
              type="submit"
              disabled={
                !selectedFiles.image1 || !selectedFiles.image2 || loading
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
          {previewImages.image1 && (
            <div>
              <h2 className="text-lg font-semibold">Teste:</h2>
              <Image
                src={previewImages.image1}
                alt="Imagem carregada 1"
                className="rounded-lg shadow-lg"
                width={500} // Ajuste conforme necessário
                height={500} // Ajuste conforme necessário
                objectFit="contain"
              />
            </div>
          )}

          {previewImages.image2 && (
            <div>
              <h2 className="text-lg font-semibold">Template:</h2>
              <Image
                src={previewImages.image2}
                alt="Imagem carregada 2"
                className="rounded-lg shadow-lg"
                width={100} // Ajuste conforme necessário
                height={100} // Ajuste conforme necessário
                objectFit="contain"
              />
            </div>
          )}
        </div>

        {editedImage && (
          <div className="w-2/5 items-center">
            <h2 className="text-lg font-semibold">Teste corrigido:</h2>
            <Image
              src={editedImage}
              alt="Imagem editada"
              className="rounded-lg shadow-lg"
              width={500} // Ajuste conforme necessário
              height={500} // Ajuste conforme necessário
            />
          </div>
        )}
      </div>
    </div>
  );
}

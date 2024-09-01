import { useState, useRef, useEffect } from "react";
import axios from "axios";

export const useImageProcessing = (threshold) => {
  const [selectedFiles, setSelectedFiles] = useState({
    image1: null,
    image2: [],
  });
  const [objects, setObjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [previewImages, setPreviewImages] = useState({
    image1: null,
    image2: [],
  });
  const debounceTimeout = useRef(null);

  const handleFileChange = (event) => {
    const { name, files } = event.target;
    if (files.length === 0) return;

    if (name === "image1") {
      setSelectedFiles((prevFiles) => ({ ...prevFiles, [name]: files[0] }));
      setPreviewImages((prevImages) => ({
        ...prevImages,
        [name]: URL.createObjectURL(files[0]),
      }));
    } else if (name === "image2") {
      const fileArray = Array.from(files);
      setSelectedFiles((prevFiles) => ({ ...prevFiles, [name]: fileArray }));
      setPreviewImages((prevImages) => ({
        ...prevImages,
        [name]: fileArray.map((file) => URL.createObjectURL(file)),
      }));
    }
    setObjects([]);
    setError(null);
  };

  const debounceProcessImages = (rota) => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    debounceTimeout.current = setTimeout(() => {
      processImages(rota);
    }, 800);
  };

  const processImages = async (rota) => {
    if (!selectedFiles.image1 || selectedFiles.image2.length === 0) return;

    const formData = new FormData();
    formData.append("test_image", selectedFiles.image1);
    selectedFiles.image2.forEach((file) => {
      formData.append("box_images", file);
    });

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        `http://127.0.0.1:8000/${rota}/?threshold=${threshold}`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      setObjects(response.data.objects);
    } catch (error) {
      console.error("Erro ao enviar as imagens:", error);
      setError("Falha ao processar as imagens. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedFiles.image1 && selectedFiles.image2.length > 0) {
      debounceProcessImages("find_boxes");
    }
  }, [selectedFiles.image1, selectedFiles.image2, threshold]);

  return {
    selectedFiles,
    objects,
    loading,
    error,
    previewImages,
    handleFileChange,
    processImages,
  };
};

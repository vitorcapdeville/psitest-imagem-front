import axios from "axios";

export async function createImage(image) {
  const formData = new FormData();
  formData.append("image", image);
  const response = await axios.post(
    `${process.env.NEXT_PUBLIC_API_URL}/save_image`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );
  return response;
}

export async function findBoxes(image_id, box_images, threshold) {
  const formData = new FormData();
  box_images.forEach((file) => {
    formData.append("box_images", file);
  });

  const response = await axios.post(
    `${process.env.NEXT_PUBLIC_API_URL}/find_boxes/?image_id=${image_id}&threshold=${threshold}`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );
  return response;
}

export async function findAnswers(image_id, threshold) {
  const response = await axios.post(
    `${process.env.NEXT_PUBLIC_API_URL}/find_answers/?image_id=${image_id}&prediction_threshold=${threshold}`
  );
  return response;
}

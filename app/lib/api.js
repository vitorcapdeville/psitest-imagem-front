import axios from "axios";

export async function createImage(image) {
  return {
    _id: "66e6d9e91b5119d338adcd0c",
    path: "uploaded_images/101fbe7f-e351-44a0-b08c-17350bbf6001_exam0_1_1.png",
    size: {
      width: 1652,
      height: 2338,
      depth: 3,
    },
    objects: [],
  };
  // const formData = new FormData();
  // formData.append("image", image);
  // const response = await axios.post(
  //   `${process.env.NEXT_PUBLIC_API_URL}/save_image`,
  //   formData,
  //   {
  //     headers: { "Content-Type": "multipart/form-data" },
  //   }
  // );
  // return response.data;
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
  return response.data;
}

export async function findAnswers(image_id) {
  const response = await axios.post(
    `${process.env.NEXT_PUBLIC_API_URL}/find_answers/?image_id=${image_id}`
  );
  return response.data;
}

export async function getQa(image_id) {
  const response = await axios.get(
    `${process.env.NEXT_PUBLIC_API_URL}/questions_and_answers/?image_id=${image_id}`
  );
  return response.data;
}

export async function updateImageObjects(image_id, objects) {
  const response = await axios.put(
    `${process.env.NEXT_PUBLIC_API_URL}/update_image/?image_id=${image_id}`,
    objects,
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  return response.data;
}

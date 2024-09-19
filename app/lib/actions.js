import {
  createImage,
  findAnswers,
  findBoxes,
  getQa,
  updateImageObjects,
} from "@/app/lib/api";

export async function saveImageAction(selectedImage, fixedHeight) {
  const createImageResponse = await createImage(selectedImage);
  const imageId = createImageResponse._id;
  const qaResponse = await getQa(imageId);

  const imageDimensions = createImageResponse.size;
  const aspectRatio = imageDimensions.width / imageDimensions.height;
  const scaledDimensions = {
    width: fixedHeight * aspectRatio,
    height: fixedHeight,
  };
  const objects = createImageResponse.objects;
  return { imageId, imageDimensions, scaledDimensions, qaResponse, objects };
}

export async function findBoxesAction(
  imageId,
  selectedTemplates,
  thresholdTemplate,
  fixedHeight
) {
  const imageAnnotations = await findBoxes(
    imageId,
    selectedTemplates,
    thresholdTemplate
  );
  const qaResponse = await getQa(imageId);
  const imageDimensions = imageAnnotations.size;
  const aspectRatio = imageDimensions.width / imageDimensions.height;
  const scaledDimensions = {
    width: fixedHeight * aspectRatio,
    height: fixedHeight,
  };
  const objects = imageAnnotations.objects;
  return { objects, qaResponse, imageDimensions, scaledDimensions };
}

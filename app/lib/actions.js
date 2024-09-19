import {
  createImage,
  findAnswers,
  findBoxes,
  getQa,
  updateImageObjects,
} from "@/app/lib/api";

function getScaledDimensions(width, height, newHeight) {
  const aspectRatio = width / height;
  return {
    width: newHeight * aspectRatio,
    height: newHeight,
  };
}

export async function saveImageAction(selectedImage, fixedHeight) {
  const createImageResponse = await createImage(selectedImage);
  const imageId = createImageResponse._id;
  const qaResponse = await getQa(imageId);

  const imageDimensions = createImageResponse.size;
  const scaledDimensions = getScaledDimensions(
    imageDimensions.width,
    imageDimensions.height,
    fixedHeight
  );
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
  const scaledDimensions = getScaledDimensions(
    imageDimensions.width,
    imageDimensions.height,
    fixedHeight
  );
  const objects = imageAnnotations.objects;
  return { objects, qaResponse, imageDimensions, scaledDimensions };
}

export async function findAnswersAction(imageId, fixedHeight) {
  const imageAnnotations = await findAnswers(imageId);
  const qaResponse = await getQa(imageId);
  const imageDimensions = imageAnnotations.size;
  const scaledDimensions = getScaledDimensions(
    imageDimensions.width,
    imageDimensions.height,
    fixedHeight
  );
  const objects = imageAnnotations.objects;

  return { objects, qaResponse, imageDimensions, scaledDimensions };
}

export async function updateImageAnnotationsAction(
  imageId,
  newObjects,
  fixedHeight
) {
  const imageAnnotations = await updateImageObjects(imageId, newObjects);
  const qaResponse = await getQa(imageId);
  const imageDimensions = imageAnnotations.size;
  const scaledDimensions = getScaledDimensions(
    imageDimensions.width,
    imageDimensions.height,
    fixedHeight
  );
  const objects = imageAnnotations.objects;

  return { objects, qaResponse, imageDimensions, scaledDimensions };
}

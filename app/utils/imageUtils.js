export const calculateScaledCoordinates = (
  coord,
  scaledDimensions,
  imageDimensions
) => {
  const scaleX = scaledDimensions.width / imageDimensions.width;
  const scaleY = scaledDimensions.height / imageDimensions.height;
  return {
    x: coord.x_min * scaleX,
    y: coord.y_min * scaleY,
    width: (coord.x_max - coord.x_min) * scaleX,
    height: (coord.y_max - coord.y_min) * scaleY,
  };
};

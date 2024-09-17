export const objectsToRects = (objects, scaleX, scaleY) => {
  return objects.map((obj, index) => {
    return {
      id: index.toString(),
      x: obj.bounding_box.x_min * scaleX,
      y: obj.bounding_box.y_min * scaleY,
      width: (obj.bounding_box.x_max - obj.bounding_box.x_min) * scaleX,
      height: (obj.bounding_box.y_max - obj.bounding_box.y_min) * scaleY,
      name: obj.name,
      confidence: obj.confidence,
      scaleX: scaleX,
      scaleY: scaleY,
    };
  });
};

export const rectsToObjects = (rects) => {
  return rects.map((rect) => {
    return {
      bounding_box: {
        x_min: parseInt(rect.x / rect.scaleX),
        y_min: parseInt(rect.y / rect.scaleY),
        x_max: parseInt((rect.x + rect.width) / rect.scaleX),
        y_max: parseInt((rect.y + rect.height) / rect.scaleY),
      },
      name: rect.name,
      confidence: rect.confidence,
    };
  });
};

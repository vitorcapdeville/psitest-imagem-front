import { FaTrashAlt } from "react-icons/fa";
import { useRef, useEffect } from "react";

const CANVAS_WIDTH = 65;
const CANVAS_HEIGHT = 45;

const AnnotationEdit = ({
  image,
  rects,
  setRects,
  scaleX,
  scaleY,
  selectedId,
}) => {
  const canvasRefs = useRef([]);
  useEffect(() => {
    if (image) {
      rects.forEach((rect, index) => {
        const { x, y, width, height } = rect;

        const canvas = canvasRefs.current[index];

        if (canvas) {
          const context = canvas.getContext("2d");

          canvas.width = CANVAS_WIDTH;
          canvas.height = CANVAS_HEIGHT;

          context.drawImage(
            image,
            x / scaleX,
            y / scaleY,
            width / scaleX,
            height / scaleY,
            0,
            0,
            CANVAS_WIDTH,
            CANVAS_HEIGHT
          );
        }
      });
    }
  }, [image, rects, selectedId]);

  const handleSelectChange = (event, index) => {
    const updatedRects = [...rects];
    updatedRects[index].name = event.target.value;
    updatedRects[index].confidence = null;
    setRects(updatedRects);
  };

  const handleDeleteRect = (index) => {
    const newRects = rects.filter((rect) => rect.id !== index);
    setRects(newRects);
  };

  return (
    <>
      {rects.map((rect, index) => {
        if (rect.id === selectedId) {
          return (
            <div key={index} className="flex items-center space-x-4 mb-4">
              <canvas
                key={index}
                ref={(el) => (canvasRefs.current[index] = el)}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                style={{
                  width: "65px",
                  height: "45px",
                  border: "1px solid black",
                  marginBottom: "10px",
                }}
              />

              <select
                name="cars"
                id={`label-${index}`}
                value={rect.name}
                onChange={(e) => handleSelectChange(e, index)}
              >
                <option value="unpredicted">Unpredicted</option>
                <option value="confirmed">Confirmed</option>
                <option value="crossedout">Crossed out</option>
                <option value="empty">Empty</option>
              </select>
              <button
                onClick={() => {
                  handleDeleteRect(rect.id);
                }}
              >
                <FaTrashAlt />
              </button>
            </div>
          );
        }
        return null; // Não renderiza nada para as anotações não selecionadas
      })}
    </>
  );
};
export default AnnotationEdit;

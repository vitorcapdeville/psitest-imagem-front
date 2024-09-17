import ImagePreview from "@/app/components/ImagePreview";
import ResizableRectangle from "@/app/components/ResizableRectangle";
import { getColor } from "@/app/utils/image";
import Image from "next/image";
import { useState } from "react";
import { Layer, Stage } from "react-konva";

const ImageWithAnnotations = ({
  imageSrc,
  templatesSrc,
  scaledWidth,
  scaledHeight,
  fixedHeight,
  rects,
  templateHeight,
  handleDragMove,
  onChange,
}) => {
  const [selectedId, selectShape] = useState(null);

  const checkDeselect = (e) => {
    // deselect when clicked on empty area
    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) {
      selectShape(null);
    }
  };

  return (
    <>
      <h2 className="text-lg font-semibold">Teste:</h2>
      {!imageSrc && (
        <div className={`flex h-[${fixedHeight}px] items-center`}>
          <p>Selecione um teste para exibir a visualização.</p>
        </div>
      )}
      {imageSrc && (
        <div
          style={{
            position: "relative",
            width: scaledWidth,
            height: scaledHeight,
          }}
        >
          <ImagePreview
            src={imageSrc}
            alt="Teste"
            className="rounded-lg shadow-lg"
            width={scaledWidth}
            height={`${fixedHeight}px`}
          />
          {rects.length > 0 && (
            <Stage
              width={scaledWidth}
              height={scaledHeight}
              style={{ position: "absolute", top: 0, left: 0 }}
              onMouseDown={checkDeselect}
              onTouchStart={checkDeselect}
            >
              <Layer>
                {rects.map((rect) => {
                  return (
                    <ResizableRectangle
                      key={rect.id}
                      id={rect.id}
                      x={rect.x}
                      y={rect.y}
                      width={rect.width}
                      height={rect.height}
                      stroke={getColor(rect.name)}
                      strokeWidth={1}
                      draggable
                      onDragMove={handleDragMove}
                      isSelected={rect.id === selectedId}
                      onSelect={() => {
                        selectShape(rect.id);
                      }}
                      onChange={onChange}
                    />
                  );
                })}
              </Layer>
            </Stage>
          )}
        </div>
      )}
      <h2 className="text-lg font-semibold">Templates:</h2>
      {templatesSrc.length === 0 && (
        <div className={`flex h-[50px] items-center`}>
          <p>Selecione um template para exibir a visualização.</p>
        </div>
      )}
      {templatesSrc.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {templatesSrc.map((src, index) => (
            <Image
              key={index}
              src={src}
              alt={`Template ${index + 1}`}
              height={0}
              width={0}
              style={{
                width: "auto",
                height: `${templateHeight}px`,
              }}
            />
          ))}
        </div>
      )}
    </>
  );
};
export default ImageWithAnnotations;

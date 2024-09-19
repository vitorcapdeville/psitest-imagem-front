import { objectsToRects } from "@/app/utils/objects";

const RectControls = ({
  rects,
  setRects,
  objects,
  loading,
  scaleX,
  scaleY,
  handleSaveRects,
}) => {
  const handleResetRect = () => {
    const newRects = objectsToRects(objects, scaleX, scaleY);
    setRects(newRects);
  };

  const handleNewRect = () => {
    const x = 10;
    const y = 10;
    const width = 21;
    const height = 15;

    const newRects = rects.concat({
      id: parseInt(
        (rects.length > 0 ? rects[rects.length - 1].id : 0) + 1
      ).toString(),
      x,
      y,
      width,
      height,
      confidence: null,
      name: "unpredicted",
      scaleX,
      scaleY,
    });
    setRects(newRects);
  };
  return (
    <>
      <button
        onClick={handleNewRect}
        disabled={loading}
        className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
      >
        Adicionar caixa
      </button>
      <button
        onClick={handleResetRect}
        disabled={rects.length === 0 || loading}
        className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
      >
        Resetar
      </button>
      <button
        onClick={handleSaveRects}
        disabled={rects.length === 0 || loading}
        className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
      >
        Salvar
      </button>
    </>
  );
};
export default RectControls;

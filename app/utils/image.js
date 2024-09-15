export function getColor(name) {
  switch (name) {
    case "empty":
      return "red";
    case "confirmed":
      return "green";
    case "crossedout":
      return "yellow";
    case "unpredicted":
      return "blue";
  }
}

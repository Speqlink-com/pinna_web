import { LoaderCircle } from "lucide-react";
export default function Loading() {
  return (
    <div className="standalone-state" role="status">
      <LoaderCircle className="spin" size={28} />
      <p>Getting you connected…</p>
    </div>
  );
}

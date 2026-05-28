import Navbar from "@/components/Navbar";
import CanvasSequence from "@/components/CanvasSequence";

export default function Home() {
  return (
    <main style={{ background: "#050505", minHeight: "100vh" }}>
      <Navbar />
      <CanvasSequence />
    </main>
  );
}

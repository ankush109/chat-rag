import Image from "next/image";
import { FileUpload } from "./components/FileUpload";
import Chat from "./components/Chat";

export default function Home() {
  return (
    <div className="flex min-h-screen w-screen gap-2">
      <div className="w-[30vw] flex justify-center items-center  min-h-screen bg-gray-200">
        <FileUpload />
      </div>
      <div className="min-h-screen w-[70vw] bg-gray-200">
        <Chat />
      </div>
    </div>
  );
}

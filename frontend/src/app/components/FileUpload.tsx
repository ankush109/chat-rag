"use client";

import * as React from "react";
import { Upload } from "lucide-react";

export const FileUpload = () => {
  const handleFileUpload = async () => {
    const el = document.createElement("input");
    el.setAttribute("type", "file");
    el.setAttribute("accept", "application/pdf");
    el.click();
    el.addEventListener("change", async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const formData = new FormData();
      formData.append("pdf", file);
      await fetch("http://localhost:5000/upload-pdf", {
        method: "POST",
        body: formData,
      });
      console.log("File uploaded successfully");
    });
  };

  return (
    <div className="bg-slate-900 text-2xl w-1/2  text-white  border border-t-2 border-amber-200">
      <div
        onClick={handleFileUpload}
        className="rounded-lg p-2  flex gap-4 items-center"
      >
        <div>
          <Upload className="w-10 h-10" />
        </div>
        <div>Upload Pdf </div>
      </div>
    </div>
  );
};

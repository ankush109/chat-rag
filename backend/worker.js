import { Worker } from "bullmq";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { QdrantClient } from '@qdrant/js-client-rest'
import { QdrantVectorStore } from "@langchain/qdrant";
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import dotenv from 'dotenv';
dotenv.config();
const worker = new Worker(
  "pdf-queue",
  async (job) => {
    try {
      const { fileName, destination, path } = JSON.parse(job.data);
      console.log("Processing PDF:", fileName);
      console.log("Destination:", destination);
      console.log("Path:", path);

      // Load PDF
      const loader = new PDFLoader(path);
      const docs = await loader.load();
      console.log("Loaded docs:", docs.length);

      // Initialize embeddings
      const embeddings = new HuggingFaceInferenceEmbeddings({
        model: "sentence-transformers/all-MiniLM-L6-v2",
        apiKey: process.env.HUGGING_FACE
      });

      // Create Qdrant client
      const client = new QdrantClient({ url: "http://localhost:6333" });

      // Load vector store for existing collection
      const vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, {
        client,
        collectionName: "pdf-collection",
      });

      // Add documents
      await vectorStore.addDocuments(docs);

      console.log("Documents added to Qdrant collection: pdf-collection");
      console.log("PDF processing completed for:", fileName);
    } catch (error) {
      console.error("Error processing job:", error);
    }
  },
  {
    connection: {
      host: "localhost",
      port: 6379,
    },
  }
);

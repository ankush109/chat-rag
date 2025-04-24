import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { Queue } from 'bullmq';
import { QdrantVectorStore } from '@langchain/qdrant';
import { QdrantClient } from '@qdrant/js-client-rest';
import { HuggingFaceInferenceEmbeddings } from '@langchain/community/embeddings/hf';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();
const queue = new Queue('pdf-queue');
const GEMINI_API_KEY = process.env.GEMINI_API_KEY // move your API key to env

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY || '' });

const app = express();
const PORT = process.env.PORT || 5000;

const corsOptions = {
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST'],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

const upload = multer({ storage: storage });

app.get('/chat', async (req, res) => {
  try {
    const query =req.query.message || 'What is the capital of France?';
    if (!query) {
      return res.status(400).json({ message: 'Query is required' });
    }
    console.log("Received query:", query);
    console.log("Query:", query);

    const collectionName = "pdf-collection";
    const embeddings = new HuggingFaceInferenceEmbeddings({
      model: "sentence-transformers/all-MiniLM-L6-v2",
      apiKey: process.env.HUGGING_FACE, // move your HF key to env
    });

    const client = new QdrantClient({ url: "http://localhost:6333" });
    const vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, {
      client,
      collectionName,
    });

    const geminiResponse = await ai.models.generateContent({
      model: 'gemini-2.0-flash-001',
      
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `You are a helpful assistant. Answer the question based on the context provided.\nContext: ${query}\nQuestion: ${query}`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 100,
        topP: 0.9,
        topK: 40,
        stopSequences: ['\n'],
      },
    });

    const geminiAnswer = geminiResponse?.candidates?.[0]?.content?.parts?.[0]?.text || 'No answer';

    const retriever = vectorStore.asRetriever();
    const results = await retriever.invoke(query, {
      k: 2,
      filter: {
        $and: [
          { "metadata.source": { $eq: "source1" } },
          { "metadata.date": { $gte: "2023-01-01" } },
        ],
      },
    });

    if (!results.length) {
      return res.status(404).json({ message: 'No results found' });
    }

    return res.status(200).json({
      message: 'Query processed successfully',
      geminiAnswer,
     
    });
  } catch (error) {
    console.error("Error in /chat:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/upload-pdf', upload.single("pdf"), (req, res) => {
  const file = req.file;
  if (!file) {
    return res.status(400).send('No file uploaded.');
  }

  queue.add('pdf-processing', {
    fileName: file.originalname,
    destination: file.destination,
    path: file.path,
  });

  res.status(200).json({ message: 'File uploaded successfully', file });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

import json
from pathlib import Path

from ai.embeddings import get_embedding
from ai.vector_store import VectorStore

class RAGPipeline:
    def __init__(self):
        self.vector_store = None
    # Loads job descriptions from a JSON file, generates embeddings for each job description, and stores them in a vector store for later retrieval.
    def load_jobs(self):
        data_file = Path(__file__).resolve().parents[1] / "data" / "jobs.json"
        with open(data_file, "r", encoding="utf-8") as f:
            jobs = json.load(f)

        texts = [job["description"] for job in jobs]
        embeddings = [get_embedding(text) for text in texts]

        dim = len(embeddings[0])
        self.vector_store = VectorStore(dim)
        self.vector_store.add_vectors(embeddings, jobs)
    # Given the text extracted from a CV, this method generates an embedding for the CV text and retrieves the most relevant job descriptions from the vector store based on similarity.
    def retrieve_jobs(self, cv_text):
        if self.vector_store is None:
            self.load_jobs()

        query_embedding = get_embedding(cv_text)
        results = self.vector_store.search(query_embedding)

        return results
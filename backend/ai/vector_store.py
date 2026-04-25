import faiss  # type: ignore[import-not-found]
import numpy as np

class VectorStore: 
    # This class implements a simple vector store using FAISS for efficient similarity search. It allows adding vectors with associated metadata and searching for the most similar vectors based on a query vector.
    def __init__(self, dim):
        self.index = faiss.IndexFlatL2(dim)
        self.data = []
    # The add_vectors method takes a list of vectors and their corresponding metadata, adds the vectors to the FAISS index, and stores the metadata for later retrieval during search operations.
    def add_vectors(self, vectors, metadata):
        self.index.add(np.array(vectors).astype('float32'))
        self.data.extend(metadata)
    # The search method takes a query vector and an optional parameter k (default is 3) to specify how many similar vectors to retrieve. It uses the FAISS index to find the nearest neighbors of the query vector and returns the associated metadata for those neighbors.
    def search(self, query_vector, k=3):
        distances, indices = self.index.search(
            np.array([query_vector]).astype('float32'), k
        )

        results = []
        for idx in indices[0]:
            results.append(self.data[idx])

        return results
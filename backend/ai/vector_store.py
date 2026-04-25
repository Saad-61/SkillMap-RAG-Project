import faiss  # type: ignore[import-not-found]
import numpy as np

class VectorStore:
    def __init__(self, dim):
        self.index = faiss.IndexFlatL2(dim)
        self.data = []

    def add_vectors(self, vectors, metadata):
        self.index.add(np.array(vectors).astype('float32'))
        self.data.extend(metadata)

    def search(self, query_vector, k=3):
        distances, indices = self.index.search(
            np.array([query_vector]).astype('float32'), k
        )

        results = []
        for idx in indices[0]:
            results.append(self.data[idx])

        return results
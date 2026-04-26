import json
from pathlib import Path
import numpy as np

from ai.embeddings import get_embedding
from ai.vector_store import VectorStore
from utils.skill_extractor import extract_skills
from utils.link_extractor import extract_links

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

    
    def retrieve_jobs_with_scores(self, cv_text):
        if self.vector_store is None:
            self.load_jobs()

        query_embedding = get_embedding(cv_text)
        links = extract_links(cv_text)

        distances, indices = self.vector_store.index.search(
            np.array([query_embedding]).astype('float32'), 3
        )

        # extract structured skills
        cv_skills = extract_skills(cv_text)

        results = []

        for i, idx in enumerate(indices[0]):
            job = self.vector_store.data[idx]

            # --- normalized base score ---
            base_score = float(1 / (1 + distances[0][i]) * 100)

            # extract job skills
            job_text = job.get("title", "") + " " + job.get("description", "")
            job_skills = extract_skills(job_text)

            # overlap using real skills
            overlap = int(len(set(cv_skills) & set(job_skills)))

            # Boost for matched skills and penalize no overlap.
            boost = overlap * 8
            penalty = 15 if overlap == 0 else 0

            final_score = base_score + boost - penalty
            final_score = max(0, min(100, final_score))

            score_value = float(round(final_score, 2))

            job_copy = job.copy()
            job_copy["score"] = score_value
            job_copy["overlap"] = overlap
            job_copy["matched_skills"] = list(set(cv_skills) & set(job_skills))

            results.append({
                **job_copy,
                "score": score_value,
                "overlap": overlap,
                "matched_skills": list(set(cv_skills) & set(job_skills)),
                "priority": int(overlap)
            })
            results = sorted(
                results,
                key=lambda x: (x["priority"], x["score"]),
                reverse=True
)

        filtered_results = [job for job in results if job["overlap"] > 0]

        # Fallback: if nothing overlaps at all, return a small top slice instead of an empty list.
        if not filtered_results:
            filtered_results = results[:2]

        return {
            "matched_jobs": filtered_results,
            "links": links,
        }
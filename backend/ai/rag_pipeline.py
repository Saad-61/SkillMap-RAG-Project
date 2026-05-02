import json
from pathlib import Path
import numpy as np

from ai.embeddings import get_embedding
from ai.vector_store import VectorStore
from services.job_cache import get_cached_jobs
from utils.skill_extractor import extract_skills
from utils.link_extractor import extract_links


class RAGPipeline:
    def __init__(self):
        self.vector_store = None
    # Loads job descriptions from a JSON file, generates embeddings for each job description, and stores them in a vector store for later retrieval.
    # def load_jobs(self):
    #     data_file = Path(__file__).resolve().parents[1] / "data" / "jobs.json"
    #     with open(data_file, "r", encoding="utf-8") as f:
    #         jobs = json.load(f)

    #     texts = [job["description"] for job in jobs]
    #     embeddings = [get_embedding(text) for text in texts]

    #     dim = len(embeddings[0])
    #     self.vector_store = VectorStore(dim)
    #     self.vector_store.add_vectors(embeddings, jobs)

    
    # This method checks if the vector store is initialized, and if not, it loads the job descriptions and their embeddings. It then generates an embedding for the input CV text and retrieves the most relevant job descriptions based on similarity from the vector store.
    def load_jobs(self):
        jobs = get_cached_jobs()
        self.jobs = jobs

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

    def compute_final_score(self, embedding_similarity, overlap, cv_skills, job_skills):
        """
        Hybrid scoring formula:
        final_score = 0.6 * embedding_similarity + 0.4 * skill_overlap_score
        
        With skill-aware ranking: penalize 0 overlap heavily
        """
        # Normalize embedding_similarity to 0-100 range
        embedding_score = embedding_similarity * 100
        
        # Calculate skill overlap score (0-100)
        overlap_score = min(overlap / 5, 1.0) * 100
        
        # Hybrid formula: 60% embeddings, 40% skills
        final_score = (0.6 * embedding_score) + (0.4 * overlap_score)
        
        # CRITICAL: Heavy penalty if zero skill overlap
        if overlap == 0:
            final_score *= 0.7  # 30% reduction for no overlap
        
        return round(final_score, 2)

    def generate_evidence(self, cv_skills, job_skills, cv_text, job_text):
        """
        Generate human-readable evidence of why this job matched
        Example: "Matched FastAPI, PostgreSQL from BookYourShoot project"
        """
        matched_skills = list(set(cv_skills) & set(job_skills))
        
        if matched_skills:
            # Take top 2-3 matched skills for conciseness
            top_skills = matched_skills[:3]
            evidence = f"Matched: {', '.join(top_skills)}"
            return evidence
        return "Semantic match on job description"

    def calculate_resume_score(self, cv_skills, cv_text, cv_links=None):
        """
        Calculate overall resume quality score (0-100)
        Based on:
        - Skill count
        - Project mentions
        - Link presence
        """
        # Skill coverage: max 40 points
        skill_score = min(len(cv_skills) * 5, 40)
        
        # Project count: max 30 points (find "project", "built", "developed" mentions)
        project_mentions = cv_text.lower().count("project") + \
                         cv_text.lower().count("built") + \
                         cv_text.lower().count("developed")
        project_score = min(project_mentions * 3, 30)
        
        # Links/proof: max 30 points
        links = cv_links if cv_links is not None else extract_links(cv_text)
        link_score = min(len(links) * 10, 30)
        
        resume_score = skill_score + project_score + link_score
        return round(min(resume_score, 100), 2)

    def retrieve_jobs_with_scores(self, cv_text, cv_links=None):
        if self.vector_store is None:
            self.load_jobs()

        query_embedding = get_embedding(cv_text)
        links = cv_links if cv_links is not None else extract_links(cv_text)

        distances, indices = self.vector_store.index.search(
            np.array([query_embedding]).astype('float32'), 3
        )

        # extract structured skills
        cv_skills = extract_skills(cv_text)
        resume_score = self.calculate_resume_score(cv_skills, cv_text, links)

        results = []

        for i, idx in enumerate(indices[0]):
            job = self.vector_store.data[idx]

            # --- normalized embedding similarity (0-1 range) ---
            embedding_similarity = float(1 / (1 + distances[0][i]))

            # extract job skills
            job_text = job.get("title", "") + " " + job.get("description", "")
            job_skills = extract_skills(job_text)

            # overlap using real skills
            overlap = int(len(set(cv_skills) & set(job_skills)))
            matched_skills = list(set(cv_skills) & set(job_skills))

            # --- HYBRID SCORING ---
            final_score = self.compute_final_score(embedding_similarity, overlap, cv_skills, job_skills)
            
            # Generate evidence
            evidence = self.generate_evidence(cv_skills, job_skills, cv_text, job_text)

            results.append({
                **job.copy(),
                "score": final_score,
                "overlap": overlap,
                "matched_skills": matched_skills,
                "evidence": evidence,
                "priority": int(overlap) if overlap > 0 else 0
            })

        # Sort by priority (overlap > 0) then by score
        results = sorted(
            results,
            key=lambda x: (x["priority"] > 0, x["score"]),
            reverse=True
        )

        # Filter results with skill overlap
        filtered_results = [job for job in results if job["overlap"] > 0]

        # Fallback: if nothing overlaps, return top 2 by score
        if not filtered_results:
            filtered_results = results[:2]

        return {
            "matched_jobs": filtered_results,
            "all_jobs": [job.copy() for job in self.vector_store.data],
            "links": links,
            "resume_score": resume_score,
        }
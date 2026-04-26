import numpy as np

def compute_match_score(query_embedding, job_embeddings, overlap_map=None):
    scores = []

    for job_id, emb in job_embeddings.items():
        denom = (np.linalg.norm(query_embedding) * np.linalg.norm(emb))
        if denom == 0:
            similarity = 0
        else:
            similarity = np.dot(query_embedding, emb) / denom

        score = float(similarity * 100)

        # penalty logic here
        if overlap_map is not None:
            overlap_count = overlap_map.get(job_id, 0)

            if overlap_count == 0:
                score *= 0.85

        scores.append((job_id, round(score, 2)))

    return scores
import numpy as np

def compute_match_score(query_embedding, job_embeddings, overlap_map=None):
    """
    Compute match scores using hybrid formula.
    Combines embedding similarity (60%) with skill overlap (40%).
    """
    scores = []

    for job_id, emb in job_embeddings.items():
        denom = (np.linalg.norm(query_embedding) * np.linalg.norm(emb))
        if denom == 0:
            similarity = 0
        else:
            similarity = np.dot(query_embedding, emb) / denom

        # Embedding component (60%)
        embedding_score = similarity * 100
        
        # Skill overlap component (40%)
        overlap_count = 0
        if overlap_map is not None:
            overlap_count = overlap_map.get(job_id, 0)
        
        overlap_score = min(overlap_count / 5, 1.0) * 100
        
        # Hybrid formula: 60% embeddings, 40% skills
        score = (0.6 * embedding_score) + (0.4 * overlap_score)
        
        # CRITICAL: Heavy penalty if zero skill overlap
        if overlap_count == 0:
            score *= 0.7  # 30% reduction
        
        scores.append((job_id, round(score, 2)))

    return scores
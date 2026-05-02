import json
from pathlib import Path
from datetime import datetime
from typing import Optional, List, Dict, Any


class ResultsHistory:
    """
    Manages CV analysis results history.
    Stores results locally (temporary), can be migrated to database later.
    """
    
    def __init__(self, history_file: Optional[Path] = None):
        if history_file is None:
            # Default to backend/models/history.json
            history_file = Path(__file__).resolve().parent / "history.json"
        
        self.history_file = history_file
        self.history_file.parent.mkdir(parents=True, exist_ok=True)
        
        if not self.history_file.exists():
            self.history_file.write_text(json.dumps([], indent=2))

    def save_result(self, cv_name: str, results: Dict[str, Any]) -> str:
        """
        Save analysis results with timestamp and CV name.
        
        Args:
            cv_name: Name/identifier of the CV
            results: The analysis results dictionary containing:
                - matched_jobs
                - links
                - resume_score
                - analysis (LLM analysis if available)
        
        Returns:
            result_id: Unique identifier for this result
        """
        history = self._load_history()
        
        result_id = f"{datetime.now().isoformat()}__{cv_name}".replace(" ", "_").replace(":", "-")
        
        entry = {
            "id": result_id,
            "cv_name": cv_name,
            "timestamp": datetime.now().isoformat(),
            "results": {
                "matched_jobs": results.get("matched_jobs", []),
                "resume_score": results.get("resume_score", 0),
                "links": results.get("links", []),
                "analysis": results.get("analysis", None),
            }
        }
        
        history.append(entry)
        self._save_history(history)
        
        return result_id

    def get_result(self, result_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve a specific result by ID"""
        history = self._load_history()
        for entry in history:
            if entry["id"] == result_id:
                return entry
        return None

    def get_cv_history(self, cv_name: str) -> List[Dict[str, Any]]:
        """Get all results for a specific CV"""
        history = self._load_history()
        return [entry for entry in history if entry["cv_name"] == cv_name]

    def get_all_results(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Get all results (most recent first)"""
        history = self._load_history()
        return history[-limit:][::-1]

    def clear_history(self):
        """Clear all history"""
        self._save_history([])

    def _load_history(self) -> List[Dict[str, Any]]:
        """Load history from file"""
        try:
            content = self.history_file.read_text()
            return json.loads(content) if content else []
        except (json.JSONDecodeError, FileNotFoundError):
            return []

    def _save_history(self, history: List[Dict[str, Any]]):
        """Save history to file"""
        self.history_file.write_text(json.dumps(history, indent=2))


# Global history instance
_results_history = ResultsHistory()


def save_analysis_result(cv_name: str, results: Dict[str, Any]) -> str:
    """Save analysis results to history"""
    return _results_history.save_result(cv_name, results)


def get_analysis_result(result_id: str) -> Optional[Dict[str, Any]]:
    """Retrieve a specific analysis result"""
    return _results_history.get_result(result_id)


def get_cv_analysis_history(cv_name: str) -> List[Dict[str, Any]]:
    """Get all analyses for a specific CV"""
    return _results_history.get_cv_history(cv_name)


def get_all_analyses(limit: int = 50) -> List[Dict[str, Any]]:
    """Get all saved analyses"""
    return _results_history.get_all_results(limit)

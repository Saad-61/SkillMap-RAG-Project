import re

# Broad curated skill list for CV and job-description extraction.
# This is not literally every skill, but it covers the main software, AI,
# data, cloud, DevOps, product, and soft-skill terms commonly seen in this project.
SKILL_KEYWORDS = [
    # Languages
    "python",
    "java",
    "c",
    "c++",
    "c#",
    "javascript",
    "typescript",
    "go",
    "golang",
    "rust",
    "php",
    "ruby",
    "swift",
    "kotlin",
    "scala",
    "r",
    "matlab",
    "sql",
    "bash",
    "powershell",

    # Frontend
    "html",
    "css",
    "sass",
    "scss",
    "tailwindcss",
    "bootstrap",
    "react",
    "react.js",
    "next.js",
    "vue",
    "vue.js",
    "angular",
    "svelte",
    "redux",
    "zustand",
    "graphql",

    # Backend / APIs
    "node.js",
    "express",
    "fastapi",
    "flask",
    "django",
    "spring boot",
    "nestjs",
    "rest",
    "rest api",
    "restful api",
    "api design",
    "microservices",
    "monolith",
    "authentication",
    "authorization",
    "jwt",
    "oauth",
    "oauth2",
    "microservice",

    # Databases / storage
    "mysql",
    "postgresql",
    "postgres",
    "sqlite",
    "mongodb",
    "redis",
    "supabase",
    "firebase",
    "mariadb",
    "dynamodb",
    "elasticsearch",
    "vector database",

    # Data / analytics / ML / AI
    "machine learning",
    "deep learning",
    "artificial intelligence",
    "nlp",
    "natural language processing",
    "computer vision",
    "data science",
    "data analysis",
    "data engineering",
    "pandas",
    "numpy",
    "scikit-learn",
    "sklearn",
    "tensorflow",
    "pytorch",
    "keras",
    "transformers",
    "sentence transformers",
    "openai",
    "gemini",
    "prompt engineering",
    "embedding",
    "embeddings",
    "rag",
    "retrieval augmented generation",
    "llm",
    "large language model",

    # DevOps / cloud / deployment
    "aws",
    "amazon web services",
    "azure",
    "gcp",
    "google cloud",
    "cloud",
    "docker",
    "docker-compose",
    "kubernetes",
    "terraform",
    "ansible",
    "jenkins",
    "github actions",
    "ci/cd",
    "cicd",
    "deployment",
    "render",
    "railway",
    "vercel",
    "netlify",
    "linux",
    "ubuntu",

    # Testing / quality
    "testing",
    "unit testing",
    "integration testing",
    "end-to-end testing",
    "e2e testing",
    "pytest",
    "jest",
    "mocha",
    "chai",
    "cypress",
    "playwright",
    "selenium",
    "postman",
    "bug tracking",
    "debugging",
    "qa",
    "quality assurance",

    # Version control / collaboration
    "git",
    "github",
    "gitlab",
    "bitbucket",
    "code review",
    "agile",
    "scrum",
    "kanban",
    "jira",
    "confluence",

    # Security / performance / architecture
    "security",
    "application security",
    "encryption",
    "rate limiting",
    "caching",
    "performance optimization",
    "scalability",
    "system design",
    "architecture",
    "load balancing",
    "observability",
    "logging",
    "monitoring",
    "tracing",

    # Product / process / soft skills
    "communication",
    "teamwork",
    "leadership",
    "problem solving",
    "critical thinking",
    "time management",
    "adaptability",
    "collaboration",
    "presentation",
    "stakeholder management",
    "project management",
    "documentation",
    "research",
]


def clean_text(text: str) -> str:
    text = text.lower()
    text = re.sub(r"[^a-z0-9\s+.#]", " ", text)  # keep tech chars
    return text


def extract_skills(text: str):
    text = clean_text(text)

    found_skills = set()

    for skill in SKILL_KEYWORDS:
        # match whole word
        pattern = r"\b" + re.escape(skill) + r"\b"
        if re.search(pattern, text):
            found_skills.add(skill)

    return sorted(found_skills)
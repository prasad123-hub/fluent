"""Lightweight Hindi/Hinglish detection (lexicon). The LLM does the nuanced check via log_code_switch."""

from __future__ import annotations

import re

# Common romanised Hindi/Marathi words that show up in Hinglish speech. Deliberately excludes
# words that are also English ("to", "me", "so") to keep false positives low.
HINDI_LEXICON: dict[str, str] = {
    "matlab": "I mean",
    "yaar": "my friend",
    "haan": "yes",
    "nahi": "no",
    "nahin": "no",
    "acha": "okay",
    "accha": "okay",
    "theek": "fine",
    "thik": "fine",
    "bahut": "very",
    "thoda": "a little",
    "kyunki": "because",
    "lekin": "but",
    "magar": "but",
    "kal": "yesterday / tomorrow",
    "aaj": "today",
    "abhi": "right now",
    "bas": "that's it",
    "karna": "to do",
    "karte": "doing",
    "hota": "happens",
    "hai": "is",
    "hain": "are",
    "tha": "was",
    "mera": "my",
    "meri": "my",
    "mujhe": "I / me",
    "humko": "us",
    "aap": "you",
    "kya": "what",
    "kaise": "how",
    "kyun": "why",
    "kab": "when",
    "kahan": "where",
    "bilkul": "absolutely",
    "zyada": "more",
    "kam": "less",
    "paisa": "money",
    "paise": "money",
    "ghar": "home",
    "kaam": "work",
    "mazaa": "fun",
    "chalo": "let's go",
    "dekho": "look",
    "samajh": "understand",
    "samjha": "understood",
    "pata": "know",
    "nai": "no",
    "ho": "be",
    "wala": "the one",
    "wali": "the one",
    "jaise": "like",
    "waise": "by the way",
    "phir": "then",
    "sirf": "only",
    "zaroor": "definitely",
    "shayad": "maybe",
}

_WORD = re.compile(r"[a-zA-Z']+")


def detect_code_switch(text: str) -> list[tuple[str, str]]:
    """Returns [(hindi_word, english_suggestion)] for lexicon hits (case-insensitive, whole words)."""
    hits: list[tuple[str, str]] = []
    seen: set[str] = set()
    for m in _WORD.finditer(text):
        w = m.group(0).lower()
        if w in HINDI_LEXICON and w not in seen:
            seen.add(w)
            hits.append((w, HINDI_LEXICON[w]))
    return hits

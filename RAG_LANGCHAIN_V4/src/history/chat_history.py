from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from pymongo import ASCENDING, DESCENDING, MongoClient
from pymongo.collection import Collection


class ChatHistoryStore:
    def __init__(
        self,
        mongo_uri: str,
        database_name: str,
        history_collection: str = "chat_history",
        summary_collection: str = "chat_history_summary",
        sliding_window: int = 8,
        summary_trigger: int = 20,
    ) -> None:
        self.client = MongoClient(mongo_uri)
        db = self.client[database_name]
        self.history_col: Collection = db[history_collection]
        self.summary_col: Collection = db[summary_collection]
        self.sliding_window = sliding_window
        self.summary_trigger = summary_trigger

        self.history_col.create_index(
            [("user_id", ASCENDING), ("session_id", ASCENDING), ("created_at", DESCENDING)]
        )
        self.summary_col.create_index([("user_id", ASCENDING), ("session_id", ASCENDING)], unique=True)

    def append_turn(
        self,
        user_id: str,
        session_id: str,
        role: str,
        content: str,
        route: str | None = None,
        extra: dict[str, Any] | None = None,
    ) -> None:
        doc: dict[str, Any] = {
            "user_id": user_id,
            "session_id": session_id,
            "role": role,
            "content": content,
            "route": route,
            "created_at": datetime.now(UTC),
        }
        if extra:
            doc["extra"] = extra
        self.history_col.insert_one(doc)

    def _summarize_turns(self, turns: list[dict[str, Any]]) -> str:
        if not turns:
            return ""
        lines: list[str] = []
        for turn in turns[-12:]:
            role = turn.get("role", "unknown")
            text = str(turn.get("content", "")).strip().replace("\n", " ")
            lines.append(f"{role}: {text[:180]}")
        return " | ".join(lines)

    def _update_summary_if_needed(self, user_id: str, session_id: str, turns: list[dict[str, Any]]) -> str:
        if len(turns) < self.summary_trigger:
            summary_doc = self.summary_col.find_one({"user_id": user_id, "session_id": session_id})
            return str(summary_doc.get("summary", "")) if summary_doc else ""

        old_turns = turns[:-self.sliding_window]
        summary = self._summarize_turns(old_turns)
        self.summary_col.update_one(
            {"user_id": user_id, "session_id": session_id},
            {
                "$set": {
                    "summary": summary,
                    "updated_at": datetime.now(UTC),
                }
            },
            upsert=True,
        )
        return summary

    def get_context(self, user_id: str, session_id: str) -> dict[str, Any]:
        turns_cursor = self.history_col.find(
            {"user_id": user_id, "session_id": session_id},
            sort=[("created_at", ASCENDING)],
        )
        turns = list(turns_cursor)
        summary = self._update_summary_if_needed(user_id, session_id, turns)

        recent_turns = turns[-self.sliding_window :]
        recent_text = "\n".join(
            f"{turn.get('role', 'unknown')}: {str(turn.get('content', ''))}" for turn in recent_turns
        )

        return {
            "summary": summary,
            "recent_turns": recent_turns,
            "recent_text": recent_text,
            "total_turns": len(turns),
        }

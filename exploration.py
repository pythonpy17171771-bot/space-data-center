"""Collect upcoming exploration missions as a static JSON file.

The browser only reads data/exploration.json.  This keeps API credentials (if
one is configured for a higher Launch Library rate limit) on the collection
machine rather than exposing them in client-side JavaScript.
"""

import json
import os
from datetime import datetime, timezone
from pathlib import Path

import requests


BASE_DIR = Path(__file__).resolve().parent
OUTPUT_FILE = BASE_DIR / "data" / "exploration.json"
API_URL = "https://ll.thespacedevs.com/2.3.0/launches/upcoming/"
SOURCE_URL = "https://ll.thespacedevs.com/docs/"
EXPLORATION_TYPES = {
    "Planetary Science",
    "Lunar Exploration",
    "Astrophysics",
    "Human Exploration",
}
KOREAN_MISSIONS = {
    "Chang'e 7": {
        "name": "창어 7",
        "description": "창어 7호는 궤도선·착륙선·소형 도약 탐사선·로버로 구성된 달 남극 탐사 임무입니다. 달 토양의 물 얼음을 포함해 남극 지역의 표면 환경을 조사합니다.",
    },
    "Nancy Grace Roman Space Telescope": {
        "name": "낸시 그레이스 로만 우주망원경",
        "description": "NASA의 적외선 우주망원경으로, 외계행성 탐색과 우주의 팽창 및 암흑에너지 연구를 수행합니다.",
    },
    "Crew-13": {
        "name": "크루-13",
        "description": "NASA 상업 유인 프로그램의 일환으로 크루 드래곤 우주선을 국제우주정거장으로 보내는 13번째 정규 유인 비행입니다.",
    },
    "Martian Moon eXplorer (MMX)": {
        "name": "화성 위성 탐사선(MMX)",
        "description": "일본의 과학 탐사 임무로, 화성의 위성 포보스에 착륙해 시료를 채취하고 지구로 가져오는 것을 목표로 합니다. 프랑스·독일의 소형 로버도 탑재됩니다.",
    },
    "Griffin Mission One": {
        "name": "그리핀 미션 1",
        "description": "애스트로보틱의 그리핀 달 착륙선과 엔진을 검증하는 임무입니다. 아스트로랩의 달 탐사 로버 FLIP를 탑재할 예정입니다.",
    },
    "Starliner-1": {
        "name": "스타라이너-1",
        "description": "NASA 상업 유인 프로그램의 스타라이너 첫 정규 비행입니다. 시스템 개선 사항을 검증하고 국제우주정거장에 필요한 화물을 운반합니다.",
    },
    "Shenzhou 24": {
        "name": "선저우 24",
        "description": "중국 선저우 유인우주선 프로그램의 24번째 비행 임무입니다.",
    },
    "Mars Lander": {
        "name": "화성 착륙선",
        "description": "유인 화성 탐사에 필요한 연구·개발을 지원하도록 설계된 임펄스 스페이스의 화성 착륙선 임무입니다.",
    },
}


def mission_icon(text):
    text = (text or "").lower()
    if any(word in text for word in ("moon", "lunar", "artemis")):
        return "🌕"
    if "mars" in text:
        return "🔴"
    if any(word in text for word in ("asteroid", "comet", "planetary")):
        return "☄️"
    if any(word in text for word in ("telescope", "observatory", "science")):
        return "🔭"
    return "🚀"


def main():
    # An optional key is read only from the environment on the data collector.
    # It is intentionally never written to JSON or frontend code.
    headers = {}
    api_key = os.getenv("LAUNCH_LIBRARY_API_KEY")
    if api_key:
        headers["Authorization"] = f"Token {api_key}"

    response = requests.get(
        API_URL,
        params={"limit": 100, "mode": "normal", "ordering": "net"},
        headers=headers,
        timeout=30,
    )
    response.raise_for_status()

    rows = response.json().get("results", [])
    missions = []
    seen = set()

    for launch in rows:
        mission = launch.get("mission") or {}
        name = mission.get("name") or launch.get("name")
        if (
            not name
            or name in seen
            or mission.get("type") not in EXPLORATION_TYPES
        ):
            continue

        agencies = mission.get("agencies") or []
        agency_names = [agency.get("name") for agency in agencies if agency.get("name")]
        description = mission.get("description") or launch.get("description") or "임무 설명이 제공되지 않았습니다."
        details = " ".join((name, description, mission.get("type") or ""))
        korean = KOREAN_MISSIONS.get(name, {})

        missions.append({
            "name": korean.get("name", name),
            "description": korean.get("description", description),
            "icon": mission_icon(details),
            "agency": ", ".join(agency_names) or "기관 정보 없음",
            "launch_date": launch.get("net"),
            "status": (launch.get("status") or {}).get("name") or "일정 확인 중",
            "url": launch.get("webcast_live") or launch.get("url") or "",
        })
        seen.add(name)
        if len(missions) == 8:
            break

    if not missions:
        raise RuntimeError("API returned no upcoming missions")

    payload = {
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "source": "Launch Library 2 / The Space Devs",
        "source_url": SOURCE_URL,
        "missions": missions,
    }
    OUTPUT_FILE.parent.mkdir(exist_ok=True)
    OUTPUT_FILE.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Updated {OUTPUT_FILE} ({len(missions)} missions)")


if __name__ == "__main__":
    main()
